from rest_framework import serializers

# from .models import User

# Create your serializers here.

# Example: User Serializer
# Uncomment and modify as needed
#
# class UserSerializer(serializers.ModelSerializer):
#     """
#     Serializer for the User model.
#     Controls what fields are exposed in the API.
#     """
#     class Meta:
#         model = User
#         fields = ['id', 'username', 'email', 'first_name', 'last_name', 'date_joined']
#         read_only_fields = ['id', 'date_joined']
#
#
# class UserCreateSerializer(serializers.ModelSerializer):
#     """
#     Serializer for creating new users with password handling.
#     """
#     password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
#
#     class Meta:
#         model = User
#         fields = ['username', 'email', 'password', 'first_name', 'last_name']
#
#     def create(self, validated_data):
#         """Create user with encrypted password."""
#         return User.objects.create_user(**validated_data)
