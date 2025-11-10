from django.db import models
from django.conf import settings

# Create your models here.

# Example: Request Model
# Uncomment and modify as needed for your application
#
# class Request(models.Model):
#     """
#     Model representing a request for inventory items or actions.
#     """
#     STATUS_CHOICES = [
#         ('pending', 'Pending'),
#         ('approved', 'Approved'),
#         ('rejected', 'Rejected'),
#         ('fulfilled', 'Fulfilled'),
#     ]
#     
#     PRIORITY_CHOICES = [
#         ('low', 'Low'),
#         ('medium', 'Medium'),
#         ('high', 'High'),
#         ('urgent', 'Urgent'),
#     ]
#     
#     # Core fields
#     requester = models.ForeignKey(
#         settings.AUTH_USER_MODEL,
#         on_delete=models.CASCADE,
#         related_name='requests_made'
#     )
#     status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
#     priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
#     description = models.TextField()
#     
#     # Optional fields
#     approved_by = models.ForeignKey(
#         settings.AUTH_USER_MODEL,
#         on_delete=models.SET_NULL,
#         null=True,
#         blank=True,
#         related_name='requests_approved'
#     )
#     notes = models.TextField(blank=True)
#     
#     # Timestamps
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)
#     
#     class Meta:
#         ordering = ['-created_at']
#         verbose_name = "Request"
#         verbose_name_plural = "Requests"
#     
#     def __str__(self):
#         return f"Request #{self.id} - {self.status}"
