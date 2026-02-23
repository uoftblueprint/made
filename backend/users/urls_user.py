from django.urls import path, include
from rest_framework.routers import DefaultRouter
from users.views import (
    UserProfileView,
    UserListView,
    UserUpdateView,
    VolunteerApplicationAPIView,
    VolunteerStatsView,
    VolunteerOptionsView,
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
    path("volunteer-stats/", VolunteerStatsView.as_view(), name="volunteer_stats"),  # /api/users/volunteer-stats/
    path("volunteer-options/", VolunteerOptionsView.as_view(), name="volunteer_options"),  # /api/users/volunteer-options/
]
