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
    requested_by_username = serializers.CharField(
        source="requested_by.username", read_only=True
    )
    admin_username = serializers.CharField(source="admin.username", read_only=True)

    class Meta:
        model = ItemMovementRequest
        fields = [
            "id",
            "item",
            "requested_by",
            "requested_by_username",
            "from_location",
            "to_location",
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
