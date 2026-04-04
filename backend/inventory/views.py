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

    def get_serializer_class(self):
        return AdminCollectionItemSerializer

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
    NOT USED CURRENTLY
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


# ---------------------------------------------------------------------------
# Column → model field mapping tables per item type
# ---------------------------------------------------------------------------

# Common fields shared across all item types
COMMON_FIELD_MAP = {
    "made id": "item_code",
    "title": "title",
    "game title": "title",         # alternate header (software legacy)
    "name": "title",               # alternate header (hardware legacy)
    "item type": None,             # handled separately
    "condition": "condition",
    "description": "description",
    "notes": "description",
    "date of entry": "date_of_entry",
}

SOFTWARE_FIELD_MAP = {
    **COMMON_FIELD_MAP,
    "platform": "platform",
    "system": "platform",           # alternate header
    "creator/publisher": "creator_publisher",
    "creator publisher": "creator_publisher",
    "release year": "release_year",
    "version/edition": "version_edition",
    "version edition": "version_edition",
    "media type": "media_type",
}

HARDWARE_FIELD_MAP = {
    **COMMON_FIELD_MAP,
    "manufacturer": "manufacturer",
    "model number": "model_number",
    "year manufactured": "year_manufactured",
    "serial number": "serial_number",
    "hardware type": "hardware_type",
}

NON_ELECTRONIC_FIELD_MAP = {
    **COMMON_FIELD_MAP,
    "item subtype": "item_subtype",
    "date published": "date_published",
    "publisher": "publisher",
    "volume number": "volume_number",
    "isbn/catalogue number": "isbn_catalogue_number",
    "isbn catalogue number": "isbn_catalogue_number",
}

ITEM_TYPE_MAP = {
    "software": "SOFTWARE",
    "hardware": "HARDWARE",
    "non-electronic": "NON_ELECTRONIC",
    "non electronic": "NON_ELECTRONIC",
    "nonelectronic": "NON_ELECTRONIC",
}

TYPE_FIELD_MAPS = {
    "SOFTWARE": SOFTWARE_FIELD_MAP,
    "HARDWARE": HARDWARE_FIELD_MAP,
    "NON_ELECTRONIC": NON_ELECTRONIC_FIELD_MAP,
}

CONDITION_MAP = {
    "excellent": "EXCELLENT",
    "good": "GOOD",
    "fair": "FAIR",
    "poor": "POOR",
}


def _get_default_location():
    """Return a fallback storage location, or None if none exists."""
    return (
        Location.objects.filter(location_type="STORAGE").first()
        or Location.objects.first()
    )


@api_view(["POST"])
@permission_classes([IsVolunteer])
def import_items(request):
    """
    Import collection items from a CSV file.

    Expects multipart/form-data with a 'file' field containing a CSV.

    The CSV must include:
      - 'MADE ID'    (required, unique)
      - 'Item Type'  (Software | Hardware | Non-Electronic)
      - Other columns per item type (all optional)

    Returns JSON:
      { "imported": N, "skipped": ["MADE001", ...], "errors": ["row 3: ..."] }
    """
    if "file" not in request.FILES:
        return Response(
            {"error": "No file provided. Send a CSV as 'file' in multipart/form-data."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    csv_file = request.FILES["file"]

    # Decode the uploaded file
    try:
        decoded = csv_file.read().decode("utf-8-sig")  # strip BOM if present
    except UnicodeDecodeError:
        return Response(
            {"error": "File encoding not supported. Please upload a UTF-8 CSV."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    reader = csv.DictReader(decoded.splitlines())

    if not reader.fieldnames:
        return Response(
            {"error": "CSV file is empty or has no headers."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Normalise header names for lookup (lowercase, stripped)
    normalised_headers = {h.strip().lower(): h for h in reader.fieldnames}

    def get_cell(row, *keys):
        """Look up a cell value by any of several normalised key names."""
        for k in keys:
            orig = normalised_headers.get(k.lower())
            if orig and orig in row:
                return (row[orig] or "").strip()
        return ""

    default_location = _get_default_location()

    imported = 0
    skipped = []
    errors = []

    for row_num, row in enumerate(reader, start=2):  # row 1 = headers
        made_id = get_cell(row, "made id")
        if not made_id:
            skipped.append(f"row {row_num}: missing MADE ID")
            continue

        # Skip duplicates
        if CollectionItem.objects.filter(item_code=made_id).exists():
            skipped.append(made_id)
            continue

        # Determine item type
        raw_type = get_cell(row, "item type").lower()
        item_type = ITEM_TYPE_MAP.get(raw_type, "SOFTWARE")  # default SOFTWARE

        field_map = TYPE_FIELD_MAPS[item_type]

        # Build kwargs for CollectionItem
        kwargs: dict = {
            "item_code": made_id,
            "item_type": item_type,
            "needs_review": True,
        }

        for header_lower, field_name in field_map.items():
            if field_name is None:
                continue  # handled separately (e.g. "item type")
            value = get_cell(row, header_lower)
            if not value:
                continue

            # Special handling for certain fields
            if field_name == "condition":
                value = CONDITION_MAP.get(value.lower(), "GOOD")
            elif field_name == "date_of_entry":
                for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y", "%Y.%m.%d"):
                    try:
                        value = datetime.strptime(value, fmt).date()
                        break
                    except ValueError:
                        value = None
                if value is None:
                    continue  # skip unparseable dates

            kwargs[field_name] = value

        # Ensure required FK: current_location
        if default_location is None:
            errors.append(f"row {row_num} ({made_id}): no Location exists in database; cannot import.")
            continue

        kwargs.setdefault("current_location", default_location)
        kwargs.setdefault("title", made_id)  # title is required; use MADE ID as fallback

        try:
            CollectionItem.objects.create(**kwargs)
            imported += 1
        except Exception as exc:
            errors.append(f"row {row_num} ({made_id}): {exc}")

    return Response(
        {"imported": imported, "skipped": skipped, "errors": errors},
        status=status.HTTP_200_OK,
    )
