import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        email='roadmap@test.com',
        password='Test@1234',
        full_name='Roadmap Tester'
    )


@pytest.fixture
def auth_client(user):
    client = APIClient()
    response = client.post(reverse('login'), {
        'email': 'roadmap@test.com',
        'password': 'Test@1234'
    }, format='json')
    token = response.data['access']
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    return client, user


# ── Test 1: Generate Roadmap ──────────────────────────────────────────────

@pytest.mark.django_db
def test_generate_roadmap(auth_client):
    """Authenticated user can generate a roadmap."""
    client, user = auth_client
    url = reverse('roadmap_generate')
    response = client.post(url, {
        'target_role': 'SDE-1 at product startup'
    }, format='json')

    assert response.status_code == 201
    assert response.data['status'] == 'PENDING'
    assert response.data['target_role'] == 'SDE-1 at product startup'


@pytest.mark.django_db
def test_generate_roadmap_unauthenticated(client):
    """Unauthenticated user cannot generate a roadmap."""
    url = reverse('roadmap_generate')
    response = client.post(url, {
        'target_role': 'SDE-1'
    }, format='json')
    assert response.status_code == 401


@pytest.mark.django_db
def test_get_roadmap_empty(auth_client):
    """Getting roadmap when none exists returns null."""
    client, user = auth_client
    url = reverse('roadmap_list')
    response = client.get(url)
    assert response.status_code == 200


@pytest.mark.django_db
def test_roadmap_status(auth_client):
    """Status endpoint returns roadmap status."""
    from apps.roadmap.models import Roadmap
    client, user = auth_client

    roadmap = Roadmap.objects.create(
        user=user,
        target_role='SDE-1',
        status='DONE',
        content={'weeks': []}
    )

    response = client.get(
        reverse('roadmap_status', kwargs={'pk': roadmap.id})
    )
    assert response.status_code == 200
    assert response.data['status'] == 'DONE'