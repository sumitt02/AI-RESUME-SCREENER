import json
import os
import zipfile
import io
from openai import OpenAI
from dotenv import load_dotenv
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from services.parser import extract_text_from_pdf

load_dotenv(Path(__file__).parent.parent / ".env", override=True)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def parse_and_score_resume(raw_text: str, job_description: str) -> dict:
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "You are an expert resume parser and technical recruiter. Always return valid JSON only."
            },
            {
                "role": "user",
                "content": f"""Parse this resume AND score it against the job description in one step.

Return ONLY this JSON:
{{
  "name": "candidate full name",
  "email": "email address",
  "phone": "phone number",
  "skills": ["skill1", "skill2"],
  "total_experience_years": 3.5,
  "total_score": 78,
  "breakdown": {{
    "skill_match": 85,
    "experience_relevance": 75,
    "seniority_fit": 80,
    "achievement_quality": 70,
    "communication": 75
  }},
  "matched_skills": ["skill1", "skill2"],
  "missing_skills": ["skill3", "skill4"],
  "green_flags": ["positive thing 1", "positive thing 2"],
  "red_flags": ["concern 1", "concern 2"],
  "improvements": [
    "specific actionable suggestion 1",
    "specific actionable suggestion 2",
    "specific actionable suggestion 3"
  ],
  "summary": "2-3 sentence summary of candidate fit"
}}

RESUME:
{raw_text}

JOB DESCRIPTION:
{job_description}"""
            }
        ],
        response_format={"type": "json_object"},
        temperature=0.1,
    )
    return json.loads(response.choices[0].message.content)


def score_resume(parsed_resume: dict, job_description: str) -> dict:
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "You are an expert technical recruiter. Score resumes against job descriptions. Always return valid JSON only."
            },
            {
                "role": "user",
                "content": f"""Score this candidate against the job description below.

Return ONLY this JSON:
{{
  "total_score": 78,
  "breakdown": {{
    "skill_match": 85,
    "experience_relevance": 75,
    "seniority_fit": 80,
    "achievement_quality": 70,
    "communication": 75
  }},
  "matched_skills": ["skill1", "skill2"],
  "missing_skills": ["skill3", "skill4"],
  "green_flags": ["positive thing 1", "positive thing 2"],
  "red_flags": ["concern 1", "concern 2"],
  "improvements": [
    "specific actionable suggestion 1",
    "specific actionable suggestion 2",
    "specific actionable suggestion 3"
  ],
  "summary": "2-3 sentence summary of the candidate fit"
}}

CANDIDATE PROFILE:
{json.dumps(parsed_resume, indent=2)}

JOB DESCRIPTION:
{job_description}"""
            }
        ],
        response_format={"type": "json_object"},
        temperature=0.1,
    )
    return json.loads(response.choices[0].message.content)


def process_single_resume(pdf_bytes: bytes, filename: str, job_description: str) -> dict:
    try:
        raw_text = extract_text_from_pdf(pdf_bytes)
        result = parse_and_score_resume(raw_text, job_description)
        return {
            "filename": filename,
            "candidate": result.get("name", filename.replace(".pdf", "")),
            "email": result.get("email", ""),
            "total_score": result.get("total_score", 0),
            "breakdown": result.get("breakdown", {}),
            "matched_skills": result.get("matched_skills", []),
            "missing_skills": result.get("missing_skills", []),
            "green_flags": result.get("green_flags", []),
            "red_flags": result.get("red_flags", []),
            "improvements": result.get("improvements", []),
            "summary": result.get("summary", ""),
            "status": "success"
        }
    except Exception as e:
        return {
            "filename": filename,
            "candidate": filename.replace(".pdf", ""),
            "total_score": 0,
            "status": "error",
            "error": str(e)
        }


def bulk_score_resumes(zip_bytes: bytes, job_description: str) -> list:
    resumes = []

    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        for name in zf.namelist():
            if name.endswith(".pdf") and not name.startswith("__MACOSX"):
                with zf.open(name) as f:
                    resumes.append((f.read(), name.split("/")[-1]))

    if not resumes:
        raise ValueError("No PDF files found in the ZIP")

    results = []
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {
            executor.submit(process_single_resume, pdf, name, job_description): name
            for pdf, name in resumes
        }
        for future in as_completed(futures):
            results.append(future.result())

    results.sort(key=lambda x: x["total_score"], reverse=True)
    return results