from rest_framework import serializers
from .models import Roadmap


class RoadmapGenerateSerializer(serializers.Serializer):
    """Input serializer for roadmap generation request."""
    target_role = serializers.CharField(max_length=200, default='Software Engineer')
    resume_id = serializers.UUIDField(required=False, allow_null=True)


class RoadmapSerializer(serializers.ModelSerializer):
    """Full roadmap serializer."""
    class Meta:
        model = Roadmap
        fields = (
            'id',
            'target_role',
            'content',
            'status',
            'created_at',
            'updated_at',
        )
        read_only_fields = fields