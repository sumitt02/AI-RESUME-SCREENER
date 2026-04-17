from sqlalchemy import create_engine, Column, String, Float, JSON, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent.parent / ".env", override=True)

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    engine = create_engine(DATABASE_URL)
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DB_PATH = os.path.join(BASE_DIR, "..", "screener.db")
    engine = create_engine(
        f"sqlite:///{DB_PATH}",
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String)
    company_name = Column(String, nullable=True)
    full_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ScreeningResult(Base):
    __tablename__ = "screenings"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    candidate_name = Column(String)
    email = Column(String)
    filename = Column(String)
    job_title = Column(String)
    job_description = Column(Text)
    total_score = Column(Float)
    breakdown = Column(JSON)
    matched_skills = Column(JSON)
    missing_skills = Column(JSON)
    green_flags = Column(JSON)
    red_flags = Column(JSON)
    improvements = Column(JSON)
    learning_resources = Column(JSON, nullable=True)
    summary = Column(Text)
    status = Column(String, default="pending")
    file_hash = Column(String, nullable=True)
    skills_fingerprint = Column(String, nullable=True)
    screened_at = Column(DateTime, default=datetime.utcnow)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()