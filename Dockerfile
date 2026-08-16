# Use official slim Python runtime
FROM python:3.11-slim

# Set work directory
WORKDIR /app

# Install system dependencies if needed (none are strictly required for our packages)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file first to leverage docker caching
COPY backend/requirements.txt ./backend/requirements.txt

# Install python dependencies
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend files
COPY backend ./backend

# Copy static frontend files
COPY frontend ./frontend

# Set Environment Variables
ENV PORT=8000
ENV PYTHONUNBUFFERED=1

# Expose port
EXPOSE 8000

# Start server
CMD ["python", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
