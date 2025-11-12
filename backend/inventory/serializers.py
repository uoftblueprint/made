from rest_framework import serializers

# from .models import InventoryItem

# Create your serializers here.

# Example: InventoryItem Serializer
# Uncomment and modify as needed
#
# class InventoryItemSerializer(serializers.ModelSerializer):
#     """
#     Serializer for the InventoryItem model.
#     Handles conversion between model instances and JSON.
#     """
#     created_by_username = serializers.CharField(source='created_by.username', read_only=True)
#
#     class Meta:
#         model = InventoryItem
#         fields = '__all__'  # Or specify: ['id', 'name', 'quantity', ...]
#         read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']
#
#     def validate_quantity(self, value):
#         """Custom validation for quantity field."""
#         if value < 0:
#             raise serializers.ValidationError("Quantity cannot be negative.")
#         return value
