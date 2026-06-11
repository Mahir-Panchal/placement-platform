import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from datetime import date, timedelta
from apps.tracker.models import JobApplication

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
def auth_client(client, user):
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def sample_application(user, db):
    return JobApplication.objects.create(
        user=user,
        company_name='Google',
        role='SDE-1',
        status='applied',
        applied_date=date.today(),
    )


@pytest.fixture
def sample_applications(user, db):
    statuses = [
        'applied', 'applied', 'applied',
        'oa', 'oa',
        'interview_1', 'interview_1',
        'interview_2',
        'offer',
        'rejected',
    ]
    apps = []
    for i, s in enumerate(statuses):
        apps.append(JobApplication.objects.create(
            user=user,
            company_name=f'Company {i+1}',
            role='SDE-1',
            status=s,
            applied_date=date.today() - timedelta(days=i),
        ))
    return apps


@pytest.mark.django_db
def test_create_application(auth_client):
    url      = reverse('tracker_list')
    response = auth_client.post(url, {
        'company_name': 'Google',
        'role':         'SDE-1',
        'status':       'applied',
        'applied_date': str(date.today()),
    }, format='json')
    assert response.status_code == 201
    assert response.data['company_name'] == 'Google'


@pytest.mark.django_db
def test_list_applications(auth_client, sample_application):
    url      = reverse('tracker_list')
    response = auth_client.get(url)
    assert response.status_code == 200
    data = response.data.get('results', response.data)
    assert len(data) >= 1


@pytest.mark.django_db
def test_update_application_status(auth_client, sample_application):
    url      = reverse('tracker_detail', kwargs={'pk': sample_application.id})
    response = auth_client.patch(url, {'status': 'oa'}, format='json')
    assert response.status_code == 200
    assert response.data['status'] == 'oa'


@pytest.mark.django_db
def test_delete_application(auth_client, sample_application):
    url      = reverse('tracker_detail', kwargs={'pk': sample_application.id})
    response = auth_client.delete(url)
    assert response.status_code == 204


@pytest.mark.django_db
def test_cannot_access_other_users_application(auth_client):
    other_user = User.objects.create_user(
        email='other@test.com',
        password='Test@1234',
        full_name='Other User'
    )
    other_app = JobApplication.objects.create(
        user=other_user,
        company_name='Meta',
        role='SDE-1',
        status='applied',
        applied_date=date.today(),
    )
    url      = reverse('tracker_detail', kwargs={'pk': other_app.id})
    response = auth_client.get(url)
    assert response.status_code == 404


@pytest.mark.django_db
def test_tracker_stats(auth_client, sample_application):
    url      = reverse('tracker_stats')
    response = auth_client.get(url)
    assert response.status_code == 200
    assert response.data['total'] >= 1
    assert 'by_status' in response.data
    assert 'offer_rate' in response.data


@pytest.mark.django_db
def test_filter_by_status(auth_client, sample_applications):
    url      = reverse('tracker_list') + '?status=applied'
    response = auth_client.get(url)
    assert response.status_code == 200
    data = response.data.get('results', response.data)
    for app in data:
        assert app['status'] == 'applied'


@pytest.mark.django_db
def test_stats_counts(auth_client, sample_applications):
    url      = reverse('tracker_stats')
    response = auth_client.get(url)
    assert response.status_code == 200
    assert response.data['total'] == 10
    assert response.data['by_status']['applied'] == 3
    assert response.data['by_status']['offer'] == 1


@pytest.mark.django_db
def test_stats_weekly_timeline(auth_client, sample_applications):
    url      = reverse('tracker_stats')
    response = auth_client.get(url)
    assert response.status_code == 200
    assert len(response.data['weekly_timeline']) == 8


@pytest.mark.django_db
def test_unauthenticated_access_blocked(client):
    url      = reverse('tracker_list')
    response = client.get(url)
    assert response.status_code == 401