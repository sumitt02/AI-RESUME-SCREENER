from sqlalchemy import create_engine, Column, String, Float, JSON, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "..", "screener.db")

engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

class ScreeningResult(Base):
    __tablename__ = "screenings"

    id = Column(String, primary_key=True)
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
    summary = Column(Text)
    status = Column(String, default="pending")
    screened_at = Column(DateTime, default=datetime.utcnow)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()