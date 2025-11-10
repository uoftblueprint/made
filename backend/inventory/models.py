from django.db import models
from django.conf import settings

# Create your models here.

# Example: Inventory Item Model
# Uncomment and modify as needed for your application
#
# class InventoryItem(models.Model):
#     """
#     Model representing an item in the inventory system.
#     """
#     name = models.CharField(max_length=255, help_text="Item name")
#     description = models.TextField(blank=True)
#     quantity = models.IntegerField(default=0)
#     unit = models.CharField(max_length=50, blank=True, help_text="e.g., kg, pieces, liters")
#     location = models.CharField(max_length=255, blank=True)
#     category = models.CharField(max_length=100, blank=True)
#     
#     # Tracking fields
#     created_by = models.ForeignKey(
#         settings.AUTH_USER_MODEL,
#         on_delete=models.SET_NULL,
#         null=True,
#         related_name='inventory_items'
#     )
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)
#     
#     class Meta:
#         ordering = ['-created_at']
#         verbose_name = "Inventory Item"
#         verbose_name_plural = "Inventory Items"
#     
#     def __str__(self):
#         return f"{self.name} ({self.quantity} {self.unit})"
