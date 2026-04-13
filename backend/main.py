from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import resume

app = FastAPI(title="Resume Screener API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(resume.router, prefix="/api")

@app.get("/")
def root():
    return {"status": "Resume Screener API is running"}