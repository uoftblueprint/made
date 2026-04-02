import csv
from datetime import datetime

from django.http import HttpResponse
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import api_view, permission_classes, action
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
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        "title",
        "item_code",
        "platform",
        "box__box_code",
        "box__label",
        "description",
    ]
    ordering_fields = ["title", "platform", "created_at"]

    def get_serializer_class(self):
        return AdminCollectionItemSerializer

    def get_permissions(self):
        # Match the Admin view: only Admins should be able to trigger 'destroy'
        if self.action == "destroy":
            return [IsAdmin()]
        return [IsVolunteer()]

    def get_queryset(self):
        """
        Filter queryset based on query parameters.
        Supports filtering by platform, is_on_floor, item_type, status,
        location_type, box, box__box_code, and working_condition.
        """
        queryset = super().get_queryset()

        platform = self.request.query_params.get("platform", None)
        if platform:
            queryset = queryset.filter(platform=platform)

        is_on_floor = self.request.query_params.get("is_on_floor", None)
        if is_on_floor is not None:
            is_on_floor_str = is_on_floor.strip().lower()
            if is_on_floor_str in ("false", "0", "no"):
                queryset = queryset.filter(is_on_floor=False)
            elif is_on_floor_str in ("true", "1", "yes"):
                queryset = queryset.filter(is_on_floor=True)

        item_type = self.request.query_params.get("item_type", None)
        if item_type:
            queryset = queryset.filter(item_type=item_type)

        item_status = self.request.query_params.get("status", None)
        if item_status:
            queryset = queryset.filter(status=item_status)

        location_type = self.request.query_params.get("location_type", None)
        if location_type:
            queryset = queryset.filter(current_location__location_type=location_type)

        box_id = self.request.query_params.get("box", None)
        if box_id:
            queryset = queryset.filter(box__id=box_id)

        box_code = self.request.query_params.get("box__box_code", None)
        if box_code:
            queryset = queryset.filter(box__box_code__icontains=box_code)

        working_condition = self.request.query_params.get("working_condition", None)
        if working_condition is not None:
            wc_str = working_condition.strip().lower()
            if wc_str in ("false", "0", "no"):
                queryset = queryset.filter(working_condition=False)
            elif wc_str in ("true", "1", "yes"):
                queryset = queryset.filter(working_condition=True)

        return queryset

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_public_visible = False
        instance.save(update_fields=["is_public_visible", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class BoxViewSet(viewsets.ModelViewSet):
    """
    ViewSet for boxes.
    - GET /api/boxes/ - List all boxes
    - POST /api/boxes/ - Create a new box
    - GET /api/boxes/{id}/ - Retrieve box with items
    - POST /api/boxes/{id}/mark-arrived/ - Mark box as arrived at destination
    """

    queryset = Box.objects.all().prefetch_related("items")
    permission_classes = [IsVolunteer]

    def get_serializer_class(self):
        if self.action in ["retrieve", "mark_arrived"]:
            return BoxDetailSerializer
        return BoxSerializer

    @action(detail=True, methods=["post"], url_path="mark-arrived")
    def mark_arrived(self, request, pk=None):
        """Mark a box as arrived and sync all contained items to destination location."""
        box = self.get_object()
        location_id = request.data.get("location")

        if not location_id:
            return Response(
                {"detail": "Location is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            destination = Location.objects.get(pk=location_id)
        except (Location.DoesNotExist, ValueError, TypeError):
            return Response(
                {"detail": "Destination location not found."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if box.location_id == destination.id:
            return Response(
                {"detail": "Box is already at this location."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        moved_items = box.mark_as_arrived(
            destination_location=destination,
            user=request.user,
            comment=request.data.get("comment", ""),
        )
        box.refresh_from_db()
        serializer = self.get_serializer(box)
        return Response(
            {
                "box": serializer.data,
                "moved_items": moved_items,
            },
            status=status.HTTP_200_OK,
        )


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
    search_fields = ["title", "description", "item_code", "platform"]
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


@api_view(["GET"])
@permission_classes([IsVolunteer])
def export_items(request):
    """
    Export collection items as a CSV file.
    Accepts optional query parameters:
    - start_date (YYYY-MM-DD): filter items created on or after this date
    - end_date (YYYY-MM-DD): filter items created on or before this date
    - box_id (int): filter items belonging to a specific box
    - record_type (str): filter by item_type (SOFTWARE, HARDWARE, NON_ELECTRONIC)
    """
    queryset = CollectionItem.objects.all().select_related("box", "current_location")

    # Apply filters
    start_date = request.query_params.get("start_date")
    end_date = request.query_params.get("end_date")
    box_id = request.query_params.get("box_id")
    record_type = request.query_params.get("record_type")

    if start_date:
        try:
            parsed = datetime.strptime(start_date, "%Y-%m-%d")
            queryset = queryset.filter(created_at__date__gte=parsed.date())
        except ValueError:
            return Response(
                {"error": "Invalid start_date format. Use YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    if end_date:
        try:
            parsed = datetime.strptime(end_date, "%Y-%m-%d")
            queryset = queryset.filter(created_at__date__lte=parsed.date())
        except ValueError:
            return Response(
                {"error": "Invalid end_date format. Use YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    if box_id:
        try:
            box_id_int = int(box_id)
        except (TypeError, ValueError):
            return Response(
                {"error": "Invalid box_id. Must be an integer."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        queryset = queryset.filter(box__id=box_id_int)

    if record_type:
        queryset = queryset.filter(item_type=record_type)

    # Build CSV response
    today = datetime.now().strftime("%Y%m%d")
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="made_export_{today}.csv"'

    writer = csv.writer(response)
    writer.writerow(
        [
            "MADE ID",
            "Title",
            "Platform",
            "Item Type",
            "Box Code",
            "Location",
            "Location Type",
            "Working Condition",
            "Status",
            "Created At",
        ]
    )

    for item in queryset:
        writer.writerow(
            [
                item.item_code,
                item.title,
                item.platform,
                item.get_item_type_display(),
                item.box.box_code if item.box else "",
                item.current_location.name if item.current_location else "",
                item.current_location.get_location_type_display() if item.current_location else "",
                "Yes" if item.working_condition else "No",
                item.get_status_display(),
                item.created_at.strftime("%Y-%m-%d %H:%M:%S") if item.created_at else "",
            ]
        )

    return response
