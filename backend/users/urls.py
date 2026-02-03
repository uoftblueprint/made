from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,  # The built-in "Login" view
    TokenRefreshView,  # The built-in "Refresh Session" view
)
from users.views import (
    LogoutView,
    RegisterView,
    UserProfileView,
    UserListView,
    UserUpdateView,
    VolunteerApplicationAPIView,
)


router = DefaultRouter()
router.register(
    r"volunteer-applications",
    VolunteerApplicationAPIView,
    basename="volunteer-application",
)

urlpatterns = [
    # # Router URLs
    # path("", include(router.urls)),
    # # Auth Routes
    # path("auth/register/", RegisterView.as_view(), name="auth_register"),
    # path("auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    # path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # path("auth/logout/", LogoutView.as_view(), name="auth_logout"),
    # # User Routes
    # path("users/me/", UserProfileView.as_view(), name="user_profile"),
    # path("users/", UserListView.as_view(), name="user_list"),
    # path("users/<int:pk>/", UserUpdateView.as_view(), name="user_update"),
]

# This will create the following endpoints:
# POST   /api/volunteer-applications/          - Create a new application (PENDING)
# GET    /api/volunteer-applications/          - List all applications
# GET    /api/volunteer-applications/{id}/     - Retrieve a specific application (admin only)
# PATCH  /api/volunteer-applications/{id}/     - Partial update
