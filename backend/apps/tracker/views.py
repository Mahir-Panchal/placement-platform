from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.core.cache import cache
from datetime import date, timedelta

from .models import JobApplication
from .serializers import JobApplicationSerializer


class JobApplicationViewSet(generics.ListCreateAPIView):
    serializer_class = JobApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = JobApplication.objects.filter(user=self.request.user)
        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        cache.delete(f"tracker_stats_{self.request.user.id}")


class JobApplicationDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = JobApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return get_object_or_404(
            JobApplication, id=self.kwargs["pk"], user=self.request.user
        )

    def perform_update(self, serializer):
        serializer.save()
        cache.delete(f"tracker_stats_{self.request.user.id}")

    def perform_destroy(self, instance):
        user_id = instance.user.id
        instance.delete()
        cache.delete(f"tracker_stats_{user_id}")


class TrackerStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cache_key = f"tracker_stats_{request.user.id}"
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        qs = JobApplication.objects.filter(user=request.user)
        total = qs.count()

        by_status = {}
        for choice_key, _ in JobApplication.STATUS_CHOICES:
            by_status[choice_key] = qs.filter(status=choice_key).count()

        week_ago = date.today() - timedelta(days=7)
        this_week = qs.filter(applied_date__gte=week_ago).count()

        offers = by_status.get("offer", 0)
        offer_rate = round((offers / total * 100), 1) if total > 0 else 0

        recent_activity = [
            {
                "company": app.company_name,
                "role": app.role,
                "status": app.status,
                "date": str(app.applied_date),
            }
            for app in qs[:5]
        ]

        # Weekly timeline — last 8 weeks
        weekly_data = []
        for i in range(7, -1, -1):
            w_end = date.today() - timedelta(weeks=i)
            w_start = w_end - timedelta(days=6)
            count = qs.filter(applied_date__range=[w_start, w_end]).count()
            weekly_data.append(
                {
                    "week": w_end.strftime("%b %d"),
                    "applications": count,
                }
            )

        payload = {
            "total": total,
            "by_status": by_status,
            "this_week": this_week,
            "offer_rate": offer_rate,
            "recent_activity": recent_activity,
            "weekly_timeline": weekly_data,
            "interview_rate": (
                round(
                    (by_status.get("interview_1", 0) + by_status.get("interview_2", 0))
                    / total
                    * 100,
                    1,
                )
                if total
                else 0
            ),
        }
        cache.set(cache_key, payload, timeout=300)
        return Response(payload)
