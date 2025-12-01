import pytest
from django.test import TestCase
from django.core.management import call_command
from django.core.exceptions import ObjectDoesNotExist
from io import StringIO

from .models import CollectionItem, Location, ItemHistory
from users.models import User


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

    def test_signal_ignores_workflow_events(self):
        """Test that signal doesn't trigger for workflow-only events."""
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
