import json
import pytest

from django.test import TestCase, Client
from rest_framework import status
from inventory.models import CollectionItem, Location, ItemHistory
from django.utils import timezone
from datetime import timedelta
from inventory.utils import get_current_location
from django.core.management import call_command
from io import StringIO
from users.models import User

class TestPublicCollectionItemList(TestCase):
    """Tests for GET /api/public/items/ endpoint."""

    def setUp(self):
        """Set up test data."""
        self.client = Client()

        # Create locations
        self.floor_location = Location.objects.create(
            name="Main Floor", location_type="FLOOR", description="Main exhibition floor"
        )

        self.storage_location = Location.objects.create(
            name="Storage Room A", location_type="STORAGE", description="Storage area"
        )

        # Create public items
        self.public_item_snes = CollectionItem.objects.create(
            item_code="SNES001",
            title="Super Mario World",
            platform="SNES",
            description="Classic platformer game",
            current_location=self.floor_location,
            is_public_visible=True,
            is_on_floor=True,
        )

        self.public_item_ps2 = CollectionItem.objects.create(
            item_code="PS2001",
            title="Final Fantasy X",
            platform="PS2",
            description="RPG adventure game",
            current_location=self.storage_location,
            is_public_visible=True,
            is_on_floor=False,
        )

        # Create hidden item
        self.hidden_item = CollectionItem.objects.create(
            item_code="HIDDEN001",
            title="Hidden Game",
            platform="SNES",
            description="This should not appear",
            current_location=self.floor_location,
            is_public_visible=False,
            is_on_floor=True,
        )

    def test_list_returns_public_items(self):
        """Test that list endpoint returns only public items."""
        response = self.client.get("/api/public/items/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = json.loads(response.content)

        # Get items from response (handle pagination)
        items = data.get("results", data) if isinstance(data, dict) else data

        self.assertEqual(len(items), 2)  # Only public items
        item_codes = [item["item_code"] for item in items]
        self.assertIn("SNES001", item_codes)
        self.assertIn("PS2001", item_codes)
        self.assertNotIn("HIDDEN001", item_codes)

    def test_list_excludes_hidden_items(self):
        """Test that items with is_public_visible=False never appear."""
        response = self.client.get("/api/public/items/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = json.loads(response.content)
        items = data.get("results", data) if isinstance(data, dict) else data

        item_codes = [item["item_code"] for item in items]
        self.assertNotIn("HIDDEN001", item_codes)
        for item in items:
            # All returned items should be public (implicitly, since hidden ones are filtered)
            self.assertIsNotNone(item.get("item_code"))

    def test_list_filter_by_platform(self):
        """Test filtering by platform parameter."""
        response = self.client.get("/api/public/items/?platform=SNES")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = json.loads(response.content)
        items = data.get("results", data) if isinstance(data, dict) else data

        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["platform"], "SNES")
        self.assertEqual(items[0]["item_code"], "SNES001")

    def test_list_filter_by_is_on_floor(self):
        """Test filtering by is_on_floor parameter."""
        response = self.client.get("/api/public/items/?is_on_floor=true")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = json.loads(response.content)
        items = data.get("results", data) if isinstance(data, dict) else data

        self.assertEqual(len(items), 1)
        self.assertTrue(items[0]["is_on_floor"])
        self.assertEqual(items[0]["item_code"], "SNES001")

    def test_list_filter_by_is_on_floor_false(self):
        """Test filtering by is_on_floor=false."""
        response = self.client.get("/api/public/items/?is_on_floor=false")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = json.loads(response.content)
        items = data.get("results", data) if isinstance(data, dict) else data

        self.assertEqual(len(items), 1)
        self.assertFalse(items[0]["is_on_floor"])
        self.assertEqual(items[0]["item_code"], "PS2001")

    def test_list_search_by_title(self):
        """Test text search by title."""
        response = self.client.get("/api/public/items/?search=mario")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = json.loads(response.content)
        items = data.get("results", data) if isinstance(data, dict) else data

        self.assertEqual(len(items), 1)
        self.assertIn("mario", items[0]["title"].lower())

    def test_list_search_by_description(self):
        """Test text search by description."""
        response = self.client.get("/api/public/items/?search=adventure")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = json.loads(response.content)
        items = data.get("results", data) if isinstance(data, dict) else data

        self.assertEqual(len(items), 1)
        self.assertIn("adventure", items[0]["description"].lower())

    def test_list_search_by_item_code(self):
        """Test text search by item_code."""
        response = self.client.get("/api/public/items/?search=PS2001")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = json.loads(response.content)
        items = data.get("results", data) if isinstance(data, dict) else data

        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["item_code"], "PS2001")

    def test_list_combines_filters(self):
        """Test that multiple filters can be combined."""
        response = self.client.get("/api/public/items/?platform=SNES&is_on_floor=true")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = json.loads(response.content)
        items = data.get("results", data) if isinstance(data, dict) else data

        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["platform"], "SNES")
        self.assertTrue(items[0]["is_on_floor"])

    def test_list_no_auth_required(self):
        """Test that public endpoint doesn't require authentication."""
        # Don't authenticate the client
        response = self.client.get("/api/public/items/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = json.loads(response.content)
        items = data.get("results", data) if isinstance(data, dict) else data
        self.assertGreaterEqual(len(items), 1)

    def test_list_includes_location_data(self):
        """Test that location data is included in response."""
        response = self.client.get("/api/public/items/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = json.loads(response.content)
        items = data.get("results", data) if isinstance(data, dict) else data

        # Find the SNES item by item_code (don't assume it's first in the list)
        snes_item = next((item for item in items if item["item_code"] == "SNES001"), None)
        self.assertIsNotNone(snes_item, "SNES001 item should be in the list")

        self.assertIn("current_location", snes_item)
        self.assertEqual(snes_item["current_location"]["name"], "Main Floor")
        self.assertEqual(snes_item["current_location"]["location_type"], "FLOOR")

    def test_list_pagination(self):
        """Test that pagination works correctly."""
        # Create multiple items to test pagination
        for i in range(15):
            CollectionItem.objects.create(
                item_code=f"ITEM{i:03d}",
                title=f"Test Item {i}",
                platform="SNES",
                current_location=self.floor_location,
                is_public_visible=True,
                is_on_floor=True,
            )

        response = self.client.get("/api/public/items/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = json.loads(response.content)

        # Check if pagination is present (DRF default is 10 per page)
        if "results" in data:
            self.assertIn("count", data)
            self.assertLessEqual(len(data["results"]), 10)


class TestPublicCollectionItemDetail(TestCase):
    """Tests for GET /api/public/items/{id}/ endpoint."""

    def setUp(self):
        """Set up test data."""
        self.client = Client()

        # Create location
        self.floor_location = Location.objects.create(
            name="Main Floor", location_type="FLOOR", description="Main exhibition floor"
        )

        # Create public item
        self.public_item_snes = CollectionItem.objects.create(
            item_code="SNES001",
            title="Super Mario World",
            platform="SNES",
            description="Classic platformer game",
            current_location=self.floor_location,
            is_public_visible=True,
            is_on_floor=True,
        )

        # Create hidden item
        self.hidden_item = CollectionItem.objects.create(
            item_code="HIDDEN001",
            title="Hidden Game",
            platform="SNES",
            description="This should not appear",
            current_location=self.floor_location,
            is_public_visible=False,
            is_on_floor=True,
        )

    def test_retrieve_public_item(self):
        """Test retrieving a single public item."""
        response = self.client.get(f"/api/public/items/{self.public_item_snes.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = json.loads(response.content)
        self.assertEqual(data["item_code"], "SNES001")
        self.assertEqual(data["title"], "Super Mario World")
        self.assertEqual(data["platform"], "SNES")
        self.assertTrue(data["is_on_floor"])
        self.assertIn("current_location", data)

    def test_retrieve_hidden_item_returns_404(self):
        """Test that hidden items return 404 even if ID is known."""
        response = self.client.get(f"/api/public/items/{self.hidden_item.id}/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_includes_location_details(self):
        """Test that location details are included in detail view."""
        response = self.client.get(f"/api/public/items/{self.public_item_snes.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = json.loads(response.content)
        location = data["current_location"]
        self.assertEqual(location["id"], self.floor_location.id)
        self.assertEqual(location["name"], "Main Floor")
        self.assertEqual(location["location_type"], "FLOOR")
        self.assertIn("location_type_display", location)
        self.assertEqual(location["location_type_display"], "Floor")

    def test_retrieve_no_auth_required(self):
        """Test that detail endpoint doesn't require authentication."""
        # Don't authenticate the client
        response = self.client.get(f"/api/public/items/{self.public_item_snes.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = json.loads(response.content)
        self.assertEqual(data["item_code"], "SNES001")

    def test_retrieve_nonexistent_item_returns_404(self):
        """Test that retrieving non-existent item returns 404."""
        response = self.client.get("/api/public/items/99999/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

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
        return CollectionItem.objects.create(item_code="TEST001", title="Test Item", current_location=location_a)

    @pytest.mark.parametrize("event_type", ["INITIAL", "ARRIVED", "VERIFIED", "LOCATION_CORRECTION"])
    def test_location_changing_events_update_location(self, item, location_a, location_b, event_type):
        """Location-changing events should update the current location."""
        ItemHistory.objects.create(item=item, event_type="INITIAL", to_location=location_a)
        ItemHistory.objects.create(item=item, event_type=event_type, to_location=location_b)
        assert get_current_location(item.id) == location_b

    def test_workflow_events_ignored(self, item, location_a, location_b):
        """Workflow-only events should be ignored."""
        ItemHistory.objects.create(item=item, event_type="INITIAL", to_location=location_a)
        for event in ["MOVE_REQUESTED", "MOVE_APPROVED", "MOVE_REJECTED", "IN_TRANSIT"]:
            ItemHistory.objects.create(item=item, event_type=event, to_location=location_b)
        assert get_current_location(item.id) == location_a

    def test_most_recent_location_changing_event_wins(self, item, location_a, location_b, location_c):
        """Most recent location-changing event should be returned."""
        base_time = timezone.now()
        ItemHistory.objects.create(item=item, event_type="INITIAL", to_location=location_a, created_at=base_time)
        ItemHistory.objects.create(
            item=item, event_type="ARRIVED", to_location=location_b, created_at=base_time + timedelta(hours=1)
        )
        ItemHistory.objects.create(
            item=item, event_type="VERIFIED", to_location=location_c, created_at=base_time + timedelta(hours=2)
        )
        assert get_current_location(item.id) == location_c

    def test_no_events_returns_none(self, item):
        """If no location-changing events exist, return None."""
        assert get_current_location(item.id) is None

    def test_only_workflow_events_returns_none(self, item, location_a):
        """If only workflow events exist, return None."""
        ItemHistory.objects.create(item=item, event_type="MOVE_REQUESTED", to_location=location_a)
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
        ItemHistory.objects.create(item=item, event_type="INITIAL", to_location=location_a, created_at=base_time)
        ItemHistory.objects.create(
            item=item, event_type="MOVE_REQUESTED", to_location=location_b, created_at=base_time + timedelta(hours=1)
        )
        ItemHistory.objects.create(
            item=item, event_type="MOVE_APPROVED", to_location=location_b, created_at=base_time + timedelta(hours=2)
        )
        ItemHistory.objects.create(
            item=item, event_type="ARRIVED", to_location=location_b, created_at=base_time + timedelta(hours=3)
        )
        ItemHistory.objects.create(
            item=item, event_type="VERIFIED", to_location=location_c, created_at=base_time + timedelta(hours=4)
        )
        assert get_current_location(item.id) == location_c


class ItemLocationTest(TestCase):
    """Test the item location functionality."""

    def setUp(self):
        self.user = User.objects.create_user(email="test@example.com", name="Test User", password="testpass", role="VOLUNTEER")
        self.location_storage = Location.objects.create(name="Storage A", location_type="STORAGE")
        self.location_floor = Location.objects.create(name="Main Floor", location_type="FLOOR")
        self.item = CollectionItem.objects.create(
            item_code="TEST001", title="Test Item", current_location=self.location_storage
        )

    def test_update_location_from_history_initial_event(self):
        """Test location update with INITIAL event."""
        # Create INITIAL history event
        ItemHistory.objects.create(item=self.item, event_type="INITIAL", to_location=self.location_storage, acted_by=self.user)

        # Update location using model method
        self.item.update_location_from_history()

        self.assertEqual(self.item.current_location, self.location_storage)
        self.assertFalse(self.item.is_on_floor)

    def test_update_location_from_history_floor_move(self):
        """Test location update when item moves to floor."""
        # Create events
        ItemHistory.objects.create(item=self.item, event_type="INITIAL", to_location=self.location_storage)
        ItemHistory.objects.create(
            item=self.item, event_type="ARRIVED", from_location=self.location_storage, to_location=self.location_floor
        )

        self.item.update_location_from_history()

        self.assertEqual(self.item.current_location, self.location_floor)
        self.assertTrue(self.item.is_on_floor)

    def test_signal_triggers_on_location_changing_event(self):
        """Test that signal updates item location for location-changing events."""
        # Create ARRIVED event - should trigger signal
        ItemHistory.objects.create(
            item=self.item, event_type="ARRIVED", to_location=self.location_floor, from_location=self.location_storage
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
            item=self.item, event_type="MOVE_REQUESTED", to_location=self.location_floor, from_location=self.location_storage
        )

        # Refresh item from database
        self.item.refresh_from_db()

        # Verify location was NOT updated
        self.assertEqual(self.item.current_location, original_location)
        self.assertEqual(self.item.is_on_floor, original_is_on_floor)


class RebuildItemLocationsCommandTest(TestCase):
    """Test the management command."""

    def setUp(self):
        self.location = Location.objects.create(name="Test Location", location_type="STORAGE")
        self.item = CollectionItem.objects.create(item_code="TEST001", title="Test Item", current_location=self.location)

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
