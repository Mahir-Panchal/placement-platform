from .models import Resume
import logging

logger = logging.getLogger(__name__)


def process_resume_inline(resume_id):
    """
    Processes a resume synchronously:
    1. Extract text from PDF
    2. Extract skills
    3. Calculate ATS score
    4. Generate AI suggestions
    """
    resume = None
    try:
        resume = Resume.objects.get(id=resume_id)
        resume.status = 'PROCESSING'
        resume.save(update_fields=['status'])

        # Step 1: Extract text
        from .parser import extract_text_from_pdf
        text = extract_text_from_pdf(resume.file.path)
        resume.raw_text = text
        logger.info(f"Extracted {len(text)} characters from resume {resume_id}")

        # Step 2: Extract skills
        from .extractor import extract_skills
        skills = extract_skills(text)
        resume.skills = skills
        logger.info(f"Found {len(skills)} skills in resume {resume_id}")

        # Step 3: Calculate ATS score
        from .ats_scorer import calculate_ats_score
        score = calculate_ats_score(text, skills)
        resume.ats_score = score
        logger.info(f"ATS score for resume {resume_id}: {score}")

        # Step 4: Generate AI suggestions
        from .ai_advisor import generate_suggestions
        suggestions = generate_suggestions(text, skills, score)
        resume.ai_suggestions = suggestions
        logger.info(f"AI suggestions generated for resume {resume_id}")

        resume.status = 'DONE'
        resume.save()
        logger.info(f"Resume {resume_id} processing complete")

    except Exception as e:
        logger.error(f"Resume processing failed for {resume_id}: {e}")
        if resume:
            resume.status = 'FAILED'
            resume.save(update_fields=['status'])
        raise e