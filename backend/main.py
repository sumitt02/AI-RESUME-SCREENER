from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import resume
from routers import recruiter
from routers import auth
from services.database import init_db

app = FastAPI(title="Resume Screener API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(resume.router, prefix="/api")
app.include_router(recruiter.router, prefix="/api/recruiter")
app.include_router(auth.router, prefix="/api/auth")

@app.on_event("startup")
def startup():
    init_db()

@app.get("/")
def root():
    return {"status": "Resume Screener API is running"}