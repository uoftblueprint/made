import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.mark.django_db
def test_create_user():
    """Test creating a user"""
    user = User.objects.create_user(email="test@example.com", name="Test User", password="testpass123")
    assert user.email == "test@example.com"
    assert user.name == "Test User"
    assert user.check_password("testpass123")
