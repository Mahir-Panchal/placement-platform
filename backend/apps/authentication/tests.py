import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()


# ── Fixtures ────────────────────────────────────────────────────────────────

@pytest.fixture
def client():
    """A plain API client with no authentication."""
    return APIClient()


@pytest.fixture
def create_user():
    """Factory fixture — call it to create a test user."""
    def _create_user(email='user@test.com', password='Test@1234', full_name='Test User'):
        return User.objects.create_user(
            email=email,
            password=password,
            full_name=full_name
        )
    return _create_user


@pytest.fixture
def auth_client(create_user):
    """An API client that is already authenticated with a JWT token."""
    user = create_user()
    client = APIClient()
    # Get tokens by hitting the login endpoint
    response = client.post(reverse('login'), {
        'email': 'user@test.com',
        'password': 'Test@1234'
    }, format='json')
    token = response.data['access']
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    return client, user


# ── Test 1: Successful Registration ─────────────────────────────────────────

@pytest.mark.django_db
def test_register_success(client):
    """A new user can register with valid data."""
    url = reverse('register')
    data = {
        'email': 'newuser@test.com',
        'password': 'Test@1234',
        'full_name': 'New User'
    }
    response = client.post(url, data, format='json')

    assert response.status_code == 201
    assert response.data['user']['email'] == 'newuser@test.com'
    assert 'access' in response.data['tokens']
    assert 'refresh' in response.data['tokens']
    # Make sure password is not returned
    assert 'password' not in response.data['user']


# ── Test 2: Duplicate Email Registration ────────────────────────────────────

@pytest.mark.django_db
def test_register_duplicate_email(client, create_user):
    """Registering with an already used email should fail."""
    create_user(email='existing@test.com')

    url = reverse('register')
    data = {
        'email': 'existing@test.com',
        'password': 'Test@1234',
        'full_name': 'Another User'
    }
    response = client.post(url, data, format='json')

    assert response.status_code == 400


# ── Test 3: Login with Wrong Password ───────────────────────────────────────

@pytest.mark.django_db
def test_login_wrong_password(client, create_user):
    """Login with wrong password should return 401."""
    create_user(email='user@test.com', password='Test@1234')

    url = reverse('login')
    response = client.post(url, {
        'email': 'user@test.com',
        'password': 'WrongPassword!'
    }, format='json')

    assert response.status_code == 401


# ── Test 4: Get Profile When Authenticated ───────────────────────────────────

@pytest.mark.django_db
def test_get_profile_authenticated(auth_client):
    """Authenticated user can fetch their own profile."""
    client, user = auth_client
    url = reverse('profile')
    response = client.get(url)

    assert response.status_code == 200
    assert response.data['email'] == user.email
    assert response.data['full_name'] == user.full_name


# ── Test 5: Get Profile Without Token ───────────────────────────────────────

@pytest.mark.django_db
def test_get_profile_unauthenticated(client):
    """Unauthenticated request to profile should return 401."""
    url = reverse('profile')
    response = client.get(url)

    assert response.status_code == 401


# ── Test 6: Health Check ─────────────────────────────────────────────────────

@pytest.mark.django_db
def test_health_check(client):
    """Health check endpoint should return status ok."""
    url = reverse('health')
    response = client.get(url)

    assert response.status_code == 200
    assert response.data['status'] == 'ok'