import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Roadmap(models.Model):
    """
    Stores AI-generated career roadmaps for users.
    Each user has one active roadmap at a time.
    Regenerating creates a new one.
    """
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('DONE', 'Done'),
        ('FAILED', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='roadmaps')
    resume = models.ForeignKey(
        'resume.Resume',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='roadmaps'
    )

    # User input
    target_role = models.CharField(max_length=200, default='Software Engineer')

    # Generated content
    content = models.JSONField(default=dict)

    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.target_role}"