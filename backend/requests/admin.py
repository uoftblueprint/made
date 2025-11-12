from django.contrib import admin
from .models import ItemMovementRequest


@admin.register(ItemMovementRequest)
class ItemMovementRequestAdmin(admin.ModelAdmin):
    """Admin interface for ItemMovementRequest model."""

    list_display = ["id", "item", "requested_by", "from_location", "to_location", "status", "created_at"]
    list_filter = ["status", "created_at"]
    search_fields = ["item__item_code", "item__title", "requested_by__name", "admin_comment"]
    readonly_fields = ["created_at", "updated_at"]

    fieldsets = (
        ("Request Information", {"fields": ("item", "requested_by")}),
        ("Movement", {"fields": ("from_location", "to_location")}),
        ("Review", {"fields": ("status", "admin", "admin_comment")}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )

    actions = ["approve_requests", "reject_requests"]

    def approve_requests(self, request, queryset):
        """Bulk approve selected requests."""
        count = 0
        for movement_request in queryset.filter(status="WAITING_APPROVAL"):
            movement_request.approve(request.user, "Bulk approved via admin")
            count += 1
        self.message_user(request, f"{count} request(s) approved.")

    approve_requests.short_description = "Approve selected requests"

    def reject_requests(self, request, queryset):
        """Bulk reject selected requests."""
        count = 0
        for movement_request in queryset.filter(status="WAITING_APPROVAL"):
            movement_request.reject(request.user, "Bulk rejected via admin")
            count += 1
        self.message_user(request, f"{count} request(s) rejected.")

    reject_requests.short_description = "Reject selected requests"
