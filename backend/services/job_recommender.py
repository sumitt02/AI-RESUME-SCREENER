import os
import requests
from openai import OpenAI
import json

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))


def search_jobs(query: str, location: str = "India") -> list:
    url = "https://jsearch.p.rapidapi.com/search"
    headers = {
        "X-RapidAPI-Key": os.environ.get("RAPIDAPI_KEY"),
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
    }
    params = {
        "query": f"{query} in {location}",
        "page": "1",
        "num_pages": "1",
        "date_posted": "month"
    }
    try:
        response = requests.get(url, headers=headers, params=params, timeout=15)
        response.raise_for_status()
        data = response.json()
        return data.get("data", [])[:8]
    except Exception as e:
        print(f"JSearch API error: {e}")
        return []


def quick_score_match(candidate_skills: list, job_description: str) -> int:
    if not candidate_skills or not job_description:
        return 0
    prompt = f"""Score this candidate against the job 0-100. Return only JSON like {{"score": 78}}.

Candidate skills: {', '.join(candidate_skills)}

Job description:
{job_description[:1500]}

Score based on how well their skills match the role."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.1,
            max_tokens=50
        )
        result = json.loads(response.choices[0].message.content)
        return int(result.get("score", 0))
    except Exception as e:
        print(f"Scoring error: {e}")
        return 0


def get_recommendations(candidate_skills: list, job_title: str = "Software Developer", min_score: int = 80) -> list:
    if not candidate_skills:
        return []

    primary_skill = candidate_skills[0] if candidate_skills else "developer"
    search_query = f"{primary_skill} {job_title}"
    raw_jobs = search_jobs(search_query)

    if not raw_jobs:
        return []

    matches = []
    for job in raw_jobs:
        description = job.get("job_description", "")
        if not description or len(description) < 100:
            continue
        score = quick_score_match(candidate_skills, description)
        if score >= min_score:
            matches.append({
                "title": job.get("job_title", "Unknown"),
                "company": job.get("employer_name", "Unknown"),
                "location": f"{job.get('job_city') or ''} {job.get('job_country') or ''}".strip(),
                "score": score,
                "apply_url": job.get("job_apply_link", ""),
                "logo": job.get("employer_logo", ""),
                "remote": job.get("job_is_remote", False),
                "snippet": (description[:200] + "...") if len(description) > 200 else description
            })

    matches.sort(key=lambda x: x["score"], reverse=True)
    return matches[:5]