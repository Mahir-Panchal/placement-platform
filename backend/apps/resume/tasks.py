from .models import Resume


def process_resume_inline(resume_id):
    """
    Temporary inline processor — runs synchronously for now.
    Will be replaced with Celery task on Day 10.
    """
    try:
        resume = Resume.objects.get(id=resume_id)
        resume.status = 'PROCESSING'
        resume.save(update_fields=['status'])

        # Step 1: Extract text from PDF
        from .parser import extract_text_from_pdf
        text = extract_text_from_pdf(resume.file.path)
        resume.raw_text = text

        # Step 2: Extract skills
        from .extractor import extract_skills
        skills = extract_skills(text)
        resume.skills = skills

        # Step 3: Calculate ATS score
        from .ats_scorer import calculate_ats_score
        score = calculate_ats_score(text, skills)
        resume.ats_score = score

        resume.status = 'DONE'
        resume.save()

    except Exception as e:
        resume.status = 'FAILED'
        resume.save(update_fields=['status'])
        raise e