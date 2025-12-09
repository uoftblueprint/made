from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """
    Allows access only to admims
    """

    def has_permission(self, request, view):
        # Logged in and ADMIN
        return bool(request.user and request.user.is_authenticated and request.user.role == "ADMIN")


class IsVolunteer(permissions.BasePermission):
    """
    Allows access to volunteers and admins
    """

    def has_permission(self, request, view):
        # Logged in and VOLUNTEER or ADMIN
        return bool(request.user and request.user.is_authenticated and request.user.role in ["VOLUNTEER", "ADMIN"])


class IsActiveAndNotExpired(permissions.BasePermission):
    """
    Global check: Is the user active? Has their access expired?
    """

    def has_permission(self, request, view):
        # 1. Standard authen check
        if not request.user or not request.user.is_authenticated:
            return False

        # Since already cross checking server for user info, might as well add this check for security/instant bans
        # This checks: is_active=True AND access_expires_at > Now
        return request.user.has_active_access()
