from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import transaction
import secrets

from .models import VolunteerApplication
from .serializers import VolunteerApplicationSerializer

User = get_user_model()


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
        return VolunteerApplicationSerializer  # Can update this later, just for formality

    def list(self, request, *args, **kwargs):
        """List applications; restrict to admin users using role PLACEHOLDER."""
        user = getattr(request, "user", None)
        if not (user is not None and getattr(user, "is_authenticated", False) and self._is_admin(user)):
            return Response({"detail": "Admin only"}, status=status.HTTP_403_FORBIDDEN)

        return super().list(request, *args, **kwargs)

    def _is_admin(self, user):
        """PLACEHOLDER check for admin users based on role."""
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

        if old_status == "PENDING" and application.status in {"APPROVED", "REJECTED"}:
            self._handle_review_metadata(application)
            self._handle_volunteer_user_creation(application)
