import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Resume(models.Model):
    """
    Stores uploaded resumes with their analysis results.
    Each user can have multiple resumes but only one active at a time.
    """

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('DONE', 'Done'),
        ('FAILED', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='resumes')

    # File
    file = models.FileField(upload_to='resumes/%Y/%m/')
    original_filename = models.CharField(max_length=255)

    # Extracted content
    raw_text = models.TextField(blank=True, default='')

    # Analysis results
    ats_score = models.IntegerField(default=0)
    skills = models.JSONField(default=list)
    ai_suggestions = models.JSONField(default=dict)

    # Processing status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING'
    )

    # Flags
    is_active = models.BooleanField(default=False)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.original_filename}"