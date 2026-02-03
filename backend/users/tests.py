import pytest
from django.test import Client
from django.urls import reverse
from rest_framework import status
from django.utils import timezone
from datetime import timedelta

from .models import VolunteerApplication, User


@pytest.mark.django_db
def test_create_user():
    """Test creating basic user"""
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

    url = f"/api/users/volunteer-applications/{application.id}/"

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

    url = f"/api/users/volunteer-applications/{application.id}/"

    response = client.patch(url, {"status": "REJECTED"}, content_type="application/json")
    assert response.status_code in (200, 202)

    application.refresh_from_db()
    assert application.status == "REJECTED"
    assert application.reviewed_at is not None

    assert not User.objects.filter(email="reject@example.com").exists()


@pytest.mark.django_db
def test_login_success(client):
    """Test JWT login success"""
    User.objects.create_user(email="login@example.com", name="Login User", password="password123")

    url = "/api/auth/login/"
    data = {"email": "login@example.com", "password": "password123"}

    response = client.post(url, data)

    assert response.status_code == status.HTTP_200_OK
    assert "access" in response.data
    assert "refresh" in response.data


@pytest.mark.django_db
def test_logout_blacklists_token(client):
    """Test JWT Blacklist on logout"""
    User.objects.create_user(email="logout@example.com", name="Logout User", password="password123")

    # Login to get tokens
    login_url = "/api/auth/login/"
    login_res = client.post(
        login_url,
        {"email": "logout@example.com", "password": "password123"},
        content_type="application/json",
    )

    access = login_res.data["access"]
    refresh = login_res.data["refresh"]

    # Call Logout with the Authorization header manually added to avoid conftest
    logout_url = "/api/auth/logout/"
    response = client.post(
        logout_url,
        {"refresh": refresh},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {access}",
    )

    assert response.status_code == status.HTTP_205_RESET_CONTENT


@pytest.mark.django_db
def test_user_list_requires_admin(client):
    """Test admin can list users, volunteer cannot."""
    # Create admin and volunteer
    User.objects.create_user(email="admin@example.com", name="Admin", password="adminpass", role="ADMIN")
    User.objects.create_user(email="vol@example.com", name="Vol", password="volpass", role="VOLUNTEER")

    # Login as volunteer
    res_vol = client.post(
        "/api/auth/login/", {"email": "vol@example.com", "password": "volpass"}, content_type="application/json"
    )
    access_vol = res_vol.data["access"]

    # Volunteer should be forbidden
    res_forbidden = client.get("/api/users/list/", HTTP_AUTHORIZATION=f"Bearer {access_vol}")
    assert res_forbidden.status_code == status.HTTP_403_FORBIDDEN

    # Login as admin
    res_admin = client.post(
        "/api/auth/login/", {"email": "admin@example.com", "password": "adminpass"}, content_type="application/json"
    )
    access_admin = res_admin.data["access"]

    res_ok = client.get("/api/users/list/", HTTP_AUTHORIZATION=f"Bearer {access_admin}")
    assert res_ok.status_code == status.HTTP_200_OK

    data = res_ok.json()
    results = data["results"] if isinstance(data, dict) and "results" in data else data
    emails = [u["email"] for u in results]
    assert {"admin@example.com", "vol@example.com"}.issubset(set(emails))


