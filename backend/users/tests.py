import pytest
from django.urls import reverse
from django.test import Client
from django.contrib.auth import get_user_model

from .models import VolunteerApplication


User = get_user_model()


@pytest.mark.django_db
def test_create_user():
    """Test creating a user"""
    user = User.objects.create_user(email="test@example.com", name="Test User", password="testpass123")
    assert user.email == "test@example.com"
    assert user.name == "Test User"
    assert user.check_password("testpass123")


@pytest.mark.django_db
def test_approve_volunteer_application():
    client = Client()

    application = VolunteerApplication.objects.create(
        name="Test Volunteer",
        email="volunteer@example.com",
        motivation_text="I want to help",
        status="PENDING",
    )

    url = f"/api/volunteer-applications/{application.id}/"

    response = client.patch(url, {"status": "APPROVED"}, content_type="application/json")
    assert response.status_code in (200, 202)

    application.refresh_from_db()
    assert application.status == "APPROVED"
    assert application.reviewed_at is not None

    user = User.objects.get(email="volunteer@example.com")
    assert user.role == "VOLUNTEER"


@pytest.mark.django_db
def test_reject_application():
    client = Client()

    application = VolunteerApplication.objects.create(
        name="Test Volunteer 2",
        email="reject@example.com",
        motivation_text="I want to help",
        status="PENDING",
    )

    url = f"/api/volunteer-applications/{application.id}/"

    response = client.patch(url, {"status": "REJECTED"}, content_type="application/json")
    assert response.status_code in (200, 202)

    application.refresh_from_db()
    assert application.status == "REJECTED"
    assert application.reviewed_at is not None

    assert not User.objects.filter(email="reject@example.com").exists()
