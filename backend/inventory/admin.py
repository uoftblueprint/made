from django.contrib import admin
from .models import Location, Box, CollectionItem, ItemHistory


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    """Admin interface for Location model."""
    list_display = ['name', 'location_type', 'created_at']
    list_filter = ['location_type', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Box)
class BoxAdmin(admin.ModelAdmin):
    """Admin interface for Box model."""
    list_display = ['box_code', 'label', 'location', 'created_at']
    list_filter = ['location', 'created_at']
    search_fields = ['box_code', 'label']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(CollectionItem)
class CollectionItemAdmin(admin.ModelAdmin):
    """Admin interface for CollectionItem model."""
    list_display = ['item_code', 'title', 'platform', 'current_location', 'is_on_floor', 'is_public_visible', 'created_at']
    list_filter = ['platform', 'is_on_floor', 'is_public_visible', 'current_location', 'created_at']
    search_fields = ['item_code', 'title', 'description']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Item Information', {
            'fields': ('item_code', 'title', 'platform', 'description')
        }),
        ('Location', {
            'fields': ('box', 'current_location', 'is_on_floor')
        }),
        ('Visibility', {
            'fields': ('is_public_visible',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(ItemHistory)
class ItemHistoryAdmin(admin.ModelAdmin):
    """Admin interface for ItemHistory model."""
    list_display = ['item', 'event_type', 'from_location', 'to_location', 'acted_by', 'created_at']
    list_filter = ['event_type', 'created_at']
    search_fields = ['item__item_code', 'item__title', 'notes']
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('Event', {
            'fields': ('item', 'event_type')
        }),
        ('Movement', {
            'fields': ('from_location', 'to_location')
        }),
        ('Details', {
            'fields': ('movement_request', 'acted_by', 'notes')
        }),
        ('Timestamp', {
            'fields': ('created_at',)
        }),
    )
