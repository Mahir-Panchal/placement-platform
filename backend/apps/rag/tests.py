import pytest
from unittest.mock import patch
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile

User = get_user_model()


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        email="rag@test.com", password="Test@1234", full_name="RAG Tester"
    )


@pytest.fixture
def auth_client(user):
    client = APIClient()
    response = client.post(
        reverse("login"),
        {"email": "rag@test.com", "password": "Test@1234"},
        format="json",
    )
    token = response.data["access"]
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    return client, user


@pytest.fixture
def sample_pdf():
    pdf_content = b"""%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length 44>>stream
BT /F1 12 Tf 100 700 Td (Python Django React Git AWS) Tj ET
endstream endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000274 00000 n
0000000370 00000 n
trailer<</Size 6/Root 1 0 R>>
startxref
441
%%EOF"""
    return SimpleUploadedFile(
        "test_doc.pdf", pdf_content, content_type="application/pdf"
    )


# ── Test 1: Upload Document ───────────────────────────────────────────────


@pytest.mark.django_db
def test_upload_document(auth_client, sample_pdf):
    """Authenticated user can upload a document."""
    client, user = auth_client
    url = reverse("rag_upload")

    # Mock the ingest task so CI doesn't try to download fastembed model
    with patch("apps.rag.tasks.process_document.apply") as mock_task:
        mock_task.return_value = None
        response = client.post(
            url, {"title": "Test Document", "file": sample_pdf}, format="multipart"
        )

    assert response.status_code == 201
    assert response.data["title"] == "Test Document"
    assert response.data["status"] in ["PENDING", "INDEXING", "READY"]


# ── Test 2: List Documents ────────────────────────────────────────────────


@pytest.mark.django_db
def test_list_documents(auth_client):
    """User can list their documents."""
    client, user = auth_client
    url = reverse("rag_documents")
    response = client.get(url)

    assert response.status_code == 200
    assert isinstance(response.data, list)


# ── Test 3: Upload Requires Auth ──────────────────────────────────────────


@pytest.mark.django_db
def test_upload_requires_auth(client, sample_pdf):
    """Unauthenticated upload returns 401."""
    url = reverse("rag_upload")
    response = client.post(
        url, {"title": "Test", "file": sample_pdf}, format="multipart"
    )

    assert response.status_code == 401


# ── Test 4: Query Non-Ready Document ─────────────────────────────────────


@pytest.mark.django_db
def test_query_non_ready_document(auth_client):
    """Querying a non-ready document returns 400."""
    client, user = auth_client

    from apps.rag.models import KnowledgeDocument

    doc = KnowledgeDocument.objects.create(
        user=user, title="Test Doc", file="knowledge/test.pdf", status="PENDING"
    )

    response = client.post(
        reverse("rag_query"),
        {"document_id": str(doc.id), "question": "What is this about?"},
        format="json",
    )

    assert response.status_code == 400
