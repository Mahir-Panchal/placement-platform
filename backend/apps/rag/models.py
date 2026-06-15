import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class KnowledgeDocument(models.Model):
    """
    Stores uploaded PDFs that have been indexed into FAISS
    for semantic search and RAG-based Q&A.
    """

    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("INDEXING", "Indexing"),
        ("READY", "Ready"),
        ("FAILED", "Failed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="documents")

    # File
    title = models.CharField(max_length=200)
    file = models.FileField(upload_to="knowledge/%Y/%m/")

    # FAISS index
    faiss_index_path = models.CharField(max_length=500, blank=True, default="")
    chunk_count = models.IntegerField(default=0)

    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING")

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email} - {self.title}"
