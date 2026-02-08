from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PublicCollectionItemViewSet, AdminCollectionItemViewSet

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

# Public catalogue (read-only, no auth):
# GET    /api/inventory/public/items/       - List public items (filter/search)
# GET    /api/inventory/public/items/{id}/ - Retrieve public item detail
#
# Admin/volunteer CRUD (auth required):
# GET    /api/inventory/items/           - List all items
# POST   /api/inventory/items/           - Create a new item
# GET    /api/inventory/items/{id}/      - Retrieve a specific item
# PUT    /api/inventory/items/{id}/      - Full update
# PATCH  /api/inventory/items/{id}/     - Partial update
# DELETE /api/inventory/items/{id}/     - Soft delete (admin only)

router = DefaultRouter()
router.register(r"public/items", PublicCollectionItemViewSet, basename="public-item")
router.register(r"items", AdminCollectionItemViewSet, basename="admin-item")

urlpatterns = [
    path("", include(router.urls)),
]
