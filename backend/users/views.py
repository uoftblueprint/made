from rest_framework import generics, status, permissions, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import transaction
from django.db.models import Q
from datetime import timedelta
import secrets

from .permissions import IsAdmin
from .models import VolunteerApplication, User
from .serializers import (
    VolunteerApplicationSerializer,
    UserRegistrationSerializer,
    UserSerializer,
    UserUpdateSerializer,
)


class VolunteerApplicationAPIView(viewsets.ModelViewSet):
    """
    API endpoint for submitting volunteer applications.

    Currently contains:
        POST /api/volunteer-applications/
    """

    queryset = VolunteerApplication.objects.all()
    serializer_class = VolunteerApplicationSerializer
    permission_classes = [permissions.AllowAny]

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == "create":
            return VolunteerApplicationSerializer
        return VolunteerApplicationSerializer

    def list(self, request, *args, **kwargs):
        """List applications; restrict to admin users using role."""
        user = getattr(request, "user", None)
        if not (user is not None and getattr(user, "is_authenticated", False) and self._is_admin(user)):
            return Response({"detail": "Admin only"}, status=status.HTTP_403_FORBIDDEN)

        return super().list(request, *args, **kwargs)

    def _is_admin(self, user):
        """Check for admin users based on role."""
        return getattr(user, "role", None) == "ADMIN"

    def _handle_review_metadata(self, application):
        """Set reviewed_at and reviewed_by when an application is reviewed."""
        if application.reviewed_at is None:
            application.reviewed_at = timezone.now()

        user = getattr(self.request, "user", None)
        if user is not None and getattr(user, "is_authenticated", False) and application.reviewed_by is None:
            application.reviewed_by = user

        application.save()

    def _handle_volunteer_user_creation(self, application):
        """Create a VOLUNTEER user when an application is approved, if needed."""
        if application.status != "APPROVED":
            return

        exists = User.objects.filter(email=application.email).exists()
        if exists:
            return

        temp_password = secrets.token_urlsafe(12)
        User.objects.create_user(
            email=application.email,
            name=application.name,
            password=temp_password,
            role="VOLUNTEER",
        )

    @transaction.atomic
    def perform_update(self, serializer):
        old_status = serializer.instance.status
        application = serializer.save()

        if old_status != application.status and application.status in {
            "APPROVED",
            "REJECTED",
        }:
            self._handle_review_metadata(application)
            self._handle_volunteer_user_creation(application)


# Register new account
class RegisterView(generics.CreateAPIView):
    """
    Endpoint: POST /api/auth/register/
    """

    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]  # Open to public


# User Profile to check own data
class UserProfileView(APIView):
    """
    Endpoint: GET /api/users/me/
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


# Logout (Needs both refresh and access tokens)
class LogoutView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response(status=status.HTTP_400_BAD_REQUEST)


class UserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        queryset = User.objects.all()

        role = self.request.query_params.get("role")
        if role:
            valid_roles = [choice[0] for choice in User.ROLE_CHOICES]
            if role not in valid_roles:
                return User.objects.none()
            queryset = queryset.filter(role=role)

        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            is_active_bool = is_active.lower() in ["true", "1", "yes"]
            queryset = queryset.filter(is_active=is_active_bool)

        return queryset


class UserUpdateView(generics.UpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserUpdateSerializer
    permission_classes = [IsAdmin]

    def update(self, request, *args, **kwargs):
        """Prevent users from modifying their own account."""
        instance = self.get_object()

        if instance.id == request.user.id:
            return Response(
                {"detail": "You cannot modify your own account."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return super().update(request, *args, **kwargs)


class VolunteerStatsView(APIView):
    """
    Endpoint: GET /api/users/volunteer-stats/
    Returns volunteer statistics and list of expiring volunteers.
    """

    permission_classes = [IsAdmin]

    def get(self, request):
        now = timezone.now()
        seven_days_from_now = now + timedelta(days=7)

        volunteers = User.objects.filter(role="VOLUNTEER")

        active_count = (
            volunteers.filter(is_active=True).filter(Q(access_expires_at__isnull=True) | Q(access_expires_at__gt=now)).count()
        )

        expiring_soon = volunteers.filter(
            is_active=True,
            access_expires_at__isnull=False,
            access_expires_at__gt=now,
            access_expires_at__lte=seven_days_from_now,
        )
        expiring_soon_count = expiring_soon.count()

        expired_count = volunteers.filter(
            access_expires_at__isnull=False,
            access_expires_at__lte=now,
        ).count()

        total_count = volunteers.count()

        expiring_volunteers = [
            {
                "id": v.id,
                "name": v.name,
                "email": v.email,
                "access_expires_at": v.access_expires_at,
            }
            for v in expiring_soon
        ]

        return Response(
            {
                "active_count": active_count,
                "expiring_soon_count": expiring_soon_count,
                "expired_count": expired_count,
                "total_count": total_count,
                "expiring_volunteers": expiring_volunteers,
            }
        )


class VolunteerOptionsView(APIView):
    """
    Endpoint: GET /api/users/volunteer-options/
    Returns available roles, permissions, and event types for volunteer management.
    """

    permission_classes = [IsAdmin]

    def get(self, request):
        roles = [
            {
                "value": "viewer",
                "label": "Viewer",
                "permissions": [
                    "Read-only catalogue access",
                    "View item details",
                    "Search and filter",
                    "No editing permissions",
                ],
            },
            {
                "value": "editor",
                "label": "Editor",
                "permissions": [
                    "All Viewer permissions",
                    "Add new items",
                    "Edit existing items",
                    "All changes need review",
                ],
            },
            {
                "value": "admin",
                "label": "Admin",
                "permissions": [
                    "All Editor permissions",
                    "Review and approve entries",
                    "Manage volunteers",
                    "Export data",
                ],
            },
        ]

        event_types = [
            {"value": "cataloging", "label": "Cataloging"},
            {"value": "events", "label": "Events"},
            {"value": "tours", "label": "Tours"},
        ]

        return Response(
            {
                "roles": roles,
                "event_types": event_types,
            }
        )
