import json
import pytest

from django.test import TestCase, Client
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework import status
from rest_framework_simplejwt.tokens import AccessToken
from inventory.models import Box, CollectionItem, Location, ItemHistory
from django.utils import timezone
from datetime import timedelta
from inventory.utils import get_current_location
from django.core.management import call_command
from io import StringIO
from users.models import User

# ============================================================================
# PYTEST FIXTURES - Reusable test data
# ============================================================================


@pytest.fixture
def client():
    """Django test client fixture."""
    return Client()


@pytest.fixture
def floor_location():
    """Create a floor location for tests."""
    return Location.objects.create(
        name="Main Floor", location_type="FLOOR", description="Main exhibition floor"
    )


@pytest.fixture
def storage_location():
    """Create a storage location for tests."""
    return Location.objects.create(
        name="Storage Room A", location_type="STORAGE", description="Storage area"
    )


@pytest.fixture
def public_item_snes(floor_location):
    """Create a public SNES item for tests."""
    return CollectionItem.objects.create(
        item_code="SNES001",
        title="Super Mario World",
        platform="SNES",
        description="Classic platformer game",
        current_location=floor_location,
        is_public_visible=True,
        is_on_floor=True,
    )


@pytest.fixture
def public_item_ps2(storage_location):
    """Create a public PS2 item for tests."""
    return CollectionItem.objects.create(
        item_code="PS2001",
        title="Final Fantasy X",
        platform="PS2",
        description="RPG adventure game",
        current_location=storage_location,
        is_public_visible=True,
        is_on_floor=False,
    )


@pytest.fixture
def hidden_item(floor_location):
    """Create a hidden item for tests."""
    return CollectionItem.objects.create(
        item_code="HIDDEN001",
        title="Hidden Game",
        platform="SNES",
        description="This should not appear",
        current_location=floor_location,
        is_public_visible=False,
        is_on_floor=True,
    )


@pytest.fixture
def test_data(
    client,
    floor_location,
    storage_location,
    public_item_snes,
    public_item_ps2,
    hidden_item,
):
    """Fixture that creates all test data and returns a dict with everything."""
    return {
        "client": client,
        "floor_location": floor_location,
        "storage_location": storage_location,
        "public_item_snes": public_item_snes,
        "public_item_ps2": public_item_ps2,
        "hidden_item": hidden_item,
    }


@pytest.fixture
def admin_user():
    """Create admin user for testing."""
    return User.objects.create_user(
        email="admin@inventory.com",
        name="Admin User",
        password="adminpass",
        role="ADMIN",
    )


@pytest.fixture
def volunteer_user():
    """Create volunteer user for testing."""
    return User.objects.create_user(
        email="volunteer@inventory.com",
        name="Volunteer User",
        password="volpass",
        role="VOLUNTEER",
    )


def get_admin_token(client):
    """Login as admin and return access token."""
    res = client.post(
        "/api/auth/login/",
        data=json.dumps({"email": "admin@inventory.com", "password": "adminpass"}),
        content_type="application/json",
    )
    if res.status_code != 200:
        return None
    try:
        data = json.loads(res.content)
    except (TypeError, ValueError):
        return None
    return data.get("access")


def get_volunteer_token(client):
    """Login as volunteer and return access token."""
    res = client.post(
        "/api/auth/login/",
        data=json.dumps({"email": "volunteer@inventory.com", "password": "volpass"}),
        content_type="application/json",
    )
    if res.status_code != 200:
        return None
    try:
        data = json.loads(res.content)
    except (TypeError, ValueError):
        return None
    return data.get("access")


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================


def get_items_from_response(response):
    """Extract items from paginated or non-paginated response."""
    data = json.loads(response.content)
    return data.get("results", data) if isinstance(data, dict) else data


# ============================================================================
# TESTS FOR GET /api/public/items/ (List endpoint)
# ============================================================================


