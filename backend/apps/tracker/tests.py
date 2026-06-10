import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from datetime import date

User = get_user_model()


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        email='tracker@test.com',
        password='Test@1234',
        full_name='Tracker Tester'
    )


@pytest.fixture
def auth_client(user):
    client = APIClient()
    response = client.post(reverse('login'), {
        'email': 'tracker@test.com',
        'password': 'Test@1234'
    }, format='json')
    token = response.data['access']
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    return client, user


@pytest.fixture
def sample_application(user):
    from apps.tracker.models import JobApplication
    return JobApplication.objects.create(
        user=user,
        company_name='Google',
        role='SDE-1',
        status='applied',
        applied_date=date.today(),
    )


# ── Test 1: Create Application ────────────────────────────────────────────

@pytest.mark.django_db
def test_create_application(auth_client):
    """Authenticated user can create a job application."""
    client, user = auth_client
    url = reverse('tracker_list')
    response = client.post(url, {
        'company_name': 'Google',
        'role': 'SDE-1',
        'status': 'applied',
        'applied_date': str(date.today()),
    }, format='json')

    assert response.status_code == 201
    assert response.data['company_name'] == 'Google'
    assert response.data['status'] == 'applied'


# ── Test 2: List Applications ─────────────────────────────────────────────

@pytest.mark.django_db
def test_list_applications(auth_client, sample_application):
    """User can list their applications."""
    client, user = auth_client
    url = reverse('tracker_list')
    response = client.get(url)

    assert response.status_code == 200
    data = response.data.get('results', response.data)
    assert len(data) >= 1


# ── Test 3: Update Application Status ────────────────────────────────────

@pytest.mark.django_db
def test_update_application_status(auth_client, sample_application):
    """User can update application status."""
    client, user = auth_client
    url = reverse('tracker_detail', kwargs={'pk': sample_application.id})
    response = client.patch(url, {'status': 'oa'}, format='json')

    assert response.status_code == 200
    assert response.data['status'] == 'oa'


# ── Test 4: Delete Application ────────────────────────────────────────────

@pytest.mark.django_db
def test_delete_application(auth_client, sample_application):
    """User can delete an application."""
    client, user = auth_client
    url = reverse('tracker_detail', kwargs={'pk': sample_application.id})
    response = client.delete(url)

    assert response.status_code == 204


# ── Test 5: Cannot Access Other User's Application ───────────────────────

@pytest.mark.django_db
def test_cannot_access_other_users_application(auth_client):
    """User cannot access another user's application."""
    client, user = auth_client

    other_user = User.objects.create_user(
        email='other@test.com',
        password='Test@1234',
        full_name='Other User'
    )
    from apps.tracker.models import JobApplication
    other_app = JobApplication.objects.create(
        user=other_user,
        company_name='Meta',
        role='SDE-1',
        status='applied',
        applied_date=date.today(),
    )

    url = reverse('tracker_detail', kwargs={'pk': other_app.id})
    response = client.get(url)
    assert response.status_code == 404


# ── Test 6: Stats Endpoint ────────────────────────────────────────────────

@pytest.mark.django_db
def test_tracker_stats(auth_client, sample_application):
    """Stats endpoint returns correct counts."""
    client, user = auth_client
    url = reverse('tracker_stats')
    response = client.get(url)

    assert response.status_code == 200
    assert response.data['total'] >= 1
    assert 'by_status' in response.data
    assert 'offer_rate' in response.data


# ── Test 7: Filter by Status ──────────────────────────────────────────────

@pytest.mark.django_db
def test_filter_by_status(auth_client, sample_application):
    """User can filter applications by status."""
    client, user = auth_client
    url = reverse('tracker_list') + '?status=applied'
    response = client.get(url)

    assert response.status_code == 200
    data = response.data.get('results', response.data)
    for app in data:
        assert app['status'] == 'applied'