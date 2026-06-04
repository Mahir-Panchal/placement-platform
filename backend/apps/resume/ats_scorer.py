import re
from typing import List


def calculate_ats_score(text: str, skills: List[str]) -> int:
    """
    Calculates an ATS compatibility score from 0-100.

    Scoring breakdown:
    - Skills found (40 points): based on number of skills detected
    - Contact info (20 points): email + phone present
    - Word count (20 points): resume length is appropriate
    - Section headers (20 points): standard sections present
    """
    if not text:
        return 0

    score = 0
    text_lower = text.lower()

    # ── 1. Skills Score (40 points) ──────────────────────────────────────
    # Scale: 0 skills = 0pts, 10+ skills = 40pts
    skill_count = len(skills)
    skill_score = min(40, int((skill_count / 10) * 40))
    score += skill_score

    # ── 2. Contact Info (20 points) ──────────────────────────────────────
    # Email present (10 points)
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    if re.search(email_pattern, text):
        score += 10

    # Phone present (10 points)
    phone_pattern = r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
    if re.search(phone_pattern, text):
        score += 10

    # ── 3. Word Count Score (20 points) ──────────────────────────────────
    # Ideal resume: 300-700 words
    word_count = len(text.split())
    if word_count >= 300 and word_count <= 700:
        score += 20
    elif word_count >= 200 and word_count < 300:
        score += 10
    elif word_count > 700 and word_count <= 1000:
        score += 15
    elif word_count > 1000:
        score += 5

    # ── 4. Section Headers (20 points) ───────────────────────────────────
    # Check for standard resume sections
    sections = [
        'experience', 'education', 'skills', 'projects',
        'summary', 'objective', 'achievements', 'certifications'
    ]
    sections_found = sum(1 for section in sections if section in text_lower)
    section_score = min(20, sections_found * 5)
    score += section_score

    return min(100, score)


def get_ats_grade(score: int) -> str:
    """Returns a letter grade for the ATS score."""
    if score >= 80:
        return 'A'
    elif score >= 65:
        return 'B'
    elif score >= 50:
        return 'C'
    else:
        return 'D'