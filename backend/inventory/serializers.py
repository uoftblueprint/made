from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from .models import Box, CollectionItem, Location


class LocationSerializer(serializers.ModelSerializer):
    """
    Serializer for Location model.
    Used for list/create/update operations.
    """

    location_type_display = serializers.CharField(source="get_location_type_display", read_only=True)
    box_count = serializers.SerializerMethodField()
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Location
        fields = ["id", "name", "location_type", "location_type_display", "description", "box_count", "item_count"]
        read_only_fields = [
            "id",
            "location_type_display",
            "box_count",
            "item_count",
        ]

    def get_box_count(self, obj):
        return obj.boxes.count()

    def get_item_count(self, obj):
        return obj.current_items.count()


class BoxSerializer(serializers.ModelSerializer):
    class Meta:
        model = Box
        fields = ["id", "box_code", "label", "description", "location"]
        read_only_fields = ["id"]


class LocationDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for Location with nested boxes.
    """

    location_type_display = serializers.CharField(source="get_location_type_display", read_only=True)
    boxes = BoxSerializer(many=True, read_only=True)
    box_count = serializers.SerializerMethodField()
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Location
        fields = ["id", "name", "location_type", "location_type_display", "description", "boxes", "box_count", "item_count"]

    def get_box_count(self, obj):
        return obj.boxes.count()

    def get_item_count(self, obj):
        return obj.current_items.count()


class CollectionItemSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = CollectionItem
        fields = ["id", "item_code", "title", "platform", "item_type", "working_condition", "status"]
        read_only_fields = ["id", "item_code", "title", "platform", "item_type", "working_condition", "status"]


class BoxDetailSerializer(serializers.ModelSerializer):
    items = CollectionItemSummarySerializer(many=True, read_only=True)

    class Meta:
        model = Box
        fields = ["id", "box_code", "label", "description", "location", "items"]
        read_only_fields = [
            "id",
            "box_code",
            "label",
            "description",
            "location",
            "items",
        ]


class CollectionItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CollectionItem
        fields = [
            "id",
            "item_code",
            "title",
            "platform",
            "description",
            "item_type",
            "working_condition",
            "status",
            "box",
            "current_location",
            "is_public_visible",
            "is_on_floor",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "item_code",
            "title",
            "platform",
            "description",
            "item_type",
            "working_condition",
            "status",
            "current_location",
            "is_public_visible",
            "is_on_floor",
            "created_at",
            "updated_at",
        ]


class PublicCollectionItemSerializer(serializers.ModelSerializer):
    """
    Serializer for public-facing collection items.
    Exposes read-only collection data without internal fields.
    """

    current_location = LocationSerializer(read_only=True)
    location_name = serializers.SerializerMethodField()

    class Meta:
        model = CollectionItem
        fields = [
            "id",
            "item_code",
            "title",
            "platform",
            "description",
            "item_type",
            "working_condition",
            "status",
            "is_on_floor",
            "current_location",
            "location_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "item_code",
            "title",
            "platform",
            "description",
            "item_type",
            "working_condition",
            "status",
            "is_on_floor",
            "current_location",
            "location_name",
            "created_at",
            "updated_at",
        ]

    def get_location_name(self, obj):
        """Return the location name as a simple string for frontend compatibility."""
        if obj.current_location:
            return obj.current_location.name
        return None


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
            "item_type",
            "working_condition",
            "status",
            "current_location",
            "is_public_visible",
            "is_on_floor",
            "box",
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
