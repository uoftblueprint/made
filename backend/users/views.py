from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

# from .models import User
# from .serializers import UserSerializer, UserCreateSerializer

# Create your views here.

# Example: User ViewSet
# Uncomment and modify as needed
#
# class UserViewSet(viewsets.ModelViewSet):
#     """
#     ViewSet for managing users.
#     Provides CRUD operations: list, create, retrieve, update, delete
#     """
#     queryset = User.objects.all()
#     serializer_class = UserSerializer
#     permission_classes = [permissions.IsAuthenticatedOrReadOnly]
#
#     def get_serializer_class(self):
#         """Return appropriate serializer based on action."""
#         if self.action == 'create':
#             return UserCreateSerializer
#         return UserSerializer
#
#     @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
#     def me(self, request):
#         """
#         Custom endpoint: GET /api/users/me/
#         Returns the current authenticated user.
#         """
#         serializer = self.get_serializer(request.user)
#         return Response(serializer.data)
