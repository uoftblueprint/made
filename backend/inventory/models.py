from django.db import models
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
import logging

from .constants import LOCATION_CHANGING_EVENTS

logger = logging.getLogger(__name__)


class Location(models.Model):
    """
    Generic place where an item/box can live.
    Examples: shelves, floor, storage, events.
    """

    LOCATION_TYPE_CHOICES = [
        ("FLOOR", "Floor"),
        ("STORAGE", "Storage"),
        ("EVENT", "Event"),
        ("OTHER", "Other"),
    ]

    name = models.CharField(max_length=255, help_text="e.g., 'Shelf A1', 'Floor - Main Exhibit'")
    location_type = models.CharField(max_length=30, choices=LOCATION_TYPE_CHOICES)
    description = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "locations"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.get_location_type_display()})"


class Box(models.Model):
    """
    Physical boxes that hold items.
    """

    box_code = models.CharField(max_length=100, unique=True, help_text="Scannable code")
    label = models.CharField(max_length=255, blank=True, help_text="Human-friendly label")
    location = models.ForeignKey(Location, on_delete=models.PROTECT, related_name="boxes")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "boxes"
        verbose_name_plural = "Boxes"
        ordering = ["box_code"]

    def __str__(self):
        return f"{self.box_code} - {self.label or 'Unlabeled'}"


class CollectionItem(models.Model):
    """
    Main collection table - each game/object in the collection.
    """

    item_code = models.CharField(max_length=100, unique=True, help_text="Barcode / scanned code")
    title = models.CharField(max_length=255)
    platform = models.CharField(max_length=100, blank=True, help_text="e.g., 'SNES', 'PS2'")
    description = models.TextField(blank=True)

    box = models.ForeignKey(Box, on_delete=models.SET_NULL, null=True, blank=True, related_name="items")
    current_location = models.ForeignKey(Location, on_delete=models.PROTECT, related_name="current_items")

    is_public_visible = models.BooleanField(default=True, help_text="For public catalogue")
    is_on_floor = models.BooleanField(default=False, help_text="Redundant but fast for queries")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "collection_items"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["item_code"]),
            models.Index(fields=["is_on_floor"]),
            models.Index(fields=["is_public_visible"]),
        ]

    def __str__(self):
        return f"{self.item_code} - {self.title}"

    def update_location_from_history(self):
        """
        Update current_location and is_on_floor based on item history.
        Call this after adding history events.
        """
        from .utils import get_current_location

        location = get_current_location(self.id)
        if location:
            self.current_location = location
            self.is_on_floor = location.location_type == "FLOOR"
            self.save(update_fields=["current_location", "is_on_floor", "updated_at"])


class ItemHistory(models.Model):
    """
    History table - never overwrite, only append events.
    The current location is derived from the last valid event.
    """

    EVENT_TYPE_CHOICES = [
        ("INITIAL", "Initial"),
        ("MOVE_REQUESTED", "Move Requested"),
        ("MOVE_APPROVED", "Move Approved"),
        ("MOVE_REJECTED", "Move Rejected"),
        ("IN_TRANSIT", "In Transit"),
        ("ARRIVED", "Arrived"),
        ("VERIFIED", "Verified"),
        ("LOCATION_CORRECTION", "Location Correction"),
    ]

    item = models.ForeignKey(CollectionItem, on_delete=models.CASCADE, related_name="history")

    event_type = models.CharField(max_length=30, choices=EVENT_TYPE_CHOICES)

    from_location = models.ForeignKey(Location, on_delete=models.PROTECT, null=True, blank=True, related_name="history_from")
    to_location = models.ForeignKey(Location, on_delete=models.PROTECT, null=True, blank=True, related_name="history_to")

    # Optional link back to movement request for traceability
    movement_request = models.ForeignKey(
        "requests.ItemMovementRequest", on_delete=models.SET_NULL, null=True, blank=True, related_name="history_events"
    )

    acted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="item_actions"
    )

    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "item_history"
        ordering = ["created_at"]
        verbose_name_plural = "Item histories"
        indexes = [
            models.Index(fields=["item", "created_at"]),
            models.Index(fields=["event_type"]),
        ]

    def __str__(self):
        return f"{self.item.item_code} - {self.get_event_type_display()} at {self.created_at}"


@receiver(post_save, sender=ItemHistory)
def update_item_location_on_history_change(sender, instance, created, **kwargs):
    """
    Update item location when a new history event is created.
    Only triggers for location-changing events (INITIAL, ARRIVED, VERIFIED, LOCATION_CORRECTION).
    """
    if created and instance.event_type in LOCATION_CHANGING_EVENTS:
        # Use try/except to prevent cascading failures
        try:
            item: CollectionItem = instance.item
            item.update_location_from_history()
        except Exception as e:
            # Log error but don't raise to prevent disrupting the original save
            logger.error(f"Failed to update item location for item {instance.item_id}: {e}")
