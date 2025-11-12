from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response

# from .models import InventoryItem
# from .serializers import InventoryItemSerializer

# Create your views here.

# Example: InventoryItem ViewSet
# Uncomment and modify as needed
#
# class InventoryItemViewSet(viewsets.ModelViewSet):
#     """
#     ViewSet for managing inventory items.
#     Provides full CRUD + filtering and search capabilities.
#     """
#     queryset = InventoryItem.objects.all()
#     serializer_class = InventoryItemSerializer
#     permission_classes = [permissions.IsAuthenticatedOrReadOnly]
#     filter_backends = [filters.SearchFilter, filters.OrderingFilter]
#     search_fields = ['name', 'description', 'category']
#     ordering_fields = ['name', 'quantity', 'created_at']
#
#     def perform_create(self, serializer):
#         """Automatically set created_by to current user."""
#         serializer.save(created_by=self.request.user)
#
#     @action(detail=False, methods=['get'])
#     def low_stock(self, request):
#         """
#         Custom endpoint: GET /api/inventory/items/low_stock/
#         Returns items with low quantity.
#         """
#         # Example: items with quantity less than 10
#         low_items = self.queryset.filter(quantity__lt=10)
#         serializer = self.get_serializer(low_items, many=True)
#         return Response(serializer.data)
