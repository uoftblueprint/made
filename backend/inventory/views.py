from rest_framework import viewsets, permissions, filters
from .models import CollectionItem
from .serializers import PublicCollectionItemSerializer, AdminCollectionItemSerializer


class PublicCollectionItemViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public-facing ViewSet for collection items.
    Provides read-only access to public catalogue with filtering and search.

    Endpoints:
    - GET /api/public/items/ - List all public items (with filtering/search)
    - GET /api/public/items/{id}/ - Retrieve single public item
    """

    queryset = CollectionItem.objects.filter(is_public_visible=True).select_related("current_location")
    serializer_class = PublicCollectionItemSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "description", "item_code"]
    ordering_fields = ["title", "platform", "created_at"]

    def get_queryset(self):
        """
        Filter queryset based on query parameters.
        Supports filtering by platform and is_on_floor.
        """
        # Get base queryset from parent class (uses self.queryset from line 18)
        queryset = super().get_queryset()

        # Filter by platform if provided
        platform = self.request.query_params.get("platform", None)
        if platform:
            queryset = queryset.filter(platform=platform)

        # Filter by is_on_floor if provided
        is_on_floor = self.request.query_params.get("is_on_floor", None)
        if is_on_floor is not None:
            # Normalize and convert string to boolean with explicit handling
            is_on_floor_str = is_on_floor.strip().lower()
            if is_on_floor_str in ("false", "0", "no"):
                queryset = queryset.filter(is_on_floor=False)
            elif is_on_floor_str in ("true", "1", "yes"):
                queryset = queryset.filter(is_on_floor=True)
            # Invalid value: skip filtering on is_on_floor (ignore invalid input)

        return queryset


class AdminCollectionItemViewSet(viewsets.ModelViewSet):
    """
    Admin/volunteer ViewSet for managing collection items.
    Supports POST, PUT, PATCH, DELETE.
    """

    queryset = CollectionItem.objects.all().select_related("current_location")
    serializer_class = AdminCollectionItemSerializer
