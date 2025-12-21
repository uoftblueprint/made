from django.db import models
from django.conf import settings
from inventory.models import CollectionItem, Location


class ItemMovementRequest(models.Model):
    """
    Represents a single request from a volunteer to move an item.
    Workflow-focused table for admin approval process.
    """

    STATUS_CHOICES = [
        ("WAITING_APPROVAL", "Waiting Approval"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
        ("CANCELLED", "Cancelled"),
    ]

    item = models.ForeignKey(CollectionItem, on_delete=models.CASCADE, related_name="movement_requests")
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="movement_requests_created"
    )

    from_location = models.ForeignKey(Location, on_delete=models.PROTECT, related_name="movement_requests_from")
    to_location = models.ForeignKey(Location, on_delete=models.PROTECT, related_name="movement_requests_to")

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="WAITING_APPROVAL")

    admin = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="movement_requests_reviewed",
        help_text="Admin who approved/rejected",
    )
    admin_comment = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "item_movement_requests"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["item"]),
        ]

    def __str__(self):
        return f"Request #{self.id}: {self.item.item_code} from {self.from_location.name} to {self.to_location.name}"

    def approve(self, admin_user, comment=""):
        """Approve the movement request and create history event."""
        from inventory.models import ItemHistory

        self.status = "APPROVED"
        self.admin = admin_user
        self.admin_comment = comment
        self.save()

        # Create history event
        ItemHistory.objects.create(
            item=self.item,
            event_type="MOVE_APPROVED",
            from_location=self.from_location,
            to_location=self.to_location,
            movement_request=self,
            acted_by=admin_user,
            notes=comment,
        )

    def reject(self, admin_user, comment=""):
        """Reject the movement request and create history event."""
        from inventory.models import ItemHistory

        self.status = "REJECTED"
        self.admin = admin_user
        self.admin_comment = comment
        self.save()

        # Create history event
        ItemHistory.objects.create(
            item=self.item,
            event_type="MOVE_REJECTED",
            from_location=self.from_location,
            to_location=self.to_location,
            movement_request=self,
            acted_by=admin_user,
            notes=comment,
        )


class ItemHistory(models.Model):
    """
    Records actions performed on items, including moves.
    """

    ITEM_CHOICES = [
        ("MOVE_REQUESTED", "Move Requested"),
        ("MOVE_APPROVED", "Move Approved"),
        ("MOVE_REJECTED", "Move Rejected"),
        ("MOVE_CANCELLED", "Move Cancelled"),
    ]

    item = models.ForeignKey(CollectionItem, on_delete=models.CASCADE)
    item_type = models.CharField(max_length=50, choices=ITEM_CHOICES)
    from_location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, blank=True, related_name="+")
    to_location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, blank=True, related_name="+")
    movement_request = models.ForeignKey("ItemMovementRequest", on_delete=models.SET_NULL, null=True, blank=True)
    acted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"{self.item_type} for {self.item.item_code} at {self.timestamp}"
