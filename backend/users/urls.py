from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,  # The built-in "Login" view
    TokenRefreshView,  # The built-in "Refresh Session" view
)
from users.views import LogoutView, RegisterView, UserProfileView, VolunteerApplicationAPIView

# Router setup
router = DefaultRouter()
router.register(
    r"volunteer-applications",
    VolunteerApplicationAPIView,
    basename="volunteer-application",
)


urlpatterns = [
    # Auth routes
    path("auth/register/", RegisterView.as_view(), name="auth_register"),
    path("auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/logout/", LogoutView.as_view(), name="auth_logout"),
    # User routes
    path("users/me/", UserProfileView.as_view(), name="user_profile"),

    # Router-based routes
    path("", include(router.urls)),
]

# This will create the following endpoints:
# POST   /api/volunteer-applications/          - Create a new application (PENDING)
# GET    /api/volunteer-applications/          - List all applications
# GET    /api/volunteer-applications/{id}/     - Retrieve a specific application (admin only)
# PATCH  /api/volunteer-applications/{id}/     - Partial update

