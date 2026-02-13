from django.urls import path, include
from rest_framework.routers import DefaultRouter
from users.views import (
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
    path("", include(router.urls)),  # This handles /api/users/volunteer-applications/
    path("me/", UserProfileView.as_view(), name="user_profile"),  # /api/users/me/
    path("list/", UserListView.as_view(), name="user_list"),  # /api/users/list/
    path("<int:pk>/", UserUpdateView.as_view(), name="user_update"),  # /api/users/1/
]
