import pytest
from django.urls import reverse
from rest_framework import status
from django.contrib.auth import get_user_model

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
