from django.urls import path
from .views import JobApplicationViewSet, JobApplicationDetailView, TrackerStatsView

urlpatterns = [
    path("", JobApplicationViewSet.as_view(), name="tracker_list"),
    path("stats/", TrackerStatsView.as_view(), name="tracker_stats"),
    path("<uuid:pk>/", JobApplicationDetailView.as_view(), name="tracker_detail"),
]
