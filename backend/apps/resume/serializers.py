from rest_framework import serializers
from .models import Resume


class ResumeUploadSerializer(serializers.ModelSerializer):
    """Used when uploading a new resume."""
    file = serializers.FileField()

    class Meta:
        model = Resume
        fields = ('id', 'file', 'original_filename', 'status', 'created_at')
        read_only_fields = ('id', 'original_filename', 'status', 'created_at')

    def validate_file(self, value):
        # Check file type
        if not value.name.endswith('.pdf'):
            raise serializers.ValidationError('Only PDF files are allowed')
        # Check file size (max 5MB)
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError('File size must be under 5MB')
        return value


class ResumeSerializer(serializers.ModelSerializer):
    """Used for listing and retrieving resumes."""

    class Meta:
        model = Resume
        fields = (
            'id',
            'original_filename',
            'ats_score',
            'skills',
            'ai_suggestions',
            'status',
            'is_active',
            'created_at',
            'updated_at',
        )
        read_only_fields = fields


class ResumeStatusSerializer(serializers.ModelSerializer):
    """Used for polling processing status."""

    class Meta:
        model = Resume
        fields = ('id', 'status', 'ats_score')
        read_only_fields = fields