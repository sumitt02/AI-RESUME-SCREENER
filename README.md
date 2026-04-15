# AI Resume Screener

A two-sided AI-powered resume screening platform built for recruiters and job seekers. Recruiters can bulk screen candidates and manage hiring pipelines. Candidates get personalised fit scores, skill gap analysis, and curated learning resources.

**Live Demo:** [coming soon] &nbsp;|&nbsp; **Built with:** Python · FastAPI · React · OpenAI API · SQLite

---

## What makes this different from ChatGPT

| Feature | ChatGPT | This tool |
|---|---|---|
| Resumes at once | 1 | Unlimited (parallel processing) |
| Memory across candidates | None | Full database with history |
| Duplicate detection | None | 3-level: file hash, email, skills fingerprint |
| Data isolation | None | Per-recruiter, JWT-protected |
| Learns from outcomes | No | Feedback loop built in |
| Candidate coaching | Generic | Role-specific resources per skill gap |

---

## Features

### Recruiter side
- **Bulk ZIP upload** — drop a ZIP of PDF resumes, get a ranked leaderboard in minutes
- **5-dimension AI scoring** — skill match, experience relevance, seniority fit, achievement quality, communication
- **Duplicate detection** — flags exact duplicates, same candidate (email match), and similar resumes (skills fingerprint)
- **Recruiter dashboard** — filter by status, shortlist or reject candidates, view stats
- **Side-by-side comparison** — select any two candidates and compare dimension by dimension
- **Data isolation** — each recruiter sees only their own candidates, enforced at the database level

### Candidate side
- **Fit score before applying** — upload your resume + paste a JD, get scored instantly
- **Skill gap analysis** — see exactly which required skills you're missing
- **Improvement suggestions** — specific, actionable tips to increase your score
- **Learning resources** — curated free and paid resources for each missing skill
- **Role-specific feedback** — not generic advice, tailored to the exact job description

### Platform
- **JWT authentication** — secure login with role-based access (recruiter vs candidate)
- **Persistent history** — all screenings saved, recruiter decisions logged
- **Single AI call per resume** — parse and score in one prompt, 2x faster than two-step approaches

---

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11+, FastAPI, Uvicorn |
| AI | OpenAI API (GPT-4o-mini), JSON mode |
| PDF parsing | PyMuPDF |
| Database | SQLite + SQLAlchemy ORM |
| Auth | JWT (python-jose), bcrypt |
| Async processing | ThreadPoolExecutor |
| Duplicate detection | MD5 hashing, skills fingerprinting |
| Frontend | React 18, Vite |
| Charts | Recharts (radar chart) |
| HTTP client | Axios |

---

## Project structure

```
resume-screener/
├── backend/
│   ├── main.py                  # FastAPI app, CORS, router registration
│   ├── routers/
│   │   ├── auth.py              # Signup, login, /me endpoints
│   │   ├── resume.py            # Upload, score, bulk-score endpoints
│   │   └── recruiter.py        # Candidates, stats, status update endpoints
│   └── services/
│       ├── auth.py              # JWT creation, bcrypt hashing, role guards
│       ├── database.py          # SQLAlchemy models, session management
│       ├── deduplicator.py      # 3-level duplicate detection logic
│       ├── parser.py            # PyMuPDF PDF text extraction
│       └── scorer.py            # OpenAI scoring, bulk processing pipeline
├── frontend/
│   └── src/
│       ├── App.jsx              # Root component, auth state, tab routing
│       └── components/
│           ├── Auth.jsx         # Login and signup forms
│           ├── Upload.jsx       # Single PDF upload with drag and drop
│           ├── BulkUpload.jsx   # ZIP upload for bulk screening
│           ├── Results.jsx      # Score display, radar chart, resources
│           ├── Leaderboard.jsx  # Ranked candidates with duplicate flags
│           └── RecruiterDashboard.jsx  # Stats, filters, comparison panel
└── requirements.txt
```

---

## Getting started

### Prerequisites
- Python 3.11+
- Node.js 18+
- OpenAI API key — get one at [platform.openai.com](https://platform.openai.com)

### Backend setup

```bash
# Clone the repo
git clone https://github.com/sumitt02/AI-RESUME-SCREENER.git
cd AI-RESUME-SCREENER

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Add your OpenAI API key
echo "OPENAI_API_KEY=your_key_here" > backend/.env

# Start the backend
cd backend
uvicorn main:app --reload
```

Backend runs at `http://127.0.0.1:8000`  
API docs at `http://127.0.0.1:8000/docs`

### Frontend setup

```bash
# In a new terminal
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## How it works

### Scoring pipeline

```
PDF upload → PyMuPDF extracts text → Single OpenAI call parses + scores
→ Returns: name, email, skills, score (0-100), breakdown (5 dims),
           matched skills, missing skills, green flags, red flags,
           improvements, learning resources
→ Duplicate check (file hash + email + skills fingerprint)
→ Save to SQLite if not duplicate
→ Return result to frontend
```

### Bulk processing

```
ZIP upload → Extract all PDFs → ThreadPoolExecutor (5 workers)
→ Each worker: extract text → OpenAI call → duplicate check
→ Collect all results → sort by score → save unique candidates
→ Return leaderboard with duplicate flags
```

### Authentication flow

```
Signup → bcrypt hash password → store user with role
→ Return JWT token (7 day expiry)

Every protected request → FastAPI reads Bearer token
→ Decode JWT → fetch user from DB → inject as dependency
→ Recruiter routes reject candidate tokens (403)
→ All DB queries filtered by user_id
```

---

## API endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup/recruiter` | None | Create recruiter account |
| POST | `/api/auth/signup/candidate` | None | Create candidate account |
| POST | `/api/auth/login` | None | Login, returns JWT |
| GET | `/api/auth/me` | Any | Get current user |
| POST | `/api/score` | Recruiter | Score single resume |
| POST | `/api/bulk-score` | Recruiter | Score ZIP of resumes |
| POST | `/api/candidate-score` | Candidate | Score resume (candidate flow) |
| GET | `/api/recruiter/candidates` | Recruiter | Get all screened candidates |
| PATCH | `/api/recruiter/candidates/:id/status` | Recruiter | Shortlist or reject |
| GET | `/api/recruiter/stats` | Recruiter | Dashboard statistics |
| DELETE | `/api/recruiter/candidates/:id` | Recruiter | Remove candidate |

---

## Screenshots

> Add screenshots here after deployment

---

## What I'd build next

- **PostgreSQL + pgvector** — replace SQLite with a production database and add vector similarity search for semantic candidate matching
- **ATS webhook integration** — connect to Greenhouse or Lever so candidates are screened automatically on application
- **Feedback loop / retraining** — use recruiter hire/reject outcomes to calibrate scoring weights per company over time
- **Bias detection layer** — flag when scores may correlate with protected attributes like university prestige or employment gaps
- **Email notifications** — notify candidates of their score and next steps automatically

---

## Author

**Sumit Singh** — Final-year CSE student at Manipal University Jaipur  
[LinkedIn](https://www.linkedin.com/in/sumit-singh-94ab12279/) · [GitHub](https://github.com/sumitt02)