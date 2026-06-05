from django.urls import path
from .views import (
    ResumeUploadView,
    ResumeListView,
    ResumeDetailView,
    ResumeStatusView,
    ResumeDeleteView,
    ResumeSuggestionsView,
    ResumeReanalyseView,
)

urlpatterns = [
    path('upload/', ResumeUploadView.as_view(), name='resume_upload'),
    path('', ResumeListView.as_view(), name='resume_list'),
    path('<uuid:pk>/', ResumeDetailView.as_view(), name='resume_detail'),
    path('<uuid:pk>/status/', ResumeStatusView.as_view(), name='resume_status'),
    path('<uuid:pk>/delete/', ResumeDeleteView.as_view(), name='resume_delete'),
    path('<uuid:pk>/suggestions/', ResumeSuggestionsView.as_view(), name='resume_suggestions'),
    path('<uuid:pk>/reanalyse/', ResumeReanalyseView.as_view(), name='resume_reanalyse'),
]