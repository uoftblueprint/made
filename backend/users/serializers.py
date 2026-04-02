from rest_framework import serializers
from .models import User, VolunteerApplication


class VolunteerApplicationSerializer(serializers.ModelSerializer):
    """
    Serializer for the VolunteerApplication model.
    Handles creating new volunteer applications upon submission.
    """

    reviewed_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = VolunteerApplication
        fields = [
            "id",
            "name",
            "email",
            "phone_number",
            "motivation_text",
            "status",
            "created_at",
            "reviewed_at",
            "reviewed_by",
        ]
        read_only_fields = ["id", "created_at", "reviewed_at", "reviewed_by"]

    def create(self, validated_data):
        """Create a new volunteer application with PENDING status."""
        validated_data["status"] = "PENDING"
        return super().create(validated_data)


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for the User model.
    Controls what fields are exposed in the API.
    """

    class Meta:
        model = User
        # Changed 'date_joined' to 'created_at'
        # Also added 'role' so frontend can see if ADMIN or VOLUNTEER
        fields = [
            "id",
            "name",
            "email",
            "created_at",
            "role",
            "is_active",
            "access_expires_at",
            "requires_move_approval",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "role",
            "is_active",
            "access_expires_at",
            "requires_move_approval",
        ]


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Used ONLY for registering new users
    """

    password = serializers.CharField(write_only=True, style={"input_type": "password"})

    class Meta:
        model = User
        fields = ["email", "name", "password"]

    def create(self, validated_data):
        # Need to overwrite create to handle password hashing
        user = User.objects.create_user(
            email=validated_data["email"],
            name=validated_data["name"],
            password=validated_data["password"],
            role="VOLUNTEER",  # Default role for new signups, should this be configurable
        )
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating user details by admins.
    Supports name, email, role, is_active, access_expires_at, and requires_move_approval.
    """

    class Meta:
        model = User
        fields = ["name", "email", "role", "is_active", "access_expires_at", "requires_move_approval"]

    def validate_email(self, value):
        """Ensure email is unique, excluding the current user."""
        user = self.instance
        if User.objects.filter(email=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
