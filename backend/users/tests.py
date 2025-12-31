import pytest
from django.urls import reverse
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

User = get_user_model()


@pytest.mark.django_db
def test_create_user():
    """Test creating basic user"""
    user = User.objects.create_user(email="test@example.com", name="Test User", password="testpass123")
    assert user.email == "test@example.com"
    assert user.name == "Test User"
    assert user.check_password("testpass123")


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
    user = User.objects.create_user(email="logout@example.com", name="Logout User", password="password123")

    # Login to get tokens
    login_url = "/api/auth/login/"
    login_res = client.post(
        login_url, {"email": "logout@example.com", "password": "password123"}, content_type="application/json"
    )

    access = login_res.data["access"]
    refresh = login_res.data["refresh"]

    # Call Logout with the Authorization header manually added to avoid conftest
    logout_url = "/api/auth/logout/"
    response = client.post(
        logout_url, {"refresh": refresh}, content_type="application/json", HTTP_AUTHORIZATION=f"Bearer {access}"
    )

    assert response.status_code == status.HTTP_205_RESET_CONTENT


@pytest.mark.django_db
def test_user_list_requires_admin(client):
    """Test admin can list users, volunteer cannot."""
    # Create admin and volunteer
    admin = User.objects.create_user(email="admin@example.com", name="Admin", password="adminpass", role="ADMIN")
    volunteer = User.objects.create_user(email="vol@example.com", name="Vol", password="volpass", role="VOLUNTEER")

    # Login as volunteer
    res_vol = client.post(
        "/api/auth/login/", {"email": "vol@example.com", "password": "volpass"}, content_type="application/json"
    )
    access_vol = res_vol.data["access"]

    # Volunteer should be forbidden
    res_forbidden = client.get("/api/users/", HTTP_AUTHORIZATION=f"Bearer {access_vol}")
    assert res_forbidden.status_code == status.HTTP_403_FORBIDDEN

    # Login as admin
    res_admin = client.post(
        "/api/auth/login/", {"email": "admin@example.com", "password": "adminpass"}, content_type="application/json"
    )
    access_admin = res_admin.data["access"]

    res_ok = client.get("/api/users/", HTTP_AUTHORIZATION=f"Bearer {access_admin}")
    assert res_ok.status_code == status.HTTP_200_OK

    emails = [u["email"] for u in res_ok.data]
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
    res_role = client.get("/api/users/?role=VOLUNTEER", HTTP_AUTHORIZATION=f"Bearer {token}")
    assert res_role.status_code == status.HTTP_200_OK
    assert all(u["role"] == "VOLUNTEER" for u in res_role.data)

    res_role = client.get("/api/users/?role=ADMIN", HTTP_AUTHORIZATION=f"Bearer {token}")
    assert res_role.status_code == status.HTTP_200_OK
    assert all(u["role"] == "ADMIN" for u in res_role.data)

    # Active filter
    res_active = client.get("/api/users/?is_active=true", HTTP_AUTHORIZATION=f"Bearer {token}")
    assert res_active.status_code == status.HTTP_200_OK
    assert all(u["is_active"] is True for u in res_active.data)

    res_inactive = client.get("/api/users/?is_active=false", HTTP_AUTHORIZATION=f"Bearer {token}")
    assert res_inactive.status_code == status.HTTP_200_OK
    assert all(u["is_active"] is False for u in res_inactive.data)


@pytest.mark.django_db
def test_user_update_is_active_and_expiry(client):
    """Admin can update is_active and access_expires_at."""
    admin = User.objects.create_user(email="admin2@example.com", name="Admin2", password="adminpass", role="ADMIN")
    target = User.objects.create_user(email="target@example.com", name="Target", password="pwd", role="VOLUNTEER")

    res_admin = client.post(
        "/api/auth/login/", {"email": "admin2@example.com", "password": "adminpass"}, content_type="application/json"
    )
    token = res_admin.data["access"]

    expires = (timezone.now() + timedelta(days=7)).isoformat()
    res_patch = client.patch(
        f"/api/users/{target.id}/",
        {"is_active": False, "access_expires_at": expires},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )

    assert res_patch.status_code == status.HTTP_200_OK
    target.refresh_from_db()
    assert target.is_active is False
    assert target.access_expires_at.isoformat() == expires


@pytest.mark.django_db
def test_expired_user_blocked_by_middleware(client):
    """Expired user gets 403."""
    expired = User.objects.create_user(
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