@pytest.mark.django_db
def test_list_returns_public_items(test_data):
    """Test that list endpoint returns only public items."""
    client = test_data["client"]
    response = client.get("/api/inventory/public/items/")

    assert response.status_code == status.HTTP_200_OK
    items = get_items_from_response(response)

    assert len(items) == 2  # Only public items
    item_codes = [item["item_code"] for item in items]
    assert "SNES001" in item_codes
    assert "PS2001" in item_codes
    assert "HIDDEN001" not in item_codes


@pytest.mark.django_db
def test_list_excludes_hidden_items(test_data):
    """Test that items with is_public_visible=False never appear."""
    client = test_data["client"]
    response = client.get("/api/inventory/public/items/")

    assert response.status_code == status.HTTP_200_OK
    items = get_items_from_response(response)

    item_codes = [item["item_code"] for item in items]
    assert "HIDDEN001" not in item_codes
    for item in items:
        # All returned items should be public (implicitly, since hidden ones are filtered)
        assert item.get("item_code") is not None


@pytest.mark.django_db
def test_list_filter_by_platform(test_data):
    """Test filtering by platform parameter."""
    client = test_data["client"]
    response = client.get("/api/inventory/public/items/?platform=SNES")

    assert response.status_code == status.HTTP_200_OK
    items = get_items_from_response(response)

    assert len(items) == 1
    assert items[0]["platform"] == "SNES"
    assert items[0]["item_code"] == "SNES001"


@pytest.mark.django_db
def test_list_filter_by_is_on_floor(test_data):
    """Test filtering by is_on_floor parameter."""
    client = test_data["client"]
    response = client.get("/api/inventory/public/items/?is_on_floor=true")

    assert response.status_code == status.HTTP_200_OK
    items = get_items_from_response(response)

    assert len(items) == 1
    assert items[0]["is_on_floor"] is True
    assert items[0]["item_code"] == "SNES001"


@pytest.mark.django_db
def test_list_filter_by_is_on_floor_false(test_data):
    """Test filtering by is_on_floor=false."""
    client = test_data["client"]
    response = client.get("/api/inventory/public/items/?is_on_floor=false")

    assert response.status_code == status.HTTP_200_OK
    items = get_items_from_response(response)

    assert len(items) == 1
    assert items[0]["is_on_floor"] is False
    assert items[0]["item_code"] == "PS2001"


@pytest.mark.django_db
def test_list_filter_by_is_on_floor_using_one(test_data):
    """Test filtering by is_on_floor=1 (alternative true representation)."""
    client = test_data["client"]
    response = client.get("/api/inventory/public/items/?is_on_floor=1")

    assert response.status_code == status.HTTP_200_OK
    items = get_items_from_response(response)

    # Should return only items with is_on_floor=True (same as "true")
    assert len(items) == 1
    assert items[0]["is_on_floor"] is True
    assert items[0]["item_code"] == "SNES001"


@pytest.mark.django_db
def test_list_filter_by_is_on_floor_using_yes(test_data):
    """Test filtering by is_on_floor=yes (alternative true representation)."""
    client = test_data["client"]
    response = client.get("/api/inventory/public/items/?is_on_floor=yes")

    assert response.status_code == status.HTTP_200_OK
    items = get_items_from_response(response)

    # Should return only items with is_on_floor=True (same as "true")
    assert len(items) == 1
    assert items[0]["is_on_floor"] is True
    assert items[0]["item_code"] == "SNES001"


@pytest.mark.django_db
def test_list_filter_by_is_on_floor_using_zero(test_data):
    """Test filtering by is_on_floor=0 (alternative false representation)."""
    client = test_data["client"]
    response = client.get("/api/inventory/public/items/?is_on_floor=0")

    assert response.status_code == status.HTTP_200_OK
    items = get_items_from_response(response)

    # Should return only items with is_on_floor=False (same as "false")
    assert len(items) == 1
    assert items[0]["is_on_floor"] is False
    assert items[0]["item_code"] == "PS2001"


@pytest.mark.django_db
def test_list_filter_by_is_on_floor_using_no(test_data):
    """Test filtering by is_on_floor=no (alternative false representation)."""
    client = test_data["client"]
    response = client.get("/api/inventory/public/items/?is_on_floor=no")

    assert response.status_code == status.HTTP_200_OK
    items = get_items_from_response(response)

    # Should return only items with is_on_floor=False (same as "false")
    assert len(items) == 1
    assert items[0]["is_on_floor"] is False
    assert items[0]["item_code"] == "PS2001"


