import json
import os
from openai import OpenAI
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent.parent / ".env", override=True)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

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