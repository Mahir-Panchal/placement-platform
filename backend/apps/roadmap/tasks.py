from celery import shared_task
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def generate_roadmap_task(self, roadmap_id: str):
    """
    Celery task that generates a roadmap asynchronously.
    """
    from .models import Roadmap
    roadmap = None
    try:
        roadmap = Roadmap.objects.select_related('user', 'resume').get(id=roadmap_id)
        roadmap.status = 'PROCESSING'
        roadmap.save(update_fields=['status'])

        # Get resume data if available
        skills = []
        ats_score = 0
        if roadmap.resume and roadmap.resume.status == 'DONE':
            skills = roadmap.resume.skills
            ats_score = roadmap.resume.ats_score

        # Generate roadmap with LangChain
        from .chains import generate_roadmap
        content = generate_roadmap(
            target_role=roadmap.target_role,
            skills=skills,
            ats_score=ats_score,
            full_name=roadmap.user.full_name,
        )

        roadmap.content = content
        roadmap.status = 'DONE'
        roadmap.save()
        logger.info(f"Roadmap {roadmap_id} generated successfully")

        return {'roadmap_id': roadmap_id, 'status': 'DONE'}

    except Exception as exc:
        logger.error(f"Roadmap generation failed for {roadmap_id}: {exc}")
        if roadmap:
            roadmap.status = 'FAILED'
            roadmap.save(update_fields=['status'])
        raise self.retry(exc=exc, countdown=60)