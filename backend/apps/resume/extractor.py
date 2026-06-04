import re
from typing import List

# Master list of tech skills to look for in resumes
SKILL_KEYWORDS = [
    # Languages
    "python", "javascript", "typescript", "java", "c++", "c#", "go", "rust",
    "kotlin", "swift", "php", "ruby", "scala", "r", "matlab",

    # Web Frameworks
    "django", "flask", "fastapi", "react", "next.js", "vue", "angular",
    "express", "spring", "laravel", "rails",

    # Databases
    "postgresql", "mysql", "mongodb", "redis", "sqlite", "cassandra",
    "elasticsearch", "dynamodb", "firebase",

    # Cloud & DevOps
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ansible",
    "jenkins", "github actions", "ci/cd", "linux",

    # AI/ML
    "machine learning", "deep learning", "tensorflow", "pytorch", "scikit-learn",
    "pandas", "numpy", "opencv", "nlp", "langchain", "openai",

    # Tools & Concepts
    "git", "rest api", "graphql", "microservices", "agile", "scrum",
    "system design", "data structures", "algorithms", "oop",

    # Mobile
    "android", "ios", "react native", "flutter",

    # Other
    "html", "css", "tailwind", "bootstrap", "figma", "postman",
]


def extract_skills(text: str) -> List[str]:
    """
    Scans resume text for known tech skills.
    Case-insensitive matching.
    Returns sorted list of found skills.
    """
    if not text:
        return []

    text_lower = text.lower()
    found_skills = []

    for skill in SKILL_KEYWORDS:
        # Use word boundary matching to avoid partial matches
        pattern = r'\b' + re.escape(skill.lower()) + r'\b'
        if re.search(pattern, text_lower):
            # Return skill in its original casing from our list
            found_skills.append(skill)

    return sorted(found_skills)