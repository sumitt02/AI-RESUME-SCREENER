from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from services.parser import extract_text_from_pdf, parse_resume_with_openai
from services.scorer import score_resume

router = APIRouter()

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

    parsed = parse_resume_with_openai(raw_text)

    return {
        "filename": file.filename,
        "parsed": parsed
    }

@router.post("/score")
async def score(
    file: UploadFile = File(...),
    job_description: str = Form(...)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files accepted")

    if not job_description.strip():
        raise HTTPException(status_code=400, detail="Job description is required")

    contents = await file.read()
    raw_text = extract_text_from_pdf(contents)
    parsed = parse_resume_with_openai(raw_text)
    result = score_resume(parsed, job_description)

    return {
        "candidate": parsed.get("name", "Unknown"),
        "score": result
    }