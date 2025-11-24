from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PublicCollectionItemViewSet

# Create router for public catalogue endpoints
router = DefaultRouter()
router.register(r'items', PublicCollectionItemViewSet, basename='public-item')

urlpatterns = [
    path('public/', include(router.urls)),
]
