import sqlite3
import os
import json

DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app.db")

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Create Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Create Resumes table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS resumes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        file_name TEXT NOT NULL,
        parsed_text TEXT NOT NULL,
        analysis_json TEXT NOT NULL,
        score INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    """)

    # Create Jobs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        company TEXT NOT NULL,
        location TEXT NOT NULL,
        experience_level TEXT NOT NULL, -- Entry, Mid, Senior, Lead
        job_type TEXT NOT NULL,         -- Full-time, Part-time, Contract, Remote
        description TEXT NOT NULL,
        requirements TEXT NOT NULL,
        skills TEXT NOT NULL,           -- Comma-separated list of required skills
        apply_url TEXT NOT NULL
    )
    """)

    # Create Saved Jobs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS saved_jobs (
        user_id INTEGER NOT NULL,
        job_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, job_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (job_id) REFERENCES jobs(id)
    )
    """)

    conn.commit()

    # Seed Jobs if the table is empty
    cursor.execute("SELECT COUNT(*) FROM jobs")
    if cursor.fetchone()[0] == 0:
        seed_jobs = [
            {
                "title": "Frontend Engineer",
                "company": "Stripe",
                "location": "San Francisco, CA (Hybrid)",
                "experience_level": "Mid",
                "job_type": "Full-time",
                "description": "We are seeking a creative Frontend Engineer to build beautiful, responsive web applications using React, custom CSS, and modern interface design patterns. You will collaborate closely with UI/UX designers to translate Figma layouts into interactive, fluid web products.",
                "requirements": "3+ years of experience with modern frontend frameworks. Strong command of Vanilla CSS, flexbox, grid, and transitions. Experience with responsive web design and performance optimization.",
                "skills": "JavaScript, React, HTML5, CSS3, Webpack, Responsive Design, Git, UI/UX, REST APIs",
                "apply_url": "https://stripe.com/careers"
            },
            {
                "title": "Senior React Developer",
                "company": "Meta",
                "location": "Remote (US/Canada)",
                "experience_level": "Senior",
                "job_type": "Remote",
                "description": "Join our fast-growing SaaS platform team as a Senior React Developer. You will lead the development of complex state management systems, optimize render cycles, and mentor junior developers in React patterns.",
                "requirements": "5+ years of production frontend development. Deep expertise in React hooks, context, state libraries (Redux/Zustand), and React Router. Proven experience optimizing web apps for speed and accessibility (a11y).",
                "skills": "JavaScript, React, Redux, Zustand, React Router, HTML5, CSS3, TypeScript, Web Performance, Accessibility, Git",
                "apply_url": "https://www.metacareers.com/"
            },
            {
                "title": "Backend Python Engineer",
                "company": "Netflix",
                "location": "Austin, TX",
                "experience_level": "Mid",
                "job_type": "Full-time",
                "description": "We are looking for a Python Backend Engineer to build robust REST APIs using FastAPI and Flask. You will write clean, well-tested Python code, structure databases, and integrate third-party APIs (including LLMs/OpenAI).",
                "requirements": "3+ years of python development experience. Hands-on experience with FastAPI, Flask, or Django. Solid understanding of relational databases (PostgreSQL, SQLite) and SQL querying. Experience with Docker is a plus.",
                "skills": "Python, FastAPI, Flask, SQL, PostgreSQL, SQLite, Docker, Git, REST APIs, JWT, Authentication",
                "apply_url": "https://explore.netflix.com/en/careers"
            },
            {
                "title": "DevOps Engineer",
                "company": "Amazon Web Services (AWS)",
                "location": "Seattle, WA (Hybrid)",
                "experience_level": "Mid",
                "job_type": "Full-time",
                "description": "Manage our cloud infrastructure and automate delivery pipelines. As a DevOps Engineer, you will build and maintain AWS environments, manage CI/CD pipelines, and ensure system reliability and security.",
                "requirements": "Experience managing cloud services on AWS or GCP. Proficiency in containerization (Docker, Kubernetes). Experience with CI/CD tools like GitHub Actions, GitLab CI, or Jenkins. Strong scripting skills in Bash or Python.",
                "skills": "AWS, Docker, Kubernetes, CI/CD, GitHub Actions, Terraform, Python, Linux, Bash, Cloud Security",
                "apply_url": "https://www.amazon.jobs/en/teams/aws"
            },
            {
                "title": "Lead AI / ML Specialist",
                "company": "Google AI",
                "location": "Boston, MA",
                "experience_level": "Lead",
                "job_type": "Full-time",
                "description": "Lead the design and deployment of machine learning models for predictive analysis and natural language processing. You will integrate LLMs, build RAG pipelines, and oversee the machine learning infrastructure.",
                "requirements": "Master's or Ph.D. in Computer Science, AI, or equivalent. Extensive experience with PyTorch, TensorFlow, and scikit-learn. Deep knowledge of NLP, transformers, vector embeddings, and RAG systems.",
                "skills": "Python, PyTorch, TensorFlow, Machine Learning, Deep Learning, NLP, LLM, Vector Embeddings, RAG, SQL",
                "apply_url": "https://www.google.com/about/careers"
            },
            {
                "title": "Data Scientist",
                "company": "Insight Metrics Corp",
                "location": "New York, NY",
                "experience_level": "Mid",
                "job_type": "Full-time",
                "description": "Turn data into actionable business value. In this role, you will perform exploratory data analysis, build statistical models, write complex SQL queries, and present findings through interactive dashboards (Tableau, PowerBI).",
                "requirements": "Degree in Mathematics, Statistics, Computer Science, or similar. 2+ years of data science experience. Proficient in Python (Pandas, NumPy, Scikit-learn) and SQL. Experience with data visualization tools.",
                "skills": "Python, Pandas, NumPy, SQL, Machine Learning, Statistics, Data Visualization, Tableau, PowerBI, Git",
                "apply_url": "https://example.com/apply/insight-data-scientist"
            },
            {
                "title": "Full Stack Developer",
                "company": "Airbnb",
                "location": "Remote (US)",
                "experience_level": "Mid",
                "job_type": "Full-time",
                "description": "We are seeking a versatile Full Stack Developer to build and expand our customer portal. You will write both responsive React frontend screens and Python/Node.js backend endpoints, maintaining end-to-end features.",
                "requirements": "3+ years of full-stack engineering. Competency in React, HTML, CSS, and modern JS. Competency in Node.js or Python backend frameworks. Experience designing RESTful APIs and database schemas.",
                "skills": "JavaScript, React, Node.js, Express, Python, SQL, HTML5, CSS3, REST APIs, Git, Docker",
                "apply_url": "https://careers.airbnb.com/"
            },
            {
                "title": "UI / UX Designer",
                "company": "Studio Canvas",
                "location": "Chicago, IL (Hybrid)",
                "experience_level": "Mid",
                "job_type": "Full-time",
                "description": "Shape the user experience of our client applications. You will create user flows, wireframes, prototypes, and high-fidelity layouts in Figma. Collaborate directly with developers to ensure implementation aligns with design systems.",
                "requirements": "Portfolio demonstrating strong visual and interaction design. Expert-level knowledge of Figma. Experience conducting user research, usability testing, and establishing reusable design systems.",
                "skills": "UI/UX, Figma, Wireframing, Prototyping, Design Systems, User Research, Web Design, HTML5, CSS3",
                "apply_url": "https://example.com/apply/studiocanvas-uiux"
            },
            {
                "title": "Mobile App Developer",
                "company": "Spotify",
                "location": "Remote (US)",
                "experience_level": "Mid",
                "job_type": "Contract",
                "description": "Develop and maintain mobile applications for iOS and Android using React Native. Work on offline storage synchronization, push notifications, and visual styling transitions.",
                "requirements": "2+ years of dedicated React Native development. Solid grasp of iOS/Android build systems (Xcode, Gradle). Understanding of mobile performance optimization and Apple/Google store release pipelines.",
                "skills": "React Native, JavaScript, React, Mobile Development, iOS, Android, Git, REST APIs, Redux",
                "apply_url": "https://www.lifeatspotify.com/jobs"
            },
            {
                "title": "Cybersecurity Analyst",
                "company": "Sentinel Defense",
                "location": "Washington, DC (Hybrid)",
                "experience_level": "Mid",
                "job_type": "Full-time",
                "description": "Monitor and secure our enterprise environment against threat vectors. You will perform vulnerability scanning, network traffic analysis, and draft security response documentation.",
                "requirements": "Degree in Cybersecurity, Information Systems, or equivalent experience. Certifications like Security+, CEH, or CISSP are highly valued. Experience with Linux, command-line tools, and network sniffing tools (Wireshark).",
                "skills": "Cybersecurity, Networking, Linux, Wireshark, Incident Response, Firewalls, Threat Analysis, Security+",
                "apply_url": "https://example.com/apply/sentinel-cyber"
            },
            {
                "title": "QA / Automation Engineer",
                "company": "VeriCode Labs",
                "location": "Denver, CO",
                "experience_level": "Mid",
                "job_type": "Full-time",
                "description": "Write and maintain automated testing frameworks to ensure application reliability. You will design integration, regression, and E2E tests for web applications.",
                "requirements": "2+ years of QA automation. Proficient in Cypress, Playwright, or Selenium. Scripting skills in JavaScript or Python. Experience integrating tests in CI/CD pipelines.",
                "skills": "QA, Testing, Automation, Cypress, Playwright, JavaScript, Python, Git, CI/CD",
                "apply_url": "https://example.com/apply/vericode-qa"
            },
            {
                "title": "Digital Marketing Specialist",
                "company": "BrandBoost Agency",
                "location": "Remote",
                "experience_level": "Mid",
                "job_type": "Full-time",
                "description": "Drive acquisition and brand visibility across digital channels. You will manage paid ads (Google, Meta), analyze web traffic (Google Analytics), optimize search engine rankings (SEO), and manage email marketing campaigns.",
                "requirements": "3+ years of digital marketing experience. Strong proficiency with SEO tools (SEMrush, Ahrefs) and Google Analytics. Excellent copywriter with experience managing advertisement budgets.",
                "skills": "SEO, Digital Marketing, Google Analytics, Copywriting, Social Media, Email Marketing, Content Strategy",
                "apply_url": "https://example.com/apply/brandboost-marketing"
            },
            {
                "title": "Technical Writer",
                "company": "DocuTech Systems",
                "location": "Remote",
                "experience_level": "Mid",
                "job_type": "Contract",
                "description": "Create developer-facing API documentation, guides, and tutorials. You will work closely with engineering teams to understand software components and translate complex configurations into accessible, clear guides.",
                "requirements": "Experience writing documentation for software systems or developer audiences. Competence reading code (JSON, JS, Python, HTML). Experience using Markdown, Hugo, Docusaurus, or Git.",
                "skills": "Technical Writing, Copywriting, Markdown, HTML5, Git, API Documentation, JSON, Technical Communication",
                "apply_url": "https://example.com/apply/docutech-writer"
            },
            {
                "title": "HR Specialist & Recruiter",
                "company": "TalentHub Inc",
                "location": "Atlanta, GA (Hybrid)",
                "experience_level": "Mid",
                "job_type": "Full-time",
                "description": "Manage candidate pipelines, conduct interviews, and coordinate onboarding. You will act as the point of contact for open roles, screen candidate resumes, and coordinate employee relations initiatives.",
                "requirements": "2+ years of recruiting or HR generalist experience. Excellent verbal and written communication. Familiarity with ATS systems and LinkedIn Recruiter. Human resource certifications are a plus.",
                "skills": "HR, Recruiting, Talent Acquisition, Communication, Onboarding, Employee Relations, ATS, Interviewing",
                "apply_url": "https://example.com/apply/talenthub-hr"
            },
            {
                "title": "Sales Development Representative (SDR)",
                "company": "SaaSFlow Systems",
                "location": "Remote",
                "experience_level": "Entry",
                "job_type": "Full-time",
                "description": "Kickstart your sales career! As an SDR, you will prospect, conduct cold outreach (email, phone, LinkedIn), and qualify leads for our enterprise CRM and workflow software.",
                "requirements": "Strong communication and active listening skills. High energy, resilience, and persistence. Experience with CRM tools (Salesforce, HubSpot) or customer service is preferred.",
                "skills": "Sales, Communication, CRM, HubSpot, Salesforce, Lead Generation, Outreach, Negotiation",
                "apply_url": "https://example.com/apply/saasflow-sdr"
            },
            {
                "title": "Cloud Architect",
                "company": "Apex Enterprise Solutions",
                "location": "New York, NY (Hybrid)",
                "experience_level": "Senior",
                "job_type": "Full-time",
                "description": "Design secure, scalable, and high-performance cloud architectures. You will lead cloud migrations, design multi-region disaster recovery systems, and optimize multi-million dollar cloud spends.",
                "requirements": "AWS Certified Solutions Architect Professional or equivalent GCP/Azure cert. 7+ years of IT architecture experience. Expertise in serverless architectures, microservices, and Infrastructure as Code.",
                "skills": "AWS, Cloud Security, Terraform, Kubernetes, Networking, Serverless, System Architecture, Docker, DevOps",
                "apply_url": "https://example.com/apply/apex-cloud-architect"
            },
            {
                "title": "DevSecOps Lead",
                "company": "SecureSphere Technologies",
                "location": "Dallas, TX",
                "experience_level": "Lead",
                "job_type": "Full-time",
                "description": "Embed security controls directly into our continuous delivery pipelines. You will lead static and dynamic code analysis (SAST/DAST), secure container configurations, and audit cloud identity access policies.",
                "requirements": "5+ years of DevOps or Security engineering. Deep understanding of CI/CD pipeline structures and orchestration (Kubernetes). Professional certifications in Cloud Security or DevOps.",
                "skills": "DevOps, Cybersecurity, CI/CD, Docker, Kubernetes, Terraform, AWS, Cloud Security, Threat Analysis",
                "apply_url": "https://example.com/apply/securesphere-devsecops"
            },
            {
                "title": "Machine Learning Engineer",
                "company": "OpenAI",
                "location": "Remote (US)",
                "experience_level": "Mid",
                "job_type": "Full-time",
                "description": "Deploy and maintain ML models in production. You will write efficient data processing pipelines, optimize models for inference speed, and establish model monitoring dashboards.",
                "requirements": "2+ years of ML engineering. Deep familiarity with Python data structures. Experience with PyTorch or TensorFlow. Experience writing Docker containers and deploying to cloud infrastructure.",
                "skills": "Python, Machine Learning, Deep Learning, Docker, PyTorch, TensorFlow, SQL, AWS, Git",
                "apply_url": "https://openai.com/careers"
            },
            {
                "title": "Data Analyst",
                "company": "Quantico Labs",
                "location": "Boston, MA (Hybrid)",
                "experience_level": "Entry",
                "job_type": "Full-time",
                "description": "Support business decisions with data insights. You will write queries to clean data, build interactive dashboards, and compile weekly performance reports for business units.",
                "requirements": "Bachelor's degree in Economics, Business, Analytics, or related fields. Solid SQL skills (joins, aggregations). Experience with Excel and Tableau/PowerBI. Understanding of python pandas is a plus.",
                "skills": "SQL, Data Visualization, Tableau, Excel, Python, Pandas, Statistics, Data Analysis",
                "apply_url": "https://example.com/apply/quantico-data-analyst"
            },
            {
                "title": "Project Manager",
                "company": "Synergy Delivery Group",
                "location": "Austin, TX (Hybrid)",
                "experience_level": "Mid",
                "job_type": "Full-time",
                "description": "Coordinate agile software development teams. You will manage sprint planning, resolve blockers, act as the bridge between developers and product managers, and track milestones.",
                "requirements": "3+ years of project/scrum management. Strong knowledge of Agile/Scrum. Excellent organization and leadership skills. PMP or Certified Scrum Master (CSM) is preferred.",
                "skills": "Project Management, Agile, Scrum, Jira, Communication, Leadership, Collaboration, Scheduling",
                "apply_url": "https://example.com/apply/synergy-pm"
            }
        ]
        
        for job in seed_jobs:
            cursor.execute("""
            INSERT INTO jobs (title, company, location, experience_level, job_type, description, requirements, skills, apply_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                job["title"],
                job["company"],
                job["location"],
                job["experience_level"],
                job["job_type"],
                job["description"],
                job["requirements"],
                job["skills"],
                job["apply_url"]
            ))
        conn.commit()

    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully.")
