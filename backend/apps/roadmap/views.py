from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from .models import Roadmap
from .serializers import RoadmapGenerateSerializer, RoadmapSerializer


class GenerateRoadmapView(APIView):
    """
    POST /api/roadmap/generate/
    Creates a new roadmap and triggers async generation.
    Returns immediately with PENDING status.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = RoadmapGenerateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        target_role = serializer.validated_data.get('target_role', 'Software Engineer')
        resume_id = serializer.validated_data.get('resume_id')

        # Get resume if provided
        resume = None
        if resume_id:
            from apps.resume.models import Resume
            try:
                resume = Resume.objects.get(id=resume_id, user=request.user)
            except Resume.DoesNotExist:
                return Response(
                    {'error': 'Resume not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

        # Create roadmap record
        roadmap = Roadmap.objects.create(
            user=request.user,
            target_role=target_role,
            resume=resume,
            status='PENDING'
        )

        # Trigger async task
        from .tasks import generate_roadmap_task
        generate_roadmap_task.delay(str(roadmap.id))

        return Response(
            RoadmapSerializer(roadmap).data,
            status=status.HTTP_201_CREATED
        )


class RoadmapListView(APIView):
    """
    GET /api/roadmap/
    Returns the user's most recent roadmap.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        roadmap = Roadmap.objects.filter(
            user=request.user,
            status='DONE'
        ).first()

        if not roadmap:
            return Response({'roadmap': None})

        return Response(RoadmapSerializer(roadmap).data)


class RoadmapDetailView(APIView):
    """
    GET /api/roadmap/{id}/
    Returns a specific roadmap.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        roadmap = get_object_or_404(Roadmap, id=pk, user=request.user)
        return Response(RoadmapSerializer(roadmap).data)


class RoadmapStatusView(APIView):
    """
    GET /api/roadmap/{id}/status/
    Returns just the processing status — used for polling.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        roadmap = get_object_or_404(Roadmap, id=pk, user=request.user)
        return Response({
            'id': str(roadmap.id),
            'status': roadmap.status,
        })