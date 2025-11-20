from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from users.views import LogoutView, RegisterView, UserProfileView
from .views import VolunteerApplicationAPIView


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
