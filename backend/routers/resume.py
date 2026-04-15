from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Depends
from sqlalchemy.orm import Session
from services.parser import extract_text_from_pdf
from services.scorer import bulk_score_resumes, parse_and_score_resume
from services.database import get_db, ScreeningResult, User
from services.auth import require_recruiter,get_current_user
from services.deduplicator import get_file_hash, get_skills_fingerprint, check_duplicate
import uuid

router = APIRouter()

def save_to_db(db, candidate, job_title, job_description, user_id, file_hash=None, skills_fingerprint=None):
    record = ScreeningResult(
        id=str(uuid.uuid4()),
        user_id=user_id,
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
        learning_resources=candidate["score"].get("learning_resources", []),
        summary=candidate["score"]["summary"],
        status="pending",
        file_hash=file_hash,
        skills_fingerprint=skills_fingerprint
    )
    db.add(record)
    db.commit()
    return record.id

@router.get("/health")
def health():
    return {"status": "resume router working"}

@router.post("/score")
async def score(
    file: UploadFile = File(...),
    job_description: str = Form(...),
    job_title: str = Form("Untitled Role"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files accepted")
    if not job_description.strip():
        raise HTTPException(status_code=400, detail="Job description is required")

    contents = await file.read()
    file_hash = get_file_hash(contents)

    exact_check = check_duplicate(db, current_user.id, job_title, file_hash, "", "")
    if exact_check["is_duplicate"] and exact_check["type"] == "exact":
        return {"duplicate": True, "duplicate_info": exact_check}

    raw_text = extract_text_from_pdf(contents)
    result = parse_and_score_resume(raw_text, job_description)
    skills_fp = get_skills_fingerprint(result.get("skills", []))

    dup_check = check_duplicate(
        db, current_user.id, job_title,
        file_hash, result.get("email", ""), skills_fp
    )

    if dup_check["is_duplicate"]:
        return {
            "duplicate": True,
            "duplicate_info": dup_check,
            "candidate": result.get("name", "Unknown"),
            "score": {
                "total_score": result.get("total_score", 0),
                "breakdown": result.get("breakdown", {}),
                "matched_skills": result.get("matched_skills", []),
                "missing_skills": result.get("missing_skills", []),
                "green_flags": result.get("green_flags", []),
                "red_flags": result.get("red_flags", []),
                "improvements": result.get("improvements", []),
                "learning_resources": result.get("learning_resources", []),
                "summary": result.get("summary", "")
            }
        }

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
            "learning_resources": result.get("learning_resources", []),
            "summary": result.get("summary", "")
        }
    }

    save_to_db(db, candidate_data, job_title, job_description, current_user.id, file_hash, skills_fp)
    return {"duplicate": False, **candidate_data}

@router.post("/bulk-score")
async def bulk_score(
    file: UploadFile = File(...),
    job_description: str = Form(...),
    job_title: str = Form("Untitled Role"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter)
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

    saved = 0
    duplicates = 0

    for r in results:
        if r["status"] == "success":
            file_hash = r.get("file_hash", "")
            skills_fp = get_skills_fingerprint(r.get("matched_skills", []))

            dup_check = check_duplicate(
                db, current_user.id, job_title,
                file_hash, r.get("email", ""), skills_fp
            )

            if dup_check["is_duplicate"]:
                r["duplicate"] = True
                r["duplicate_info"] = dup_check
                duplicates += 1
            else:
                r["duplicate"] = False
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
                        "learning_resources": r.get("learning_resources", []),
                        "summary": r["summary"]
                    }
                }
                save_to_db(
                    db, candidate_data, job_title,
                    job_description, current_user.id,
                    file_hash, skills_fp
                )
                saved += 1

    return {
        "total_candidates": len(results),
        "saved": saved,
        "duplicates_skipped": duplicates,
        "job_description": job_description[:100] + "...",
        "results": results
    }

@router.post("/candidate-score")
async def candidate_score(
    file: UploadFile = File(...),
    job_description: str = Form(...),
    job_title: str = Form("Untitled Role"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files accepted")
    if not job_description.strip():
        raise HTTPException(status_code=400, detail="Job description is required")

    contents = await file.read()
    raw_text = extract_text_from_pdf(contents)
    result = parse_and_score_resume(raw_text, job_description)

    return {
        "duplicate": False,
        "candidate": result.get("name", "Unknown"),
        "email": result.get("email", ""),
        "score": {
            "total_score": result.get("total_score", 0),
            "breakdown": result.get("breakdown", {}),
            "matched_skills": result.get("matched_skills", []),
            "missing_skills": result.get("missing_skills", []),
            "green_flags": result.get("green_flags", []),
            "red_flags": result.get("red_flags", []),
            "improvements": result.get("improvements", []),
            "learning_resources": result.get("learning_resources", []),
            "summary": result.get("summary", "")
        }
    }