from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from .models import CollectionItem, Location


class LocationSerializer(serializers.ModelSerializer):
    """
    Nested serializer for Location model.
    Used to show location details in public API responses.
    """

    location_type_display = serializers.CharField(source="get_location_type_display", read_only=True)

    class Meta:
        model = Location
        fields = ["id", "name", "location_type", "location_type_display", "description"]
        read_only_fields = ["id", "name", "location_type", "location_type_display", "description"]


class PublicCollectionItemSerializer(serializers.ModelSerializer):
    """
    Serializer for public-facing collection items.
    Exposes read-only collection data without internal fields.
    """

    current_location = LocationSerializer(read_only=True)

    class Meta:
        model = CollectionItem
        fields = [
            "id",
            "item_code",
            "title",
            "platform",
            "description",
            "is_on_floor",
            "current_location",
        ]
        read_only_fields = [
            "id",
            "item_code",
            "title",
            "platform",
            "description",
            "is_on_floor",
            "current_location",
        ]


class AdminCollectionItemSerializer(serializers.ModelSerializer):
    """
    Writable serializer for admin/volunteer create and update.
    Accepts item_code, title, platform, description, current_location (ID), is_public_visible, is_on_floor.
    Returns nested current_location object in responses.
    """

    current_location = serializers.PrimaryKeyRelatedField(queryset=Location.objects.all(), required=True)

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if instance.current_location:
            ret["current_location"] = LocationSerializer(instance.current_location).data
        return ret

    class Meta:
        model = CollectionItem
        fields = [
            "id",
            "item_code",
            "title",
            "platform",
            "description",
            "current_location",
            "is_public_visible",
            "is_on_floor",
        ]
        read_only_fields = ["id"]
        extra_kwargs = {
            "item_code": {
                "required": True,
                "validators": [
                    UniqueValidator(
                        queryset=CollectionItem.objects.all(),
                        message="A collection item with this barcode/UUID already exists.",
                    )
                ],
            },
            "title": {"required": True},
        }
