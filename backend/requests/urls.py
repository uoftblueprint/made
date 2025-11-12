from django.urls import path, include
from rest_framework.routers import DefaultRouter

# from .views import RequestViewSet

# Create your URL patterns here.

# Example: Using DRF Router for ViewSets
# Uncomment and modify as needed
#
# router = DefaultRouter()
# router.register(r'requests', RequestViewSet, basename='request')
#
# urlpatterns = [
#     path('', include(router.urls)),
# ]

# This will create the following endpoints:
# GET    /api/requests/              - List all requests
# POST   /api/requests/              - Create a new request
# GET    /api/requests/{id}/         - Retrieve a specific request
# PUT    /api/requests/{id}/         - Update a request
# PATCH  /api/requests/{id}/         - Partial update
# DELETE /api/requests/{id}/         - Delete a request
# POST   /api/requests/{id}/approve/ - Custom action (if defined)
# POST   /api/requests/{id}/reject/  - Custom action (if defined)

urlpatterns = []