@pytest.mark.django_db
def test_list_filter_by_is_on_floor_invalid_value_ignored(test_data):
    """Test that invalid is_on_floor values are ignored (no filtering applied)."""
    client = test_data["client"]
    response = client.get("/api/inventory/public/items/?is_on_floor=maybe")

    assert response.status_code == status.HTTP_200_OK
    items = get_items_from_response(response)

    # Invalid value should be ignored, so all public items should be returned
    # (test_data has 2 public items: SNES001 and PS2001)
    assert len(items) == 2
    item_codes = [item["item_code"] for item in items]
    assert "SNES001" in item_codes
    assert "PS2001" in item_codes


@pytest.mark.django_db
def test_list_filter_by_is_on_floor_invalid_value_returns_all(test_data):
    """Test that invalid is_on_floor values return all items (no filtering)."""
    client = test_data["client"]
    response = client.get("/api/inventory/public/items/?is_on_floor=invalid")

    assert response.status_code == status.HTTP_200_OK
    items = get_items_from_response(response)

    # Invalid value should return all public items (no filtering)
    assert len(items) == 2
    # Both items should be present (one with is_on_floor=True, one with False)
    item_codes = [item["item_code"] for item in items]
    assert "SNES001" in item_codes  # is_on_floor=True
    assert "PS2001" in item_codes  # is_on_floor=False


@pytest.mark.django_db
def test_list_search_by_title(test_data):
    """Test text search by title."""
    client = test_data["client"]
    response = client.get("/api/inventory/public/items/?search=mario")

    assert response.status_code == status.HTTP_200_OK
    items = get_items_from_response(response)

    assert len(items) == 1
    assert "mario" in items[0]["title"].lower()


@pytest.mark.django_db
def test_list_search_by_description(test_data):
    """Test text search by description."""
    client = test_data["client"]
    response = client.get("/api/inventory/public/items/?search=adventure")

    assert response.status_code == status.HTTP_200_OK
    items = get_items_from_response(response)

    assert len(items) == 1
    assert "adventure" in items[0]["description"].lower()


@pytest.mark.django_db
def test_list_search_by_item_code(test_data):
    """Test text search by item_code."""
    client = test_data["client"]
    response = client.get("/api/inventory/public/items/?search=PS2001")

    assert response.status_code == status.HTTP_200_OK
    items = get_items_from_response(response)

    assert len(items) == 1
    assert items[0]["item_code"] == "PS2001"


@pytest.mark.django_db
def test_list_combines_filters(test_data):
    """Test that multiple filters can be combined."""
    client = test_data["client"]
    response = client.get("/api/inventory/public/items/?platform=SNES&is_on_floor=true")

    assert response.status_code == status.HTTP_200_OK
    items = get_items_from_response(response)

    assert len(items) == 1
    assert items[0]["platform"] == "SNES"
    assert items[0]["is_on_floor"] is True


@pytest.mark.django_db
def test_list_no_auth_required(test_data):
    """Test that public endpoint doesn't require authentication."""
    client = test_data["client"]
    # Don't authenticate the client
    response = client.get("/api/inventory/public/items/")

    assert response.status_code == status.HTTP_200_OK
    items = get_items_from_response(response)
    assert len(items) >= 1


@pytest.mark.django_db
def test_list_includes_location_data(test_data):
    """Test that location data is included in response."""
    client = test_data["client"]
    response = client.get("/api/inventory/public/items/")

    assert response.status_code == status.HTTP_200_OK
    items = get_items_from_response(response)

    # Find the SNES item by item_code (don't assume it's first in the list)
    snes_item = next((item for item in items if item["item_code"] == "SNES001"), None)
    assert snes_item is not None, "SNES001 item should be in the list"

    assert "current_location" in snes_item
    assert snes_item["current_location"]["name"] == "Main Floor"
    assert snes_item["current_location"]["location_type"] == "FLOOR"


