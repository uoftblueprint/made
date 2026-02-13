from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed


class CheckUserAccessMiddleware(MiddlewareMixin):
    def process_request(self, request):
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if auth_header.startswith("Bearer "):
            jwt_auth = JWTAuthentication()
            try:
                user_auth = jwt_auth.authenticate(request)
                if user_auth is not None:
                    user, _ = user_auth
                    if not user.has_active_access():
                        return JsonResponse(
                            {"detail": "Your access has expired or been deactivated. Please contact an administrator."},
                            status=403,
                        )
            except AuthenticationFailed:
                # Invalid token
                pass

        if request.user.is_authenticated:
            if not request.user.has_active_access():
                return JsonResponse(
                    {"detail": "Your access has expired or been deactivated. Please contact an administrator."},
                    status=403,
                )

        return None
