from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.utils import timezone


class UserManager(BaseUserManager):
    """Custom manager for User model."""

    def create_user(self, email, name, password=None, **extra_fields):
        """Create and return a regular user."""
        if not email:
            raise ValueError("Users must have an email address")

        email = self.normalize_email(email)
        user = self.model(email=email, name=name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, password=None, **extra_fields):
        """Create and return a superuser."""
        extra_fields.setdefault("role", "ADMIN")
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        return self.create_user(email, name, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom user model for volunteers and admins.
    Tracks who can log in and whether they still have access.
    """

    ROLE_CHOICES = [
        ("ADMIN", "Admin"),
        ("VOLUNTEER", "Volunteer"),
    ]

    email = models.EmailField(max_length=255, unique=True)
    name = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    access_expires_at = models.DateTimeField(
        null=True, blank=True, help_text="Null = no expiry (for admins etc.)"
    )
    is_active = models.BooleanField(default=True)

    # Required for Django admin
    is_staff = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]

    class Meta:
        db_table = "users"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.email})"

    def has_active_access(self):
        """Check if user has active access (not expired)."""
        if not self.is_active:
            return False
        if self.access_expires_at is None:
            return True
        return self.access_expires_at > timezone.now()


class VolunteerApplication(models.Model):
    """
    Captures the volunteer application flow.
    Volunteer fills form → admin approves.
    """

    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
    ]

    name = models.CharField(max_length=255)
    email = models.EmailField(max_length=255)
    motivation_text = models.TextField(
        blank=True, help_text="Why they want to help, etc."
    )

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING")

    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        "User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_applications",
    )

    class Meta:
        db_table = "volunteer_applications"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} - {self.status}"
