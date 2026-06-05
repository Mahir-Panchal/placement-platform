import pytest
import os
import tempfile
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

from apps.resume.models import Resume
from apps.resume.ats_scorer import calculate_ats_score
from apps.resume.extractor import extract_skills

User = get_user_model()


# ── Fixtures ─────────────────────────────────────────────────────────────

@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        email='resume@test.com',
        password='Test@1234',
        full_name='Resume Tester'
    )


@pytest.fixture
def auth_client(user):
    client = APIClient()
    response = client.post(reverse('login'), {
        'email': 'resume@test.com',
        'password': 'Test@1234'
    }, format='json')
    token = response.data['access']
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    return client, user


@pytest.fixture
def sample_pdf():
    """Creates a minimal valid PDF file for testing."""
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
        "test_resume.pdf",
        pdf_content,
        content_type="application/pdf"
    )


# ── Unit Tests: ATS Scorer ────────────────────────────────────────────────

@pytest.mark.django_db
def test_ats_score_with_good_resume():
    """A resume with skills, contact info and sections gets high score."""
    text = """
    John Doe | john@example.com | +91 9876543210
    
    Skills: Python, Django, React, Git, AWS, Docker
    
    Experience
    Software Engineer at TechCorp
    Built REST APIs using Django
    
    Education
    B.Tech Computer Science
    
    Projects
    Built a web application using React and Django
    """
    skills = extract_skills(text)
    score = calculate_ats_score(text, skills)
    assert score > 50
    assert len(skills) > 0


@pytest.mark.django_db
def test_ats_score_empty_resume():
    """Empty resume gets 0 score."""
    score = calculate_ats_score('', [])
    assert score == 0


@pytest.mark.django_db
def test_skill_extraction():
    """Skill extractor finds known tech keywords."""
    text = "Experienced in Python, Django, React, PostgreSQL and Docker"
    skills = extract_skills(text)
    assert 'python' in skills
    assert 'django' in skills
    assert 'react' in skills


@pytest.mark.django_db
def test_skill_extraction_case_insensitive():
    """Skill extraction is case insensitive."""
    text = "PYTHON and DJANGO and React"
    skills = extract_skills(text)
    assert 'python' in skills
    assert 'django' in skills


# ── Integration Tests: Resume API ────────────────────────────────────────

@pytest.mark.django_db
def test_upload_valid_pdf(auth_client, sample_pdf):
    """Valid PDF upload returns 201 with PENDING status."""
    client, user = auth_client
    url = reverse('resume_upload')
    response = client.post(url, {'file': sample_pdf}, format='multipart')

    assert response.status_code == 201
    assert response.data['status'] == 'PENDING'
    assert response.data['original_filename'] == 'test_resume.pdf'


@pytest.mark.django_db
def test_upload_non_pdf_rejected(auth_client):
    """Non-PDF file upload returns 400."""
    client, user = auth_client
    fake_file = SimpleUploadedFile(
        "resume.txt",
        b"This is not a PDF",
        content_type="text/plain"
    )
    url = reverse('resume_upload')
    response = client.post(url, {'file': fake_file}, format='multipart')
    assert response.status_code == 400


@pytest.mark.django_db
def test_upload_requires_auth(client, sample_pdf):
    """Unauthenticated upload returns 401."""
    url = reverse('resume_upload')
    response = client.post(url, {'file': sample_pdf}, format='multipart')
    assert response.status_code == 401


@pytest.mark.django_db
def test_list_resumes(auth_client, sample_pdf):
    """User can list their own resumes."""
    client, user = auth_client

    # Upload a resume first
    client.post(reverse('resume_upload'), {'file': sample_pdf}, format='multipart')

    response = client.get(reverse('resume_list'))
    assert response.status_code == 200


@pytest.mark.django_db
def test_resume_status_endpoint(auth_client, sample_pdf):
    """Status endpoint returns resume processing status."""
    client, user = auth_client

    # Upload resume
    upload_response = client.post(
        reverse('resume_upload'),
        {'file': sample_pdf},
        format='multipart'
    )
    resume_id = upload_response.data['id']

    # Check status
    response = client.get(reverse('resume_status', kwargs={'pk': resume_id}))
    assert response.status_code == 200
    assert 'status' in response.data
    assert 'ats_score' in response.data


@pytest.mark.django_db
def test_cannot_access_other_users_resume(auth_client, sample_pdf):
    """User cannot access another user's resume."""
    client, user = auth_client

    # Create another user and their resume
    other_user = User.objects.create_user(
        email='other@test.com',
        password='Test@1234',
        full_name='Other User'
    )
    resume = Resume.objects.create(
        user=other_user,
        original_filename='other.pdf',
        status='DONE',
        ats_score=75,
    )

    response = client.get(
        reverse('resume_detail', kwargs={'pk': resume.id})
    )
    assert response.status_code == 404