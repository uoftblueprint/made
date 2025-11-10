from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.

# Example: Custom User Model
# Uncomment and modify as needed for your application
#
# class User(AbstractUser):
#     """
#     Custom user model extending Django's AbstractUser.
#     Add any additional fields you need here.
#     """
#     email = models.EmailField(unique=True)
#     phone_number = models.CharField(max_length=15, blank=True)
#     
#     def __str__(self):
#         return self.username
#
# Note: If you create a custom User model, remember to:
# 1. Set AUTH_USER_MODEL = 'users.User' in settings.py
# 2. Run makemigrations and migrate BEFORE creating any other models
