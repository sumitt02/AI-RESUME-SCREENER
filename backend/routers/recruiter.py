from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from services.database import get_db, ScreeningResult

router = APIRouter()

class StatusUpdate(BaseModel):
    status: str

@router.get("/candidates")
def get_all_candidates(db: Session = Depends(get_db)):
    candidates = db.query(ScreeningResult).order_by(ScreeningResult.total_score.desc()).all()
    return [
        {
            "id": c.id,
            "candidate_name": c.candidate_name,
            "email": c.email,
            "filename": c.filename,
            "job_title": c.job_title,
            "total_score": c.total_score,
            "breakdown": c.breakdown,
            "matched_skills": c.matched_skills,
            "missing_skills": c.missing_skills,
            "green_flags": c.green_flags,
            "red_flags": c.red_flags,
            "improvements": c.improvements,
            "summary": c.summary,
            "status": c.status,
            "screened_at": c.screened_at.isoformat() if c.screened_at else None
        }
        for c in candidates
    ]

@router.patch("/candidates/{candidate_id}/status")
def update_status(candidate_id: str, body: StatusUpdate, db: Session = Depends(get_db)):
    if body.status not in ["shortlisted", "rejected", "pending"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    c = db.query(ScreeningResult).filter(ScreeningResult.id == candidate_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")
    c.status = body.status
    db.commit()
    return {"id": candidate_id, "status": body.status}

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    total = db.query(ScreeningResult).count()
    shortlisted = db.query(ScreeningResult).filter(ScreeningResult.status == "shortlisted").count()
    rejected = db.query(ScreeningResult).filter(ScreeningResult.status == "rejected").count()
    pending = db.query(ScreeningResult).filter(ScreeningResult.status == "pending").count()
    return {
        "total": total,
        "shortlisted": shortlisted,
        "rejected": rejected,
        "pending": pending
    }

@router.delete("/candidates/{candidate_id}")
def delete_candidate(candidate_id: str, db: Session = Depends(get_db)):
    c = db.query(ScreeningResult).filter(ScreeningResult.id == candidate_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")
    db.delete(c)
    db.commit()
    return {"deleted": candidate_id}
