from django.urls import path, include
from rest_framework.routers import DefaultRouter

from django.contrib import admin
from rest_framework_simplejwt.views import (
    TokenObtainPairView,  # The built-in "Login" view
    TokenRefreshView,     # The built-in "Refresh Session" view
)

from users.views import LogoutView, RegisterView, UserProfileView


urlpatterns = [
    # The 'api/' part is already handled in core/urls.py
    
    # Auth Routes
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', LogoutView.as_view(), name='auth_logout'),

    # User Routes
    path('users/me/', UserProfileView.as_view(), name='user_profile'),
]
