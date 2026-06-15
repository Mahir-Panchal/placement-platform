import os
import json
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate


def generate_roadmap(
    target_role: str, skills: list, ats_score: int, full_name: str = "Student"
) -> dict:
    """
    Generates a personalised 8-week preparation roadmap using LLM.
    Returns structured JSON with weeks, tasks, resources, and goals.
    """
    try:
        llm = ChatGroq(
            model="llama-3.1-8b-instant",
            temperature=0.7,
            groq_api_key=os.getenv("GROQ_API_KEY"),
        )

        prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    """You are an expert placement coach for engineering students in India.
Generate a detailed 8-week preparation roadmap for the target role.
Return ONLY a valid JSON object with this exact structure:
{{
    "target_role": "role name",
    "summary": "2-3 sentence overview of the plan",
    "weeks": [
        {{
            "week": 1,
            "theme": "theme name",
            "focus": "what to focus on this week",
            "daily_tasks": ["task 1", "task 2", "task 3", "task 4", "task 5"],
            "resources": ["resource 1", "resource 2"],
            "goal": "what you should achieve by end of this week",
            "skills_covered": ["skill1", "skill2"]
        }}
    ],
    "key_topics": ["topic1", "topic2", "topic3"],
    "interview_tips": ["tip1", "tip2", "tip3"]
}}
Generate exactly 8 weeks. Return ONLY the JSON, no markdown, no explanation.""",
                ),
                (
                    "human",
                    """Student: {full_name}
Target Role: {target_role}
Current Skills: {skills}
ATS Score: {ats_score}/100

Generate an 8-week preparation roadmap tailored to this student's profile.""",
                ),
            ]
        )

        chain = prompt | llm

        response = chain.invoke(
            {
                "full_name": full_name,
                "target_role": target_role,
                "skills": ", ".join(skills) if skills else "Python, Data Structures",
                "ats_score": ats_score,
            }
        )

        content = response.content.strip()

        # Remove markdown code blocks if present
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
            content = content.strip()

        # Remove trailing backticks
        if content.endswith("```"):
            content = content[:-3].strip()

        return json.loads(content)

    except Exception as e:
        print(f"Roadmap generation error: {e}")
        return _empty_roadmap(target_role, error=str(e))


def _empty_roadmap(target_role: str, error: str = None) -> dict:
    return {
        "target_role": target_role,
        "summary": "Roadmap generation failed. Please try again.",
        "weeks": [],
        "key_topics": [],
        "interview_tips": [],
        "error": error or "",
    }
