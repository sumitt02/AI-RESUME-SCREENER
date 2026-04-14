from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Depends
from sqlalchemy.orm import Session
from services.parser import extract_text_from_pdf
from services.scorer import score_resume, bulk_score_resumes, parse_and_score_resume
from services.database import get_db, ScreeningResult
import uuid

router = APIRouter()

def save_to_db(db: Session, candidate: dict, job_title: str, job_description: str):
    record = ScreeningResult(
        id=str(uuid.uuid4()),
        candidate_name=candidate.get("candidate", "Unknown"),
        email=candidate.get("email", ""),
        filename=candidate.get("filename", ""),
        job_title=job_title,
        job_description=job_description,
        total_score=candidate["score"]["total_score"],
        breakdown=candidate["score"]["breakdown"],
        matched_skills=candidate["score"]["matched_skills"],
        missing_skills=candidate["score"]["missing_skills"],
        green_flags=candidate["score"]["green_flags"],
        red_flags=candidate["score"]["red_flags"],
        improvements=candidate["score"]["improvements"],
        summary=candidate["score"]["summary"],
        status="pending"
    )
    db.add(record)
    db.commit()
    return record.id

@router.get("/health")
def health():
    return {"status": "resume router working"}

@router.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files accepted")
    contents = await file.read()
    raw_text = extract_text_from_pdf(contents)
    if not raw_text:
        raise HTTPException(status_code=400, detail="Could not extract text from PDF")
    return {"filename": file.filename, "characters": len(raw_text)}

@router.post("/score")
async def score(
    file: UploadFile = File(...),
    job_description: str = Form(...),
    job_title: str = Form("Untitled Role"),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files accepted")
    if not job_description.strip():
        raise HTTPException(status_code=400, detail="Job description is required")

    contents = await file.read()
    raw_text = extract_text_from_pdf(contents)
    result = parse_and_score_resume(raw_text, job_description)

    candidate_data = {
        "candidate": result.get("name", "Unknown"),
        "email": result.get("email", ""),
        "filename": file.filename,
        "score": {
            "total_score": result.get("total_score", 0),
            "breakdown": result.get("breakdown", {}),
            "matched_skills": result.get("matched_skills", []),
            "missing_skills": result.get("missing_skills", []),
            "green_flags": result.get("green_flags", []),
            "red_flags": result.get("red_flags", []),
            "improvements": result.get("improvements", []),
            "summary": result.get("summary", "")
        }
    }

    save_to_db(db, candidate_data, job_title, job_description)
    return candidate_data

@router.post("/bulk-score")
async def bulk_score(
    file: UploadFile = File(...),
    job_description: str = Form(...),
    job_title: str = Form("Untitled Role"),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="Please upload a ZIP file")
    if not job_description.strip():
        raise HTTPException(status_code=400, detail="Job description is required")

    contents = await file.read()

    try:
        results = bulk_score_resumes(contents, job_description)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    for r in results:
        if r["status"] == "success":
            candidate_data = {
                "candidate": r["candidate"],
                "email": r.get("email", ""),
                "filename": r["filename"],
                "score": {
                    "total_score": r["total_score"],
                    "breakdown": r["breakdown"],
                    "matched_skills": r["matched_skills"],
                    "missing_skills": r["missing_skills"],
                    "green_flags": r["green_flags"],
                    "red_flags": r["red_flags"],
                    "improvements": r["improvements"],
                    "summary": r["summary"]
                }
            }
            save_to_db(db, candidate_data, job_title, job_description)

    return {
        "total_candidates": len(results),
        "job_description": job_description[:100] + "...",
        "results": results
    }
