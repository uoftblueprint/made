from rest_framework import generics, status, permissions, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import transaction
import secrets

from .models import VolunteerApplication
from .serializers import (
    VolunteerApplicationSerializer,
    UserRegistrationSerializer,
    UserSerializer
)

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

        if old_status != application.status and application.status in {"APPROVED", "REJECTED"}:
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