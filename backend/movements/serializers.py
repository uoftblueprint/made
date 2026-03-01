from rest_framework import serializers
from .models import ItemMovementRequest
from inventory.models import ItemHistory

# from .models import Request

# Create your serializers here.

# Example: Request Serializer
# Uncomment and modify as needed
#
# class RequestSerializer(serializers.ModelSerializer):
#     """
#     Serializer for the Request model.
#     """
#     requester_username = serializers.CharField(source='requester.username', read_only=True)
#     approved_by_username = serializers.CharField(source='approved_by.username', read_only=True)
#
#     class Meta:
#         model = Request
#         fields = '__all__'
#         read_only_fields = ['id', 'created_at', 'updated_at', 'requester']
#
#     def validate(self, data):
#         """Custom validation for the entire object."""
#         # Add any cross-field validation here
#         return data


class ItemMovementRequestSerializer(serializers.ModelSerializer):
    requested_by_username = serializers.CharField(source="requested_by.username", read_only=True)
    admin_username = serializers.CharField(source="admin.username", read_only=True)
    item_code = serializers.CharField(source="item.item_code", read_only=True)
    item_title = serializers.CharField(source="item.title", read_only=True)
    item_platform = serializers.CharField(source="item.platform", read_only=True)
    from_location_name = serializers.CharField(source="from_location.name", read_only=True)
    to_location_name = serializers.CharField(source="to_location.name", read_only=True)

    class Meta:
        model = ItemMovementRequest
        fields = [
            "id",
            "item",
            "item_code",
            "item_title",
            "item_platform",
            "requested_by",
            "requested_by_username",
            "from_location",
            "from_location_name",
            "to_location",
            "to_location_name",
            "status",
            "admin",
            "admin_username",
            "admin_comment",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "requested_by",
            "status",
            "admin",
            "admin_comment",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data):
        # Volunteer is the logged-in user.
        return super().create(validated_data)
