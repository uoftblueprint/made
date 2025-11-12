from django.urls import path, include
from rest_framework.routers import DefaultRouter

# from .views import UserViewSet

# Create your URL patterns here.

# Example: Using DRF Router for ViewSets
# Uncomment and modify as needed
#
# router = DefaultRouter()
# router.register(r'users', UserViewSet, basename='user')
#
# urlpatterns = [
#     path('', include(router.urls)),
# ]

# This will create the following endpoints:
# GET    /api/users/          - List all users
# POST   /api/users/          - Create a new user
# GET    /api/users/{id}/     - Retrieve a specific user
# PUT    /api/users/{id}/     - Update a user
# PATCH  /api/users/{id}/     - Partial update
# DELETE /api/users/{id}/     - Delete a user
# GET    /api/users/me/       - Custom action (if defined in viewset)

urlpatterns = []
