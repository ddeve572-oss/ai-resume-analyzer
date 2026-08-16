import os
import json
import jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Depends, Header, UploadFile, File, Form, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr

# Import local modules
from backend.database import init_db, get_db_connection
from backend.parser import extract_text
from backend.analyzer import analyze_resume

# Initialize database tables and seed jobs on start
init_db()

app = FastAPI(title="AI Resume Analyzer & Job Recommendation API")

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "ai-resume-analyzer-secret-key-987654"
ALGORITHM = "HS256"

# Pydantic schemas
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class AnalyzeRequest(BaseModel):
    text: str
    filename: Optional[str] = "resume.pdf"

# Helper functions for JWT authentication
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=1)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user_id(authorization: Optional[str] = Header(None)) -> int:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing"
        )
    try:
        token_type, token = authorization.split(" ")
        if token_type.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )
        return int(user_id)
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

# API Routes

@app.post("/api/auth/register")
def register(user: UserRegister):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if user exists
    cursor.execute("SELECT id FROM users WHERE email = ?", (user.email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password
    salt = bcrypt.gensalt()
    pwd_bytes = user.password.encode('utf-8')
    pwd_hash = bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')
    
    # Create user
    try:
        cursor.execute(
            "INSERT INTO users (email, password_hash, full_name) VALUES (?, ?, ?)",
            (user.email, pwd_hash, user.full_name)
        )
        conn.commit()
        user_id = cursor.lastrowid
    except Exception as e:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating user: {str(e)}"
        )
    
    conn.close()
    
    token = create_access_token(data={"user_id": user_id, "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": user.email,
            "full_name": user.full_name
        }
    }

@app.post("/api/auth/login")
def login(credentials: UserLogin):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, email, password_hash, full_name FROM users WHERE email = ?", (credentials.email,))
    db_user = cursor.fetchone()
    conn.close()
    
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or password"
        )
    
    # Verify password
    db_password_hash = db_user["password_hash"].encode('utf-8')
    input_password_bytes = credentials.password.encode('utf-8')
    
    if not bcrypt.checkpw(input_password_bytes, db_password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or password"
        )
    
    token = create_access_token(data={"user_id": db_user["id"], "email": db_user["email"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": db_user["id"],
            "email": db_user["email"],
            "full_name": db_user["full_name"]
        }
    }

@app.post("/api/resume/upload")
async def upload_resume(
    file: UploadFile = File(...),
    current_user_id: int = Depends(get_current_user_id)
):
    # Validate file size (limit to 5MB)
    max_size = 5 * 1024 * 1024
    file_bytes = await file.read()
    if len(file_bytes) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the 5MB limit."
        )
    
    # Parse text
    try:
        parsed_text = extract_text(file_bytes, file.filename)
        if not parsed_text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not extract text from file. Please ensure the file is not empty or corrupted."
            )
        return {
            "filename": file.filename,
            "text": parsed_text
        }
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Parsing failed: {str(e)}"
        )

@app.post("/api/resume/analyze")
def analyze(
    request_data: AnalyzeRequest,
    x_gemini_api_key: Optional[str] = Header(None),
    current_user_id: int = Depends(get_current_user_id)
):
    # Determine which API Key to use (Header key vs Backend env key)
    api_key = x_gemini_api_key or os.getenv("GEMINI_API_KEY")
    
    try:
        # Run AI resume analysis
        analysis = analyze_resume(request_data.text, api_key=api_key)
        
        # Save to database
        overall_score = analysis.get("score_breakdown", {}).get("overall", 60)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO resumes (user_id, file_name, parsed_text, analysis_json, score)
            VALUES (?, ?, ?, ?, ?)
            """,
            (current_user_id, request_data.filename or "resume.pdf", request_data.text, json.dumps(analysis), overall_score)
        )
        conn.commit()
        conn.close()
        
        return analysis
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )

@app.get("/api/resume/history")
def get_resume_history(current_user_id: int = Depends(get_current_user_id)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT id, file_name, score, created_at
        FROM resumes
        WHERE user_id = ?
        ORDER BY created_at DESC
        """,
        (current_user_id,)
    )
    rows = cursor.fetchall()
    conn.close()
    
    return [
        {
            "id": row["id"],
            "file_name": row["file_name"],
            "score": row["score"],
            "created_at": row["created_at"]
        }
        for row in rows
    ]

@app.get("/api/resume/latest")
def get_latest_resume(current_user_id: int = Depends(get_current_user_id)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT id, file_name, analysis_json, score, created_at
        FROM resumes
        WHERE user_id = ?
        ORDER BY created_at DESC LIMIT 1
        """,
        (current_user_id,)
    )
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return None
        
    return {
        "id": row["id"],
        "file_name": row["file_name"],
        "analysis": json.loads(row["analysis_json"]),
        "score": row["score"],
        "created_at": row["created_at"]
    }

@app.get("/api/resume/{resume_id}")
def get_resume(resume_id: int, current_user_id: int = Depends(get_current_user_id)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT id, file_name, analysis_json, score, created_at
        FROM resumes
        WHERE id = ? AND user_id = ?
        """,
        (resume_id, current_user_id)
    )
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    return {
        "id": row["id"],
        "file_name": row["file_name"],
        "analysis": json.loads(row["analysis_json"]),
        "score": row["score"],
        "created_at": row["created_at"]
    }

