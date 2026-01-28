"""
Utility functions for inventory management.
"""

from .models import ItemHistory, Location
from .constants import LOCATION_CHANGING_EVENTS


def get_current_location(item_id):
    """
    Get the current location of an item based on its history.

    Only certain events update the "true" location:
    - INITIAL
    - ARRIVED
    - VERIFIED
    - LOCATION_CORRECTION

    Algorithm:
        Finds the most recent location-changing event (ordered by created_at descending)
        and returns its to_location field. If no location-changing events exist, returns None.

    Args:
        item_id: The ID of the CollectionItem

    Returns:
        Location object or None: The Location from the most recent location-changing event's
        to_location field, or None if no location-changing events exist.

    Edge Cases and Behavior:
        - Multiple location-changing events: The function correctly handles multiple events
          by selecting the most recent one (ordered by created_at descending). This is the
          expected behavior as later events supersede earlier ones.

        - INITIAL event with to_location=None: If the INITIAL event has a null to_location,
          the function will return None. This may indicate incomplete data entry.

        - Location-changing event with to_location=None: If any location-changing event
          (INITIAL, ARRIVED, VERIFIED, or LOCATION_CORRECTION) has a null to_location,
          the function will return None. This is unexpected for these event types and may
          indicate a data integrity issue. These events should always have a to_location
          set to represent the item's physical location.

        - No location-changing events: Returns None only when there are no location-changing
          events and no INITIAL event is present. This is expected for items that have only
          workflow events (MOVE_REQUESTED, MOVE_APPROVED, etc.) but no actual location changes
          yet. However, every item should ideally have at least an INITIAL event.

        - Invalid item_id: If the item_id doesn't exist, the query will return no results
          and the function will return None. No exception is raised.
    """
    # Get the most recent location-changing event
    last_event = (
        ItemHistory.objects.filter(
            item_id=item_id, event_type__in=LOCATION_CHANGING_EVENTS
        )
        .order_by("-created_at")
        .first()
    )

    if last_event:
        return last_event.to_location

    return None


def get_item_location_history(item_id):
    """
    Get the complete movement history for an item.

    Args:
        item_id: The ID of the CollectionItem

    Returns:
        QuerySet of ItemHistory ordered by created_at
    """
    return (
        ItemHistory.objects.filter(item_id=item_id)
        .select_related("from_location", "to_location", "acted_by", "movement_request")
        .order_by("created_at")
    )


def is_item_in_transit(item_id):
    """
    Check if an item is currently in transit.

    Args:
        item_id: The ID of the CollectionItem

    Returns:
        Boolean
    """
    last_event = (
        ItemHistory.objects.filter(item_id=item_id).order_by("-created_at").first()
    )

    if last_event:
        return last_event.event_type == "IN_TRANSIT"

    return False


def get_pending_movements_for_item(item_id):
    """
    Get all pending movement requests for an item.

    Args:
        item_id: The ID of the CollectionItem

    Returns:
        QuerySet of ItemMovementRequest
    """
    from requests.models import ItemMovementRequest

    return (
        ItemMovementRequest.objects.filter(item_id=item_id, status="WAITING_APPROVAL")
        .select_related("from_location", "to_location", "requested_by")
        .order_by("-created_at")
    )
