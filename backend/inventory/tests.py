import pytest
from django.utils import timezone
from datetime import timedelta
from inventory.models import CollectionItem, Location, ItemHistory
from inventory.utils import get_current_location


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


@pytest.mark.django_db
class TestGetCurrentLocation:
    """Tests for get_current_location algorithm validating location-changing events."""

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