@app.delete("/api/resume/{resume_id}")
def delete_resume(resume_id: int, current_user_id: int = Depends(get_current_user_id)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if resume exists and belongs to user
    cursor.execute("SELECT id FROM resumes WHERE id = ? AND user_id = ?", (resume_id, current_user_id))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Resume not found or unauthorized")
        
    # Delete resume
    cursor.execute("DELETE FROM resumes WHERE id = ?", (resume_id,))
    conn.commit()
    conn.close()
    
    return {"message": "Resume deleted successfully"}

@app.get("/api/jobs")
def get_jobs(
    search: Optional[str] = None,
    location: Optional[str] = None,
    experience_level: Optional[str] = None,
    job_type: Optional[str] = None,
    current_user_id: int = Depends(get_current_user_id)
):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get all jobs
    cursor.execute("SELECT * FROM jobs")
    job_rows = cursor.fetchall()
    
    # Get latest user resume analysis to calculate matches
    cursor.execute(
        "SELECT analysis_json FROM resumes WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
        (current_user_id,)
    )
    resume_row = cursor.fetchone()
    
    user_skills = []
    if resume_row:
        analysis = json.loads(resume_row["analysis_json"])
        skills_dict = analysis.get("skills", {})
        # Combine technical and soft skills, all lowercase
        tech_skills = [s.lower() for s in skills_dict.get("technical", [])]
        soft_skills = [s.lower() for s in skills_dict.get("soft", [])]
        user_skills = list(set(tech_skills + soft_skills))
    
    # Get saved job ids
    cursor.execute("SELECT job_id FROM saved_jobs WHERE user_id = ?", (current_user_id,))
    saved_job_ids = {row["job_id"] for row in cursor.fetchall()}
    
    conn.close()
    
    jobs_list = []
    for job in job_rows:
        # Check filters first
        if search and search.lower() not in job["title"].lower() and search.lower() not in job["company"].lower():
            continue
        if location and location.lower() != "all" and location.lower() not in job["location"].lower():
            continue
        if experience_level and experience_level.lower() != "all" and experience_level.lower() not in job["experience_level"].lower():
            continue
        if job_type and job_type.lower() != "all" and job_type.lower() not in job["job_type"].lower():
            continue
            
        # Match calculation
        job_skills = [s.strip().lower() for s in job["skills"].split(",") if s.strip()]
        
        matches = 0
        if job_skills:
            for skill in job_skills:
                # Direct check or substring check
                if skill in user_skills or any(skill in us or us in skill for us in user_skills):
                    matches += 1
            match_percentage = int((matches / len(job_skills)) * 100)
        else:
            match_percentage = 100
            
        # Give a realistic baseline match score (between 25% and 95%) if they have some overlap, or 10% if none
        if matches > 0:
            match_percentage = max(35, min(98, match_percentage))
        else:
            match_percentage = 10
            
        jobs_list.append({
            "id": job["id"],
            "title": job["title"],
            "company": job["company"],
            "location": job["location"],
            "experience_level": job["experience_level"],
            "job_type": job["job_type"],
            "description": job["description"],
            "requirements": job["requirements"],
            "skills": [s.strip() for s in job["skills"].split(",") if s.strip()],
            "apply_url": job["apply_url"],
            "match_score": match_percentage,
            "saved": job["id"] in saved_job_ids
        })
        
    # Sort jobs by match percentage (descending)
    jobs_list.sort(key=lambda x: x["match_score"], reverse=True)
    return jobs_list

@app.post("/api/jobs/save")
def save_job(
    request_data: dict,
    current_user_id: int = Depends(get_current_user_id)
):
    job_id = request_data.get("job_id")
    if not job_id:
        raise HTTPException(status_code=400, detail="job_id is required")
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            "INSERT OR IGNORE INTO saved_jobs (user_id, job_id) VALUES (?, ?)",
            (current_user_id, job_id)
        )
        conn.commit()
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))
        
    conn.close()
    return {"message": "Job saved successfully"}

@app.post("/api/jobs/unsave")
def unsave_job(
    request_data: dict,
    current_user_id: int = Depends(get_current_user_id)
):
    job_id = request_data.get("job_id")
    if not job_id:
        raise HTTPException(status_code=400, detail="job_id is required")
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            "DELETE FROM saved_jobs WHERE user_id = ? AND job_id = ?",
            (current_user_id, job_id)
        )
        conn.commit()
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))
        
    conn.close()
    return {"message": "Job unsaved successfully"}

@app.get("/api/jobs/saved")
def get_saved_jobs(current_user_id: int = Depends(get_current_user_id)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT j.* FROM jobs j
        JOIN saved_jobs sj ON j.id = sj.job_id
        WHERE sj.user_id = ?
        ORDER BY sj.created_at DESC
        """,
        (current_user_id,)
    )
    rows = cursor.fetchall()
    conn.close()
    
    return [
        {
            "id": row["id"],
            "title": row["title"],
            "company": row["company"],
            "location": row["location"],
            "experience_level": row["experience_level"],
            "job_type": row["job_type"],
            "description": row["description"],
            "requirements": row["requirements"],
            "skills": [s.strip() for s in row["skills"].split(",") if s.strip()],
            "apply_url": row["apply_url"],
            "saved": True
        }
        for row in rows
    ]

# Setup static files directory
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")
os.makedirs(frontend_dir, exist_ok=True)

# Mount frontend static files
app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
