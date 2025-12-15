# ResumeAI - Intelligent Resume Parsing & Matching Platform

A full-stack MVP to upload PDF resumes, parse them with NLP, and match them against job descriptions using Vector Embeddings (FAISS + SentenceTransformers).

## Features
- **Upload**: PDF extraction & storage.
- **Parsing**: PII extraction (Regex) and Skills (Keyword/NER).
- **Matching**: Semantic matching using `all-MiniLM-L6-v2` embeddings and FAISS.
- **Tech Stack**: FastAPI, Postgres, React, Docker.

## Prerequisites
- Docker and Docker Compose

## Quick Start

1. **Start the application**
   ```bash
   docker-compose up --build
   ```
   *The first run will take a few minutes to build the containers and download the NLP models.*

2. **Access the UI**
   Open [http://localhost:5173](http://localhost:5173)

3. **Access the API Docs**
   Open [http://localhost:8000/docs](http://localhost:8000/docs)

## Testing the Flow

1. **Create a sample resume** (requires python with `fpdf` or just create a text file converted to pdf):
   ```bash
   # Or just manually create a PDF named sample.pdf with text: "I know Python and Docker."
   ```

2. **Upload Resume**
   Go to the UI, select the PDF, and click Upload.

3. **Match Job**
   Enter Job Title: "Python Developer"
   Enter Description: "Looking for a developer with Python, Docker and SQL skills."
   Click "Find Best Matches".

## CLI / Curl Demo

**1. Health Check**
```bash
curl http://localhost:8000/api/health
```

**2. Upload Resume**
```bash
curl -X POST -F "file=@/path/to/resume.pdf" http://localhost:8000/api/upload-resume
```

**3. Job Match**
```bash
curl -X POST http://localhost:8000/api/job-match \
  -H "Content-Type: application/json" \
  -d '{"title": "Backend Dev", "description": "Python FastAPI", "top_k": 5}'
```

## Development
- **Backend Tests**:
  `docker-compose exec backend pytest`
