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
def test_login_success(api_client):
    """Test JWT login success"""
    User.objects.create_user(email="login@example.com", name="Login User", password="password123")

    url = "/api/auth/login/"
    data = {"email": "login@example.com", "password": "password123"}

    response = api_client.post(url, data)

    assert response.status_code == status.HTTP_200_OK
    assert "access" in response.data
    assert "refresh" in response.data


@pytest.mark.django_db
def test_logout_blacklists_token(api_client):
    """Test JWT Blacklist on logout"""
    user = User.objects.create_user(email="logout@example.com", name="Logout User", password="password123")

    # Login to get tokens and setup header
    login_url = "/api/auth/login/"
    login_res = api_client.post(login_url, {"email": "logout@example.com", "password": "password123"})
    access = login_res.data["access"]
    refresh = login_res.data["refresh"]

    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

    # Logout to blacklist the refresh token
    logout_url = "/api/auth/logout/"
    response = api_client.post(logout_url, {"refresh": refresh})

    assert response.status_code == status.HTTP_205_RESET_CONTENT