@pytest.mark.django_db
def test_user_list_filters(client):
    """Filter users by role and active status."""
    User.objects.create_user(email="a1@example.com", name="A1", password="x", role="ADMIN", is_active=True)
    User.objects.create_user(email="v1@example.com", name="V1", password="x", role="VOLUNTEER", is_active=True)
    User.objects.create_user(email="v2@example.com", name="V2", password="x", role="VOLUNTEER", is_active=False)

    # Login as admin
    res_admin = client.post("/api/auth/login/", {"email": "a1@example.com", "password": "x"}, content_type="application/json")
    token = res_admin.data["access"]

    # Role filter
    res_role = client.get("/api/users/list/?role=VOLUNTEER", HTTP_AUTHORIZATION=f"Bearer {token}")
    assert res_role.status_code == status.HTTP_200_OK
    data = res_role.json()
    results = data["results"] if isinstance(data, dict) and "results" in data else data
    assert all(u["role"] == "VOLUNTEER" for u in results)

    res_role = client.get("/api/users/list/?role=ADMIN", HTTP_AUTHORIZATION=f"Bearer {token}")
    assert res_role.status_code == status.HTTP_200_OK
    data = res_role.json()
    results = data["results"] if isinstance(data, dict) and "results" in data else data
    assert all(u["role"] == "ADMIN" for u in results)

    # Active filter
    res_active = client.get("/api/users/list/?is_active=true", HTTP_AUTHORIZATION=f"Bearer {token}")
    assert res_active.status_code == status.HTTP_200_OK
    data = res_active.json()
    results = data["results"] if isinstance(data, dict) and "results" in data else data
    assert all(u["is_active"] is True for u in results)

    res_inactive = client.get("/api/users/list/?is_active=false", HTTP_AUTHORIZATION=f"Bearer {token}")
    assert res_inactive.status_code == status.HTTP_200_OK
    data = res_inactive.json()
    results = data["results"] if isinstance(data, dict) and "results" in data else data
    assert all(u["is_active"] is False for u in results)

    res_invalid = client.get("/api/users/list/?role=INVALID_ROLE", HTTP_AUTHORIZATION=f"Bearer {token}")
    assert res_invalid.status_code == status.HTTP_200_OK
    data = res_invalid.json()
    results = data["results"] if isinstance(data, dict) and "results" in data else data
    assert len(results) == 0


@pytest.mark.django_db
def test_user_update_is_active_and_expiry(client):
    """Admin can update is_active and access_expires_at."""
    User.objects.create_user(email="admin2@example.com", name="Admin2", password="adminpass", role="ADMIN")
    target = User.objects.create_user(email="target@example.com", name="Target", password="pwd", role="VOLUNTEER")

    res_admin = client.post(
        "/api/auth/login/", {"email": "admin2@example.com", "password": "adminpass"}, content_type="application/json"
    )
    token = res_admin.data["access"]

    expires_dt = timezone.now() + timedelta(days=7)
    res_patch = client.patch(
        f"/api/users/{target.id}/",
        {"is_active": False, "access_expires_at": expires_dt.isoformat()},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )

    assert res_patch.status_code == status.HTTP_200_OK
    target.refresh_from_db()
    assert target.is_active is False
    assert abs((target.access_expires_at - expires_dt).total_seconds()) < 1


@pytest.mark.django_db
def test_user_update_requires_admin(client):
    """Volunteer cannot update users, only admin can."""
    User.objects.create_user(email="admin3@example.com", name="Admin3", password="adminpass", role="ADMIN")
    User.objects.create_user(email="vol2@example.com", name="Vol2", password="volpass", role="VOLUNTEER")
    target = User.objects.create_user(email="target2@example.com", name="Target2", password="pwd", role="VOLUNTEER")

    res_vol = client.post(
        "/api/auth/login/", {"email": "vol2@example.com", "password": "volpass"}, content_type="application/json"
    )
    access_vol = res_vol.data["access"]

    res_forbidden = client.patch(
        f"/api/users/{target.id}/",
        {"is_active": False},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {access_vol}",
    )
    assert res_forbidden.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_admin_cannot_update_self(client):
    """Admin cannot modify their own account to prevent accidental lockout."""
    admin = User.objects.create_user(email="admin4@example.com", name="Admin4", password="adminpass", role="ADMIN")

    res_login = client.post(
        "/api/auth/login/", {"email": "admin4@example.com", "password": "adminpass"}, content_type="application/json"
    )
    access = res_login.data["access"]

    # Attempt to deactivate own account
    res_self_update = client.patch(
        f"/api/users/{admin.id}/",
        {"is_active": False},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {access}",
    )
    assert res_self_update.status_code == status.HTTP_403_FORBIDDEN
    assert "cannot modify your own account" in res_self_update.data["detail"].lower()


@pytest.mark.django_db
def test_expired_user_blocked_by_middleware(client):
    """Expired user gets 403."""
    User.objects.create_user(
        email="expired@example.com",
        name="Expired",
        password="expiredpass",
        role="ADMIN",
        is_active=True,
        access_expires_at=timezone.now() - timedelta(days=1),
    )

    res_login = client.post(
        "/api/auth/login/", {"email": "expired@example.com", "password": "expiredpass"}, content_type="application/json"
    )
    token = res_login.data["access"]

    res_expired = client.get("/api/users/", HTTP_AUTHORIZATION=f"Bearer {token}")
    assert res_expired.status_code == status.HTTP_403_FORBIDDEN
