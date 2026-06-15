from rest_framework import serializers
from .models import KnowledgeDocument


class DocumentUploadSerializer(serializers.ModelSerializer):
    file = serializers.FileField()
    title = serializers.CharField(max_length=200)

    class Meta:
        model = KnowledgeDocument
        fields = ("id", "title", "file", "status", "created_at")
        read_only_fields = ("id", "status", "created_at")

    def validate_file(self, value):
        if not value.name.endswith(".pdf"):
            raise serializers.ValidationError("Only PDF files are allowed")
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("File must be under 10MB")
        return value


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = KnowledgeDocument
        fields = ("id", "title", "chunk_count", "status", "created_at", "updated_at")
        read_only_fields = fields


class QuerySerializer(serializers.Serializer):
    document_id = serializers.UUIDField()
    question = serializers.CharField(max_length=500)