@pytest.mark.django_db
def test_list_pagination(test_data):
    """Test that pagination works correctly."""
    client = test_data["client"]
    floor_location = test_data["floor_location"]

    # Count existing public items from fixtures
    existing_count = CollectionItem.objects.filter(is_public_visible=True).count()

    # Create multiple items to test pagination
    for i in range(15):
        CollectionItem.objects.create(
            item_code=f"ITEM{i:03d}",
            title=f"Test Item {i}",
            platform="SNES",
            current_location=floor_location,
            is_public_visible=True,
            is_on_floor=True,
        )

    # Test Page 1
    response = client.get("/api/inventory/public/items/")
    assert response.status_code == status.HTTP_200_OK
    data = json.loads(response.content)

    # Check pagination structure
    assert "results" in data
    assert "count" in data
    expected_total = existing_count + 15  # Existing items + 15 new items
    assert data["count"] == expected_total  # Total items
    assert len(data["results"]) == 10  # Page 1 has 10 items
    assert data.get("next") is not None  # Next page exists

    # Get IDs from page 1
    page1_ids = [item["id"] for item in data["results"]]

    # Test Page 2
    response2 = client.get("/api/inventory/public/items/?page=2")
    assert response2.status_code == status.HTTP_200_OK
    data2 = json.loads(response2.content)

    # Check page 2 has remaining items (total - 10 from page 1)
    expected_page2_count = expected_total - 10
    assert len(data2["results"]) == expected_page2_count  # Page 2 has remaining items
    assert data2.get("next") is None  # No more pages
    assert data2.get("previous") is not None  # Can go back to page 1

    # Verify items are different between pages
    page2_ids = [item["id"] for item in data2["results"]]
    assert set(page1_ids) != set(page2_ids)  # Different items


# ============================================================================
# TESTS FOR GET /api/public/items/{id}/ (Detail endpoint)
# ============================================================================


@pytest.mark.django_db
def test_retrieve_public_item(public_item_snes, client):
    """Test retrieving a single public item."""
    response = client.get(f"/api/inventory/public/items/{public_item_snes.id}/")

    assert response.status_code == status.HTTP_200_OK
    data = json.loads(response.content)
    assert data["item_code"] == "SNES001"
    assert data["title"] == "Super Mario World"
    assert data["platform"] == "SNES"
    assert data["is_on_floor"] is True
    assert "current_location" in data


@pytest.mark.django_db
def test_retrieve_hidden_item_returns_404(hidden_item, client):
    """Test that hidden items return 404 even if ID is known."""
    response = client.get(f"/api/inventory/public/items/{hidden_item.id}/")

    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_retrieve_includes_location_details(public_item_snes, floor_location, client):
    """Test that location details are included in detail view."""
    response = client.get(f"/api/inventory/public/items/{public_item_snes.id}/")

    assert response.status_code == status.HTTP_200_OK
    data = json.loads(response.content)
    location = data["current_location"]
    assert location["id"] == floor_location.id
    assert location["name"] == "Main Floor"
    assert location["location_type"] == "FLOOR"
    assert "location_type_display" in location
    assert location["location_type_display"] == "Floor"


@pytest.mark.django_db
def test_retrieve_no_auth_required(public_item_snes, client):
    """Test that detail endpoint doesn't require authentication."""
    # Don't authenticate the client
    response = client.get(f"/api/inventory/public/items/{public_item_snes.id}/")

    assert response.status_code == status.HTTP_200_OK
    data = json.loads(response.content)
    assert data["item_code"] == "SNES001"


@pytest.mark.django_db
def test_retrieve_nonexistent_item_returns_404(client):
    """Test that retrieving non-existent item returns 404."""
    response = client.get("/api/inventory/public/items/99999/")
    assert response.status_code == status.HTTP_404_NOT_FOUND


# ============================================================================
# TESTS FOR POST /api/inventory/items/ (Create - admin/volunteer)
# ============================================================================


