from django.urls import path
from .views import (
    GenerateRoadmapView,
    RoadmapListView,
    RoadmapDetailView,
    RoadmapStatusView,
)

urlpatterns = [
    path('generate/', GenerateRoadmapView.as_view(), name='roadmap_generate'),
    path('', RoadmapListView.as_view(), name='roadmap_list'),
    path('<uuid:pk>/', RoadmapDetailView.as_view(), name='roadmap_detail'),
    path('<uuid:pk>/status/', RoadmapStatusView.as_view(), name='roadmap_status'),
]