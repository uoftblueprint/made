from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import UserRegistrationSerializer, UserSerializer


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
