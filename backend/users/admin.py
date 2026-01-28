from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, VolunteerApplication


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin interface for User model."""

    list_display = [
        "email",
        "name",
        "role",
        "is_active",
        "access_expires_at",
        "created_at",
    ]
    list_filter = ["role", "is_active", "is_staff", "created_at"]
    search_fields = ["email", "name"]
    ordering = ["-created_at"]

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal Info", {"fields": ("name", "role")}),
        (
            "Permissions",
            {"fields": ("is_active", "is_staff", "is_superuser", "access_expires_at")},
        ),
        ("Important dates", {"fields": ("last_login", "created_at", "updated_at")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "name",
                    "role",
                    "password1",
                    "password2",
                    "is_active",
                    "access_expires_at",
                ),
            },
        ),
    )

    readonly_fields = ["created_at", "updated_at", "last_login"]


@admin.register(VolunteerApplication)
class VolunteerApplicationAdmin(admin.ModelAdmin):
    """Admin interface for VolunteerApplication model."""

    list_display = ["name", "email", "status", "created_at", "reviewed_by"]
    list_filter = ["status", "created_at", "reviewed_at"]
    search_fields = ["name", "email", "motivation_text"]
    readonly_fields = ["created_at"]

    fieldsets = (
        ("Applicant Info", {"fields": ("name", "email", "motivation_text")}),
        ("Review", {"fields": ("status", "reviewed_by", "reviewed_at")}),
        ("Timestamps", {"fields": ("created_at",)}),
    )