@pytest.mark.django_db
def test_post_create_item_success(client, volunteer_user, storage_location):
    """Test volunteer can create a new item via POST."""
    token = get_volunteer_token(client)
    assert token is not None

    payload = {
        "item_code": "NEW001",
        "title": "New Game",
        "platform": "SNES",
        "description": "A new addition",
        "current_location": storage_location.id,
        "is_public_visible": True,
        "is_on_floor": False,
    }
    response = client.post(
        "/api/inventory/items/",
        data=json.dumps(payload),
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )

    assert response.status_code == status.HTTP_201_CREATED
    data = json.loads(response.content)
    assert data["item_code"] == "NEW001"
    assert data["title"] == "New Game"
    assert data["platform"] == "SNES"
    assert CollectionItem.objects.filter(item_code="NEW001").exists()


@pytest.mark.django_db
def test_post_create_item_appears_immediately_in_list(
    client, volunteer_user, storage_location
):
    """New items created via API appear immediately in lists (acceptance criteria)."""
    token = get_volunteer_token(client)

    payload = {
        "item_code": "IMMEDIATE001",
        "title": "Immediate Item",
        "platform": "PS2",
        "current_location": storage_location.id,
        "is_public_visible": True,
        "is_on_floor": False,
    }
    create_res = client.post(
        "/api/inventory/items/",
        data=json.dumps(payload),
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert create_res.status_code == status.HTTP_201_CREATED

    list_res = client.get("/api/inventory/public/items/")
    assert list_res.status_code == status.HTTP_200_OK
    items = get_items_from_response(list_res)
    item_codes = [item["item_code"] for item in items]
    assert "IMMEDIATE001" in item_codes


@pytest.mark.django_db
def test_post_invalid_data_missing_title_rejected(
    client, volunteer_user, storage_location
):
    """Invalid data (e.g., missing title) is rejected (acceptance criteria)."""
    token = get_volunteer_token(client)

    payload = {
        "item_code": "NO_TITLE001",
        "platform": "SNES",
        "current_location": storage_location.id,
        "is_public_visible": True,
    }
    response = client.post(
        "/api/inventory/items/",
        data=json.dumps(payload),
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    data = json.loads(response.content)
    assert "title" in data


@pytest.mark.django_db
def test_post_duplicate_item_code_rejected(client, volunteer_user, storage_location):
    """Creating an item with duplicate barcode/UUID returns 400 with validation message."""
    token = get_volunteer_token(client)

    # Insert first item into test DB
    CollectionItem.objects.create(
        item_code="DUP001",
        title="First Item",
        platform="SNES",
        current_location=storage_location,
        is_public_visible=True,
        is_on_floor=False,
    )

    # Try to create another item with same barcode
    payload = {
        "item_code": "DUP001",
        "title": "Duplicate Item",
        "platform": "PS2",
        "current_location": storage_location.id,
        "is_public_visible": True,
        "is_on_floor": False,
    }
    response = client.post(
        "/api/inventory/items/",
        data=json.dumps(payload),
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    data = json.loads(response.content)
    assert "item_code" in data
    assert "A collection item with this barcode/UUID already exists." in str(
        data["item_code"]
    )


# ============================================================================
# TESTS FOR PUT/PATCH /api/inventory/items/{id}/ (Edit metadata - admin/volunteer)
# ============================================================================


@pytest.mark.django_db
def test_put_edit_metadata_success(
    client, volunteer_user, public_item_snes, floor_location
):
    """Test volunteer can edit metadata (fix typo, change platform) via PATCH."""
    token = get_volunteer_token(client)

    payload = {
        "title": "Super Mario World - Fixed",
        "platform": "SNES",
        "description": "Updated notes",
        "current_location": floor_location.id,
        "is_public_visible": True,
        "is_on_floor": True,
    }
    response = client.patch(
        f"/api/inventory/items/{public_item_snes.id}/",
        data=json.dumps(payload),
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )

    assert response.status_code == status.HTTP_200_OK
    data = json.loads(response.content)
    assert data["title"] == "Super Mario World - Fixed"
    assert data["description"] == "Updated notes"

    public_item_snes.refresh_from_db()
    assert public_item_snes.title == "Super Mario World - Fixed"


@pytest.mark.django_db
def test_put_partial_update_only_description(client, volunteer_user, public_item_snes):
    """Test PATCH can update only description without sending other required fields."""
    token = get_volunteer_token(client)
    original_title = public_item_snes.title

    payload = {"description": "Fixed typo in notes"}
    response = client.patch(
        f"/api/inventory/items/{public_item_snes.id}/",
        data=json.dumps(payload),
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )

    assert response.status_code == status.HTTP_200_OK
    data = json.loads(response.content)
    assert data["title"] == original_title
    assert data["description"] == "Fixed typo in notes"


# ============================================================================
# TESTS FOR DELETE /api/inventory/items/{id}/ (Soft delete - admin only)
# ============================================================================


@pytest.mark.django_db
def test_delete_soft_delete_success(client, admin_user, public_item_snes):
    """Test admin can soft delete (archive) an item via DELETE."""
    token = get_admin_token(client)
    item_id = public_item_snes.id

    response = client.delete(
        f"/api/inventory/items/{item_id}/",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )

    assert response.status_code == status.HTTP_204_NO_CONTENT
    public_item_snes.refresh_from_db()
    assert public_item_snes.is_public_visible is False
    assert CollectionItem.objects.filter(id=item_id).exists()


@pytest.mark.django_db
def test_delete_archived_hidden_from_public_but_in_db(
    client, admin_user, public_item_snes
):
    """Archived items hidden from Public Catalogue but remain in database (acceptance criteria)."""
    token = get_admin_token(client)
    item_id = public_item_snes.id
    item_code = public_item_snes.item_code

    response = client.delete(
        f"/api/inventory/items/{item_id}/",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT

    public_res = client.get("/api/inventory/public/items/")
    items = get_items_from_response(public_res)
    item_codes_list = [item["item_code"] for item in items]
    assert item_code not in item_codes_list

    assert CollectionItem.objects.filter(id=item_id).exists()
    archived = CollectionItem.objects.get(id=item_id)
    assert archived.is_public_visible is False


@pytest.mark.django_db
def test_delete_volunteer_forbidden(client, volunteer_user, public_item_snes):
    """DELETE should only be accessible to admins, not volunteers."""
    token = get_volunteer_token(client)
    response = client.delete(
        f"/api/inventory/items/{public_item_snes.id}/",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN
    public_item_snes.refresh_from_db()
    assert public_item_snes.is_public_visible is True


@pytest.mark.django_db
class TestGetCurrentLocation:
    """Tests for get_current_location algorithm validating location-changing events."""

    @pytest.fixture
    def location_a(db):
        return Location.objects.create(name="Shelf A1", location_type="STORAGE")

    @pytest.fixture
    def location_b(db):
        return Location.objects.create(name="Shelf B2", location_type="STORAGE")

    @pytest.fixture
    def location_c(db):
        return Location.objects.create(name="Floor - Main", location_type="FLOOR")

    @pytest.fixture
    def item(db, location_a):
        return CollectionItem.objects.create(
            item_code="TEST001", title="Test Item", current_location=location_a
        )

    @pytest.mark.parametrize(
        "event_type", ["INITIAL", "ARRIVED", "VERIFIED", "LOCATION_CORRECTION"]
    )
    def test_location_changing_events_update_location(
        self, item, location_a, location_b, event_type
    ):
        """Location-changing events should update the current location."""
        ItemHistory.objects.create(
            item=item, event_type="INITIAL", to_location=location_a
        )
        ItemHistory.objects.create(
            item=item, event_type=event_type, to_location=location_b
        )
        assert get_current_location(item.id) == location_b

    def test_workflow_events_ignored(self, item, location_a, location_b):
        """Workflow-only events should be ignored."""
        ItemHistory.objects.create(
            item=item, event_type="INITIAL", to_location=location_a
        )
        for event in ["MOVE_REQUESTED", "MOVE_APPROVED", "MOVE_REJECTED", "IN_TRANSIT"]:
            ItemHistory.objects.create(
                item=item, event_type=event, to_location=location_b
            )
        assert get_current_location(item.id) == location_a

    def test_most_recent_location_changing_event_wins(
        self, item, location_a, location_b, location_c
    ):
        """Most recent location-changing event should be returned."""
        base_time = timezone.now()
        ItemHistory.objects.create(
            item=item,
            event_type="INITIAL",
            to_location=location_a,
            created_at=base_time,
        )
        ItemHistory.objects.create(
            item=item,
            event_type="ARRIVED",
            to_location=location_b,
            created_at=base_time + timedelta(hours=1),
        )
        ItemHistory.objects.create(
            item=item,
            event_type="VERIFIED",
            to_location=location_c,
            created_at=base_time + timedelta(hours=2),
        )
        assert get_current_location(item.id) == location_c

    def test_no_events_returns_none(self, item):
        """If no location-changing events exist, return None."""
        assert get_current_location(item.id) is None

    def test_only_workflow_events_returns_none(self, item, location_a):
        """If only workflow events exist, return None."""
        ItemHistory.objects.create(
            item=item, event_type="MOVE_REQUESTED", to_location=location_a
        )
        assert get_current_location(item.id) is None

    def test_null_location_returns_none(self, item):
        """Location-changing event with null to_location should return None."""
        ItemHistory.objects.create(item=item, event_type="INITIAL", to_location=None)
        assert get_current_location(item.id) is None

    def test_invalid_item_id_returns_none(self):
        """Invalid item_id should return None without raising exception."""
        assert get_current_location(99999) is None

    def test_complex_workflow_flow(self, item, location_a, location_b, location_c):
        """Test realistic workflow with mixed event types."""
        base_time = timezone.now()
        ItemHistory.objects.create(
            item=item,
            event_type="INITIAL",
            to_location=location_a,
            created_at=base_time,
        )
        ItemHistory.objects.create(
            item=item,
            event_type="MOVE_REQUESTED",
            to_location=location_b,
            created_at=base_time + timedelta(hours=1),
        )
        ItemHistory.objects.create(
            item=item,
            event_type="MOVE_APPROVED",
            to_location=location_b,
            created_at=base_time + timedelta(hours=2),
        )
        ItemHistory.objects.create(
            item=item,
            event_type="ARRIVED",
            to_location=location_b,
            created_at=base_time + timedelta(hours=3),
        )
        ItemHistory.objects.create(
            item=item,
            event_type="VERIFIED",
            to_location=location_c,
            created_at=base_time + timedelta(hours=4),
        )
        assert get_current_location(item.id) == location_c


class ItemLocationTest(TestCase):
    """Test the item location functionality."""

    def setUp(self):
        self.user = User.objects.create_user(
            email="test@example.com",
            name="Test User",
            password="testpass",
            role="VOLUNTEER",
        )
        self.location_storage = Location.objects.create(
            name="Storage A", location_type="STORAGE"
        )
        self.location_floor = Location.objects.create(
            name="Main Floor", location_type="FLOOR"
        )
        self.item = CollectionItem.objects.create(
            item_code="TEST001",
            title="Test Item",
            current_location=self.location_storage,
        )

    def test_update_location_from_history_initial_event(self):
        """Test location update with INITIAL event."""
        # Create INITIAL history event
        ItemHistory.objects.create(
            item=self.item,
            event_type="INITIAL",
            to_location=self.location_storage,
            acted_by=self.user,
        )

        # Update location using model method
        self.item.update_location_from_history()

        self.assertEqual(self.item.current_location, self.location_storage)
        self.assertFalse(self.item.is_on_floor)

    def test_update_location_from_history_floor_move(self):
        """Test location update when item moves to floor."""
        # Create events
        ItemHistory.objects.create(
            item=self.item, event_type="INITIAL", to_location=self.location_storage
        )
        ItemHistory.objects.create(
            item=self.item,
            event_type="ARRIVED",
            from_location=self.location_storage,
            to_location=self.location_floor,
        )

        self.item.update_location_from_history()

        self.assertEqual(self.item.current_location, self.location_floor)
        self.assertTrue(self.item.is_on_floor)

    def test_signal_triggers_on_location_changing_event(self):
        """Test that signal updates item location for location-changing events."""
        # Create ARRIVED event - should trigger signal
        ItemHistory.objects.create(
            item=self.item,
            event_type="ARRIVED",
            to_location=self.location_floor,
            from_location=self.location_storage,
        )

        # Refresh item from database
        self.item.refresh_from_db()

        # Verify location was updated by signal
        self.assertEqual(self.item.current_location, self.location_floor)
        self.assertTrue(self.item.is_on_floor)

    def test_signal_does_not_update_location_for_workflow_events(self):
        """Test that signal triggers but doesn't update location for workflow-only events."""
        original_location = self.item.current_location
        original_is_on_floor = self.item.is_on_floor

        # Create MOVE_REQUESTED event - should NOT trigger signal
        ItemHistory.objects.create(
            item=self.item,
            event_type="MOVE_REQUESTED",
            to_location=self.location_floor,
            from_location=self.location_storage,
        )

        # Refresh item from database
        self.item.refresh_from_db()

        # Verify location was NOT updated
        self.assertEqual(self.item.current_location, original_location)
        self.assertEqual(self.item.is_on_floor, original_is_on_floor)


class RebuildItemLocationsCommandTest(TestCase):
    """Test the management command."""

    def setUp(self):
        self.location = Location.objects.create(
            name="Test Location", location_type="STORAGE"
        )
        self.item = CollectionItem.objects.create(
            item_code="TEST001", title="Test Item", current_location=self.location
        )

    def test_command_all_items(self):
        """Test command rebuilds all items."""
        out = StringIO()
        call_command("rebuild_item_locations", stdout=out)

        output = out.getvalue()
        self.assertIn("Updated", output)

    def test_command_single_item(self):
        """Test command with specific item ID."""
        out = StringIO()
        call_command("rebuild_item_locations", "--item-id", self.item.id, stdout=out)

        output = out.getvalue()
        self.assertIn(f"Updated item {self.item.id}", output)


class BoxEndpointsTest(TestCase):
    """Test box list/detail endpoints and item box assignment."""

    def setUp(self):
        self.user = User.objects.create_user(
            email="boxuser@example.com",
            name="Box User",
            password="testpass",
            role="VOLUNTEER",
        )
        token = AccessToken.for_user(self.user)
        self.client = Client(HTTP_AUTHORIZATION=f"Bearer {token}")
        self.location = Location.objects.create(
            name="Storage Z", location_type="STORAGE"
        )
        self.box_a = Box.objects.create(
            box_code="BOX001",
            label="Box A",
            description="First box",
            location=self.location,
        )
        self.box_b = Box.objects.create(
            box_code="BOX002", label="Box B", description="", location=self.location
        )
        self.item_a = CollectionItem.objects.create(
            item_code="ITEM001",
            title="Item One",
            current_location=self.location,
            box=self.box_a,
        )
        self.item_b = CollectionItem.objects.create(
            item_code="ITEM002",
            title="Item Two",
            current_location=self.location,
        )

    def test_list_boxes(self):
        response = self.client.get("/api/boxes/")

        assert response.status_code == status.HTTP_200_OK
        data = json.loads(response.content)
        results = data.get("results", data)
        box_codes = [box["box_code"] for box in results]
        assert "BOX001" in box_codes
        assert "BOX002" in box_codes

    def test_box_detail_includes_items(self):
        response = self.client.get(f"/api/boxes/{self.box_a.id}/")

        assert response.status_code == status.HTTP_200_OK
        data = json.loads(response.content)
        item_codes = [item["item_code"] for item in data["items"]]
        assert "ITEM001" in item_codes
        assert "ITEM002" not in item_codes

    def test_patch_item_box_updates_box_id(self):
        response = self.client.patch(
            f"/api/inventory/items/{self.item_b.id}/",
            data=json.dumps({"box": self.box_b.id}),
            content_type="application/json",
        )

        assert response.status_code == status.HTTP_200_OK
        self.item_b.refresh_from_db()
        assert self.item_b.box_id == self.box_b.id
