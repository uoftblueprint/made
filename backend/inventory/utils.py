"""
Utility functions for inventory management.
"""
from .models import ItemHistory, Location


def get_current_location(item_id):
    """
    Get the current location of an item based on its history.
    
    Only certain events update the "true" location:
    - INITIAL
    - ARRIVED
    - VERIFIED
    - LOCATION_CORRECTION
    
    Args:
        item_id: The ID of the CollectionItem
        
    Returns:
        Location object or None
    """
    # Events that actually change the physical location
    LOCATION_CHANGING_EVENTS = [
        'INITIAL',
        'ARRIVED',
        'VERIFIED',
        'LOCATION_CORRECTION'
    ]
    
    # Get the most recent location-changing event
    last_event = ItemHistory.objects.filter(
        item_id=item_id,
        event_type__in=LOCATION_CHANGING_EVENTS
    ).order_by('-created_at').first()
    
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
    return ItemHistory.objects.filter(
        item_id=item_id
    ).select_related(
        'from_location',
        'to_location',
        'acted_by',
        'movement_request'
    ).order_by('created_at')


def is_item_in_transit(item_id):
    """
    Check if an item is currently in transit.
    
    Args:
        item_id: The ID of the CollectionItem
        
    Returns:
        Boolean
    """
    last_event = ItemHistory.objects.filter(
        item_id=item_id
    ).order_by('-created_at').first()
    
    if last_event:
        return last_event.event_type == 'IN_TRANSIT'
    
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
    
    return ItemMovementRequest.objects.filter(
        item_id=item_id,
        status='WAITING_APPROVAL'
    ).select_related(
        'from_location',
        'to_location',
        'requested_by'
    ).order_by('-created_at')
