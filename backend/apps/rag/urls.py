from django.urls import path
from .views import (
    DocumentUploadView,
    DocumentListView,
    DocumentDeleteView,
    DocumentQueryView,
)

urlpatterns = [
    path("upload/", DocumentUploadView.as_view(), name="rag_upload"),
    path("documents/", DocumentListView.as_view(), name="rag_documents"),
    path("documents/<uuid:pk>/", DocumentDeleteView.as_view(), name="rag_delete"),
    path("query/", DocumentQueryView.as_view(), name="rag_query"),
]
