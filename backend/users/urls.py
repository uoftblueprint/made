from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VolunteerApplicationAPIView

# Create your URL patterns here.


router = DefaultRouter()
router.register(r'volunteer-applications', VolunteerApplicationAPIView, basename='volunteer-application')

urlpatterns = [
    path('', include(router.urls)),
]

# This will create the following endpoints:
# POST   /api/volunteer-applications/          - Create a new application (PENDING)
# GET    /api/volunteer-applications/          - List all applications
# GET    /api/volunteer-applications/{id}/     - Retrieve a specific application (admin only)
# PATCH  /api/volunteer-applications/{id}/     - Partial update