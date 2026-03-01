from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from users.permissions import IsAdmin, IsVolunteer

from .models import Box, CollectionItem, Location
from .serializers import (
    BoxDetailSerializer,
    BoxSerializer,
    CollectionItemSerializer,
    PublicCollectionItemSerializer,
    AdminCollectionItemSerializer,
    LocationSerializer,
    LocationDetailSerializer,
)


class CollectionItemViewSet(viewsets.ModelViewSet):
    """
    Internal ViewSet for collection items.
    Supports update of item box assignment via PATCH.
    """

    queryset = CollectionItem.objects.all().select_related("box", "current_location")

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return AdminCollectionItemSerializer
        return CollectionItemSerializer

    def get_permissions(self):
        # Match the Admin view: only Admins should be able to trigger 'destroy'
        if self.action == "destroy":
            return [IsAdmin()]
        return [IsVolunteer()]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_public_visible = False
        instance.save(update_fields=["is_public_visible", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class BoxViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for boxes.
    - GET /api/boxes/ - List all boxes
    - GET /api/boxes/{id}/ - Retrieve box with items
    """

    queryset = Box.objects.all().prefetch_related("items")
    permission_classes = [IsVolunteer]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return BoxDetailSerializer
        return BoxSerializer


class LocationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for locations.
    - GET /api/locations/ - List all locations with box/item counts
    - GET /api/locations/{id}/ - Retrieve location with nested boxes
    - POST /api/locations/ - Create a new location
    - PUT/PATCH /api/locations/{id}/ - Update a location
    - DELETE /api/locations/{id}/ - Delete a location (admin only)
    """

    queryset = Location.objects.all().prefetch_related("boxes", "current_items")

    def get_permissions(self):
        if self.action in ["destroy"]:
            return [IsAdmin()]
        return [IsVolunteer()]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return LocationDetailSerializer
        return LocationSerializer


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
    Only accessible to users with ADMIN or Volunteers role depending on operation with
    destory being Admin Only
    """

    queryset = CollectionItem.objects.all().select_related("current_location")
    serializer_class = AdminCollectionItemSerializer
    permission_classes = [IsVolunteer]

    def get_permissions(self):
        if self.action == "destroy":
            return [IsAdmin()]
        return [IsVolunteer()]

    def destroy(self, request, *args, **kwargs):
        """Soft delete: set is_public_visible=False instead of removing from DB."""
        instance = self.get_object()
        instance.is_public_visible = False
        instance.save(update_fields=["is_public_visible", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
@permission_classes([IsVolunteer])
def dashboard_stats(request):
    """
    Returns dashboard statistics.
    - GET /api/inventory/stats/ - Get total items, boxes, and locations count
    """
    return Response(
        {
            "total_items": CollectionItem.objects.count(),
            "total_boxes": Box.objects.count(),
            "total_locations": Location.objects.count(),
        }
    )
