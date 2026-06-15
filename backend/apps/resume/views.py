from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404

from .models import Resume
from .serializers import (
    ResumeUploadSerializer,
    ResumeSerializer,
    ResumeStatusSerializer,
)


class ResumeUploadView(APIView):
    """
    POST /api/resume/upload/
    Accepts a PDF file, saves it, and processes it synchronously.
    Returns after processing is complete.
    """

    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = ResumeUploadSerializer(data=request.data)
        if serializer.is_valid():
            resume = serializer.save(
                user=request.user,
                original_filename=request.data["file"].name,
                status="PENDING",
            )

            # Run synchronously — no Celery worker needed
            from .tasks import process_resume

            process_resume.apply(args=[str(resume.id)])

            # Refresh from DB to get updated scores and status
            resume.refresh_from_db()

            return Response(
                ResumeSerializer(resume).data, status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ResumeListView(generics.ListAPIView):
    """
    GET /api/resume/
    Returns all resumes for the current user.
    """

    serializer_class = ResumeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Resume.objects.filter(user=self.request.user)


class ResumeDetailView(generics.RetrieveAPIView):
    """
    GET /api/resume/{id}/
    Returns a single resume with full analysis.
    """

    serializer_class = ResumeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return get_object_or_404(Resume, id=self.kwargs["pk"], user=self.request.user)


class ResumeStatusView(APIView):
    """
    GET /api/resume/{id}/status/
    Returns just the processing status — used for polling.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        resume = get_object_or_404(Resume, id=pk, user=request.user)
        return Response(ResumeStatusSerializer(resume).data)


class ResumeSuggestionsView(APIView):
    """
    GET /api/resume/{id}/suggestions/
    Returns AI-generated improvement suggestions for the resume.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        resume = get_object_or_404(Resume, id=pk, user=request.user)

        if resume.status != "DONE":
            return Response(
                {"error": f"Resume is still {resume.status}. Please wait."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "resume_id": str(resume.id),
                "ats_score": resume.ats_score,
                "skills": resume.skills,
                "suggestions": resume.ai_suggestions,
            }
        )


class ResumeReanalyseView(APIView):
    """
    POST /api/resume/{id}/reanalyse/
    Re-triggers processing on an existing resume synchronously.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        resume = get_object_or_404(Resume, id=pk, user=request.user)

        if resume.status == "PROCESSING":
            return Response(
                {"error": "Resume is already being processed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        resume.status = "PENDING"
        resume.save(update_fields=["status"])

        from .tasks import process_resume

        process_resume.apply(args=[str(resume.id)])
        resume.refresh_from_db()

        return Response(
            {
                "message": "Reanalysis complete",
                "resume_id": str(resume.id),
                "status": resume.status,
            }
        )


class ResumeDeleteView(generics.DestroyAPIView):
    """
    DELETE /api/resume/{id}/delete/
    Deletes the resume record AND the file from disk.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return get_object_or_404(Resume, id=self.kwargs["pk"], user=self.request.user)

    def perform_destroy(self, instance):
        import os

        if instance.file and os.path.isfile(instance.file.path):
            os.remove(instance.file.path)
        instance.delete()