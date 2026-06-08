from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Count
from datetime import date, timedelta

from .models import JobApplication
from .serializers import JobApplicationSerializer


class JobApplicationViewSet(generics.ListCreateAPIView):
    """
    GET  /api/tracker/     — list all applications
    POST /api/tracker/     — create new application
    """
    serializer_class = JobApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = JobApplication.objects.filter(user=self.request.user)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class JobApplicationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/tracker/{id}/  — get single application
    PATCH  /api/tracker/{id}/  — update status/notes
    DELETE /api/tracker/{id}/  — delete application
    """
    serializer_class = JobApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return get_object_or_404(
            JobApplication,
            id=self.kwargs['pk'],
            user=self.request.user
        )


class TrackerStatsView(APIView):
    """
    GET /api/tracker/stats/
    Returns analytics: counts by status, total, recent activity.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = JobApplication.objects.filter(user=request.user)
        total = qs.count()

        # Count by status
        by_status = {}
        for choice_key, _ in JobApplication.STATUS_CHOICES:
            by_status[choice_key] = qs.filter(status=choice_key).count()

        # This week
        week_ago = date.today() - timedelta(days=7)
        this_week = qs.filter(applied_date__gte=week_ago).count()

        # Offer rate
        offers = by_status.get('offer', 0)
        offer_rate = round((offers / total * 100), 1) if total > 0 else 0

        # Recent activity (last 5)
        recent = qs[:5]
        recent_activity = [
            {
                'company': app.company_name,
                'role': app.role,
                'status': app.status,
                'date': str(app.applied_date),
            }
            for app in recent
        ]

        return Response({
            'total': total,
            'by_status': by_status,
            'this_week': this_week,
            'offer_rate': offer_rate,
            'recent_activity': recent_activity,
        })