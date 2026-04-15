import hashlib
from sqlalchemy.orm import Session
from services.database import ScreeningResult

def get_file_hash(file_bytes: bytes) -> str:
    return hashlib.md5(file_bytes).hexdigest()

def get_skills_fingerprint(skills: list) -> str:
    normalized = sorted([s.lower().strip() for s in skills])
    combined = ",".join(normalized)
    return hashlib.md5(combined.encode()).hexdigest()

def check_duplicate(
    db: Session,
    user_id: str,
    job_title: str,
    file_hash: str,
    candidate_email: str,
    skills_fingerprint: str
) -> dict:
    # Level 1 — exact same file for same job
    exact = db.query(ScreeningResult).filter(
        ScreeningResult.user_id == user_id,
        ScreeningResult.job_title == job_title,
        ScreeningResult.file_hash == file_hash
    ).first()

    if exact:
        return {
            "is_duplicate": True,
            "type": "exact",
            "message": f"This exact resume was already screened for {job_title}",
            "existing_id": exact.id,
            "existing_score": exact.total_score,
            "existing_candidate": exact.candidate_name,
            "screened_at": exact.screened_at.isoformat()
        }

    # Level 2 — same email, same job
    if candidate_email:
        email_match = db.query(ScreeningResult).filter(
            ScreeningResult.user_id == user_id,
            ScreeningResult.job_title == job_title,
            ScreeningResult.email == candidate_email
        ).first()

        if email_match:
            return {
                "is_duplicate": True,
                "type": "same_candidate",
                "message": f"{candidate_email} already applied for {job_title}",
                "existing_id": email_match.id,
                "existing_score": email_match.total_score,
                "existing_candidate": email_match.candidate_name,
                "screened_at": email_match.screened_at.isoformat()
            }

    # Level 3 — same skills fingerprint, same job
    skills_match = db.query(ScreeningResult).filter(
        ScreeningResult.user_id == user_id,
        ScreeningResult.job_title == job_title,
        ScreeningResult.skills_fingerprint == skills_fingerprint
    ).first()

    if skills_match:
        return {
            "is_duplicate": True,
            "type": "similar_resume",
            "message": f"A very similar resume was already screened — possibly the same candidate as {skills_match.candidate_name}",
            "existing_id": skills_match.id,
            "existing_score": skills_match.total_score,
            "existing_candidate": skills_match.candidate_name,
            "screened_at": skills_match.screened_at.isoformat()
        }

    return {"is_duplicate": False}