import logging
from datetime import date, timedelta

from celery import shared_task
from django.contrib.auth import get_user_model
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings

logger = logging.getLogger(__name__)
User = get_user_model()


def _build_summary_context(user):
    """Build the email context dict for a given user."""
    from apps.tracker.models import JobApplication

    qs = JobApplication.objects.filter(user=user)
    total = qs.count()

    week_ago = date.today() - timedelta(days=7)
    this_week_count = qs.filter(applied_date__gte=week_ago).count()
    interviews = qs.filter(status__in=["interview_1", "interview_2"]).count()
    offers = qs.filter(status="offer").count()

    recent_applications = list(qs.order_by("-applied_date")[:5])

    # Stale: applied/oa with no update in 7 days
    stale_cutoff = date.today() - timedelta(days=7)
    stale_applications = list(
        qs.filter(status__in=["applied", "oa"], updated_at__date__lte=stale_cutoff)[:5]
    )

    week_start = (date.today() - timedelta(days=6)).strftime("%b %d")
    week_end = date.today().strftime("%b %d, %Y")

    return {
        "user_name": user.full_name or user.email,
        "week_range": f"{week_start} – {week_end}",
        "total_applications": total,
        "this_week_count": this_week_count,
        "interviews": interviews,
        "offers": offers,
        "recent_applications": recent_applications,
        "stale_applications": stale_applications,
        "dashboard_url": "http://localhost:3000/dashboard",
    }


@shared_task(bind=True, max_retries=3)
def send_weekly_summary(self, user_id: str):
    """Send weekly placement summary email to a single user."""
    try:
        user = User.objects.get(id=user_id)

        if not user.email:
            logger.warning(f"User {user_id} has no email — skipping")
            return

        context = _build_summary_context(user)
        html_body = render_to_string("notifications/weekly_summary.html", context)
        text_body = (
            f"Hi {context['user_name']},\n\n"
            f"Weekly Summary:\n"
            f"Total Applications : {context['total_applications']}\n"
            f"Added This Week    : {context['this_week_count']}\n"
            f"Interviews         : {context['interviews']}\n"
            f"Offers             : {context['offers']}\n\n"
            f"Visit your dashboard: {context['dashboard_url']}"
        )

        msg = EmailMultiAlternatives(
            subject=f"📊 Your Weekly Placement Summary — {context['week_range']}",
            body=text_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email],
        )
        msg.attach_alternative(html_body, "text/html")
        msg.send()

        logger.info(f"Weekly summary sent to {user.email}")
        return f"Sent to {user.email}"

    except User.DoesNotExist:
        logger.error(f"User {user_id} not found")
    except Exception as exc:
        logger.error(f"Failed to send summary to user {user_id}: {exc}")
        raise self.retry(exc=exc, countdown=60)


@shared_task
def send_weekly_summary_to_all():
    """Triggered by Celery Beat — fans out to per-user tasks."""
    users = User.objects.filter(is_active=True).values_list("id", flat=True)
    for user_id in users:
        send_weekly_summary.delay(str(user_id))
    logger.info(f"Queued weekly summary for {len(users)} users")
    return f"Queued {len(users)} summaries"


@shared_task
def send_stale_application_reminders():
    """
    Find all applications stuck in applied/oa for 7+ days
    and send a reminder email to each affected user.
    """
    from apps.tracker.models import JobApplication

    stale_cutoff = date.today() - timedelta(days=7)

    stale_user_ids = (
        JobApplication.objects.filter(
            status__in=["applied", "oa"], updated_at__date__lte=stale_cutoff
        )
        .values_list("user_id", flat=True)
        .distinct()
    )

    count = 0
    for user_id in stale_user_ids:
        try:
            user = User.objects.get(id=user_id)
            stale = JobApplication.objects.filter(
                user=user,
                status__in=["applied", "oa"],
                updated_at__date__lte=stale_cutoff,
            )

            text_body = (
                f"Hi {user.full_name or user.email},\n\n"
                f"You have {stale.count()} application(s) with no update in over 7 days.\n"
                f"Log in to update their status:\n"
                f"http://localhost:3000/dashboard/applications\n"
            )

            msg = EmailMultiAlternatives(
                subject="⏰ Applications need your attention",
                body=text_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email],
            )
            msg.send()
            count += 1
            logger.info(f"Stale reminder sent to {user.email}")

        except Exception as exc:
            logger.error(f"Failed stale reminder for user {user_id}: {exc}")

    return f"Sent {count} stale reminders"
