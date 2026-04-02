from django.db import models
from django.conf import settings
from inventory.models import Box, CollectionItem, Location


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
        ("COMPLETED_UNVERIFIED", "Completed Unverified"),
    ]

    item = models.ForeignKey(CollectionItem, on_delete=models.CASCADE, related_name="movement_requests")
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="movement_requests_created",
    )

    from_location = models.ForeignKey(Location, on_delete=models.PROTECT, related_name="movement_requests_from")
    to_location = models.ForeignKey(Location, on_delete=models.PROTECT, related_name="movement_requests_to")

    from_box = models.ForeignKey(
        Box, on_delete=models.SET_NULL, null=True, blank=True, related_name="movement_requests_from"
    )
    to_box = models.ForeignKey(
        Box, on_delete=models.SET_NULL, null=True, blank=True, related_name="movement_requests_to"
    )

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
        """Approve the movement request, set item to IN_TRANSIT, and create history event."""
        from inventory.models import ItemHistory

        self.status = "APPROVED"
        self.admin = admin_user
        self.admin_comment = comment
        self.save()

        # Update item status to IN_TRANSIT
        self.item.status = "IN_TRANSIT"
        update_fields = ["status", "updated_at"]
        # If moving to a box, update box assignment on approval
        if self.to_box:
            self.item.box = self.to_box
            update_fields.append("box")
        elif self.from_box and not self.to_box:
            # Moving out of a box to a location (no target box)
            self.item.box = None
            update_fields.append("box")
        self.item.save(update_fields=update_fields)

        # Create history event for approval
        ItemHistory.objects.create(
            item=self.item,
            event_type="MOVE_APPROVED",
            from_location=self.from_location,
            to_location=self.to_location,
            movement_request=self,
            acted_by=admin_user,
            notes=comment,
        )

        # Create IN_TRANSIT history event
        ItemHistory.objects.create(
            item=self.item,
            event_type="IN_TRANSIT",
            from_location=self.from_location,
            to_location=self.to_location,
            movement_request=self,
            acted_by=admin_user,
            notes=f"Item in transit to {self.to_location.name}",
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

    def complete_arrival(self, user, comment=""):
        """Mark item as arrived at destination, update location, and set status back to AVAILABLE."""
        from inventory.models import ItemHistory

        # Update item location and status
        self.item.current_location = self.to_location
        self.item.is_on_floor = self.to_location.location_type == "FLOOR"
        self.item.status = "AVAILABLE"
        update_fields = ["current_location", "is_on_floor", "status", "updated_at"]
        if self.to_box:
            self.item.box = self.to_box
            update_fields.append("box")
        elif self.from_box and not self.to_box:
            self.item.box = None
            update_fields.append("box")
        self.item.save(update_fields=update_fields)

        # Create ARRIVED history event
        ItemHistory.objects.create(
            item=self.item,
            event_type="ARRIVED",
            from_location=self.from_location,
            to_location=self.to_location,
            movement_request=self,
            acted_by=user,
            notes=comment or f"Item arrived at {self.to_location.name}",
        )

    def complete_unverified(self, user, comment=""):
        """Complete the movement immediately without admin approval. Item stays IN_TRANSIT until verified."""
        from inventory.models import ItemHistory

        self.status = "COMPLETED_UNVERIFIED"
        self.save()

        # Update item location but keep IN_TRANSIT until verified
        self.item.current_location = self.to_location
        self.item.is_on_floor = self.to_location.location_type == "FLOOR"
        self.item.status = "IN_TRANSIT"
        self.item.is_verified = False
        update_fields = ["current_location", "is_on_floor", "status", "is_verified", "updated_at"]
        if self.to_box:
            self.item.box = self.to_box
            update_fields.append("box")
        elif self.from_box and not self.to_box:
            self.item.box = None
            update_fields.append("box")
        self.item.save(update_fields=update_fields)

        # Create ARRIVED history event
        ItemHistory.objects.create(
            item=self.item,
            event_type="ARRIVED",
            from_location=self.from_location,
            to_location=self.to_location,
            movement_request=self,
            acted_by=user,
            notes=comment or f"Item moved to {self.to_location.name} (unverified)",
        )


class BoxMovementRequest(models.Model):
    """
    Represents a request to move a box (and all its items) between locations.
    """

    STATUS_CHOICES = [
        ("WAITING_APPROVAL", "Waiting Approval"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
        ("CANCELLED", "Cancelled"),
        ("COMPLETED_UNVERIFIED", "Completed Unverified"),
    ]

    box = models.ForeignKey(Box, on_delete=models.CASCADE, related_name="box_movement_requests")
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="box_movement_requests_created",
    )

    from_location = models.ForeignKey(Location, on_delete=models.PROTECT, related_name="box_movement_requests_from")
    to_location = models.ForeignKey(Location, on_delete=models.PROTECT, related_name="box_movement_requests_to")

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="WAITING_APPROVAL")

    admin = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="box_movement_requests_reviewed",
        help_text="Admin who approved/rejected",
    )
    admin_comment = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "box_movement_requests"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["box"]),
        ]

    def __str__(self):
        return f"Box Request #{self.id}: {self.box.box_code} from {self.from_location.name} to {self.to_location.name}"

    def approve(self, admin_user, comment=""):
        """Approve the box movement request. Set all items in the box to IN_TRANSIT."""
        from inventory.models import ItemHistory

        self.status = "APPROVED"
        self.admin = admin_user
        self.admin_comment = comment
        self.save()

        # Set all items in the box to IN_TRANSIT
        items = list(self.box.items.all())
        for item in items:
            item.status = "IN_TRANSIT"
            item.save(update_fields=["status", "updated_at"])

            ItemHistory.objects.create(
                item=item,
                event_type="MOVE_APPROVED",
                from_location=self.from_location,
                to_location=self.to_location,
                acted_by=admin_user,
                notes=comment or f"Box {self.box.box_code} move approved",
            )
            ItemHistory.objects.create(
                item=item,
                event_type="IN_TRANSIT",
                from_location=self.from_location,
                to_location=self.to_location,
                acted_by=admin_user,
                notes=f"Item in transit with box {self.box.box_code} to {self.to_location.name}",
            )

    def reject(self, admin_user, comment=""):
        """Reject the box movement request."""
        from inventory.models import ItemHistory

        self.status = "REJECTED"
        self.admin = admin_user
        self.admin_comment = comment
        self.save()

        items = list(self.box.items.all())
        for item in items:
            ItemHistory.objects.create(
                item=item,
                event_type="MOVE_REJECTED",
                from_location=self.from_location,
                to_location=self.to_location,
                acted_by=admin_user,
                notes=comment or f"Box {self.box.box_code} move rejected",
            )

    def complete_unverified(self, user, comment=""):
        """Complete the box movement immediately without admin approval. Items stay IN_TRANSIT until verified."""
        from inventory.models import ItemHistory

        self.status = "COMPLETED_UNVERIFIED"
        self.save()

        # Move the box
        self.box.location = self.to_location
        self.box.save(update_fields=["location", "updated_at"])

        destination_is_floor = self.to_location.location_type == "FLOOR"
        items = list(self.box.items.all())
        for item in items:
            item.current_location = self.to_location
            item.is_on_floor = destination_is_floor
            item.status = "IN_TRANSIT"
            item.is_verified = False
            item.save(update_fields=["current_location", "is_on_floor", "status", "is_verified", "updated_at"])

            ItemHistory.objects.create(
                item=item,
                event_type="ARRIVED",
                from_location=self.from_location,
                to_location=self.to_location,
                acted_by=user,
                notes=comment or f"Box {self.box.box_code} moved to {self.to_location.name} (unverified)",
            )

    def complete_arrival(self, user, comment=""):
        """Mark box as arrived at destination after approved movement."""
        from inventory.models import ItemHistory

        # Move the box
        self.box.location = self.to_location
        self.box.save(update_fields=["location", "updated_at"])

        destination_is_floor = self.to_location.location_type == "FLOOR"
        items = list(self.box.items.all())
        for item in items:
            item.current_location = self.to_location
            item.is_on_floor = destination_is_floor
            item.status = "AVAILABLE"
            item.save(update_fields=["current_location", "is_on_floor", "status", "updated_at"])

            ItemHistory.objects.create(
                item=item,
                event_type="ARRIVED",
                from_location=self.from_location,
                to_location=self.to_location,
                acted_by=user,
                notes=comment or f"Box {self.box.box_code} arrived at {self.to_location.name}",
            )

    def verify(self, admin_user, comment=""):
        """Verify an unverified box movement and mark all items as verified and available."""
        from inventory.models import ItemHistory

        self.status = "APPROVED"
        self.admin = admin_user
        self.admin_comment = comment
        self.save()

        items = list(self.box.items.all())
        for item in items:
            item.is_verified = True
            item.status = "AVAILABLE"
            item.save(update_fields=["is_verified", "status", "updated_at"])

            ItemHistory.objects.create(
                item=item,
                event_type="VERIFIED",
                from_location=self.from_location,
                to_location=self.to_location,
                acted_by=admin_user,
                notes=comment or f"Box {self.box.box_code} location verified by admin",
            )
