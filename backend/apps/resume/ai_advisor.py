import os
import json
from typing import Dict
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate


def generate_suggestions(
    resume_text: str,
    skills: list,
    ats_score: int
) -> Dict:
    """
    Sends resume text to Groq (Llama 3) and gets back structured
    improvement suggestions.
    """
    if not resume_text:
        return _empty_suggestions()

    try:
        llm = ChatGroq(
            model="llama-3.1-8b-instant",
            temperature=0.3,
            groq_api_key=os.getenv('GROQ_API_KEY'),
        )

        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert resume reviewer and placement coach 
for engineering students in India targeting top tech companies.
Analyse the resume and return ONLY a valid JSON object with exactly these keys:
{{
    "summary_feedback": "2-3 sentence overall assessment",
    "ats_analysis": "explanation of the ATS score and what it means",
    "missing_skills": ["skill1", "skill2"],
    "improvements": [
        {{"section": "Experience", "issue": "what is wrong", "fix": "how to fix it"}},
        {{"section": "Projects", "issue": "what is wrong", "fix": "how to fix it"}}
    ],
    "action_items": ["specific action 1", "specific action 2", "specific action 3"],
    "strengths": ["strength 1", "strength 2"]
}}
Return ONLY the JSON. No markdown, no explanation, no code blocks."""),
            ("human", """Resume Text:
{resume_text}

Detected Skills: {skills}
ATS Score: {ats_score}/100

Analyse this resume and return the JSON feedback.""")
        ])

        chain = prompt | llm

        response = chain.invoke({
            "resume_text": resume_text[:4000],
            "skills": ", ".join(skills),
            "ats_score": ats_score,
        })

        content = response.content.strip()

        # Remove markdown code blocks if present
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]

        return json.loads(content)

    except Exception as e:
        print(f"AI advisor error: {e}")
        return _empty_suggestions(error=str(e))


def _empty_suggestions(error: str = None) -> Dict:
    return {
        "summary_feedback": "AI analysis unavailable at this time.",
        "ats_analysis": "",
        "missing_skills": [],
        "improvements": [],
        "action_items": [],
        "strengths": [],
        "error": error or "",
    }