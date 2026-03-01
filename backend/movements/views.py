from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import ItemMovementRequest
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
    ViewSet for managing item movement requests.
    Supports creation, listing, retrieval, approval, and rejection.
    """

    queryset = ItemMovementRequest.objects.all()
    serializer_class = ItemMovementRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Volunteers see only their own requests
        user = self.request.user
        if user.is_staff:
            queryset = ItemMovementRequest.objects.all()  # Admins see all
        else:
            queryset = ItemMovementRequest.objects.filter(requested_by=user)

        # Filter by status if provided
        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Filter by item if provided
        item_filter = self.request.query_params.get("item")
        if item_filter:
            queryset = queryset.filter(item_id=item_filter)

        return queryset

    def perform_create(self, serializer):
        serializer.save(requested_by=self.request.user)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
    def approve(self, request, pk=None):
        move_request = self.get_object()

        if move_request.status != "WAITING_APPROVAL":
            return Response(
                {"detail": "This request has already been processed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        comment = request.data.get("comment", "")
        move_request.approve(admin_user=request.user, comment=comment)
        serializer = self.get_serializer(move_request)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
    def reject(self, request, pk=None):
        move_request = self.get_object()

        if move_request.status != "WAITING_APPROVAL":
            return Response(
                {"detail": "This request has already been processed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        comment = request.data.get("comment", "")
        move_request.reject(admin_user=request.user, comment=comment)
        serializer = self.get_serializer(move_request)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="complete-arrival")
    def complete_arrival(self, request, pk=None):
        """Mark item as arrived at destination after approved movement."""
        move_request = self.get_object()

        if move_request.status != "APPROVED":
            return Response(
                {"detail": "Only approved requests can be marked as arrived."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if item is actually in transit
        if move_request.item.status != "IN_TRANSIT":
            return Response(
                {"detail": "Item is not currently in transit."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        comment = request.data.get("comment", "")
        move_request.complete_arrival(user=request.user, comment=comment)
        serializer = self.get_serializer(move_request)
        return Response(serializer.data, status=status.HTTP_200_OK)
