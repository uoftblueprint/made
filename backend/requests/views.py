from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import ItemMovementRequest, ItemHistory
from .serializers import ItemMovementRequestSerializer

# from .models import Request
# from .serializers import RequestSerializer

# Create your views here.

# Example: Request ViewSet
# Uncomment and modify as needed
#
# class RequestViewSet(viewsets.ModelViewSet):
#     """
#     ViewSet for managing requests.
#     Includes custom actions for workflow management.
#     """
#     queryset = Request.objects.all()
#     serializer_class = RequestSerializer
#     permission_classes = [permissions.IsAuthenticatedOrReadOnly]
#
#     def perform_create(self, serializer):
#         """Automatically set requester to current user."""
#         serializer.save(requester=self.request.user)
#
#     @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
#     def approve(self, request, pk=None):
#         """
#         Custom endpoint: POST /api/requests/{id}/approve/
#         Approve a pending request.
#         """
#         request_obj = self.get_object()
#         request_obj.status = 'approved'
#         request_obj.approved_by = request.user
#         request_obj.save()
#         serializer = self.get_serializer(request_obj)
#         return Response(serializer.data)
#
#     @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
#     def reject(self, request, pk=None):
#         """
#         Custom endpoint: POST /api/requests/{id}/reject/
#         Reject a pending request.
#         """
#         request_obj = self.get_object()
#         request_obj.status = 'rejected'
#         request_obj.approved_by = request.user
#         request_obj.save()
#         serializer = self.get_serializer(request_obj)
#         return Response(serializer.data)


class ItemMovementRequestViewSet(viewsets.ModelViewSet):
    """
    viewSet for managing item movement requests.
    supports creation, listing, retrieval, approval, and rejection.
    """
    queryset = ItemMovementRequest.objects.all()
    serializer_class = ItemMovementRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # volunteers see only their own requests
        user = self.request.user
        if user.is_staff:
            return ItemMovementRequest.objects.all()  # admins see all
        return ItemMovementRequest.objects.filter(requested_by=user)

    def perform_create(self, serializer):
        serializer.save(requested_by=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def approve(self, request, pk=None):
        move_request = self.get_object()
        comment = request.data.get('comment', '')
        move_request.approve(admin_user=request.user, comment=comment)
        serializer = self.get_serializer(move_request)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def reject(self, request, pk=None):
        move_request = self.get_object()
        comment = request.data.get('comment', '')
        move_request.reject(admin_user=request.user, comment=comment)
        serializer = self.get_serializer(move_request)
        return Response(serializer.data, status=status.HTTP_200_OK)
