from django.urls import path, include
from rest_framework.routers import DefaultRouter

# from .views import InventoryItemViewSet

# Create your URL patterns here.

# Example: Using DRF Router for ViewSets
# Uncomment and modify as needed
#
# router = DefaultRouter()
# router.register(r'items', InventoryItemViewSet, basename='inventoryitem')
#
# urlpatterns = [
#     path('', include(router.urls)),
# ]

# This will create the following endpoints:
# GET    /api/inventory/items/           - List all items
# POST   /api/inventory/items/           - Create a new item
# GET    /api/inventory/items/{id}/      - Retrieve a specific item
# PUT    /api/inventory/items/{id}/      - Update an item
# PATCH  /api/inventory/items/{id}/      - Partial update
# DELETE /api/inventory/items/{id}/      - Delete an item
# GET    /api/inventory/items/low_stock/ - Custom action (if defined)

urlpatterns = []
