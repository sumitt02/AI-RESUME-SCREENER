import fitz
import json
import os
from openai import OpenAI
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent.parent / ".env", override=True)
api_key = os.getenv("OPENAI_API_KEY")
print("KEY VALUE:", api_key)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def extract_text_from_pdf(file_bytes: bytes) -> str:
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    full_text = ""
    for page in doc:
        full_text += page.get_text()
    doc.close()
    return full_text.strip()

def parse_resume_with_openai(raw_text: str) -> dict:
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "You are a resume parser. Always return valid JSON only. No markdown, no explanation, just raw JSON."
            },
            {
                "role": "user",
                "content": f"""Extract these fields from the resume below and return as JSON:

{{
  "name": "full name",
  "email": "email address",
  "phone": "phone number",
  "skills": ["skill1", "skill2"],
  "experience": [
    {{
      "role": "job title",
      "company": "company name",
      "years": 2.0,
      "bullets": ["achievement 1", "achievement 2"]
    }}
  ],
  "education": [
    {{
      "degree": "degree name",
      "institution": "college name",
      "year": 2022
    }}
  ],
  "total_experience_years": 3.5
}}

Resume:
{raw_text}"""
            }
        ],
        response_format={"type": "json_object"},
        temperature=0.1,
    )

    response_text = response.choices[0].message.content.strip()
    parsed = json.loads(response_text)
    return parsed
   