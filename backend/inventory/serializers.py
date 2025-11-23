from rest_framework import serializers
from .models import CollectionItem, Location


class LocationSerializer(serializers.ModelSerializer):
    """
    Nested serializer for Location model.
    Used to show location details in public API responses.
    """
    
    location_type_display = serializers.CharField(source='get_location_type_display', read_only=True)
    
    class Meta:
        model = Location
        fields = ['id', 'name', 'location_type', 'location_type_display', 'description']
        read_only_fields = ['id', 'name', 'location_type', 'location_type_display', 'description']


class PublicCollectionItemSerializer(serializers.ModelSerializer):
    """
    Serializer for public-facing collection items.
    Exposes read-only collection data without internal fields.
    """
    
    current_location = LocationSerializer(read_only=True)
    
    class Meta:
        model = CollectionItem
        fields = [
            'id',
            'item_code',
            'title',
            'platform',
            'description',
            'is_on_floor',
            'current_location',
        ]
        read_only_fields = [
            'id',
            'item_code',
            'title',
            'platform',
            'description',
            'is_on_floor',
            'current_location',
        ]
