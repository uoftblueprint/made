from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import UserRegistrationSerializer, UserSerializer

# --- 1. Registration View ---
class RegisterView(generics.CreateAPIView):
    """
    Endpoint: POST /api/auth/register/
    """
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny] # Open to public


# --- 2. User Profile View (The "Me" endpoint) ---
class UserProfileView(APIView):
    """
    Endpoint: GET /api/users/me/
    Returns details of the currently logged-in user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


# --- 3. Logout View (Your existing code) ---
class LogoutView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response(status=status.HTTP_400_BAD_REQUEST)