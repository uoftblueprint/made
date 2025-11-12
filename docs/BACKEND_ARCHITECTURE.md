# Backend Architecture

This document outlines the backend architecture for the MADE inventory management system.

## Technology Stack

- **Framework**: Django 5.2+ with Django REST Framework
- **Database**: PostgreSQL
- **Authentication**: Token-based authentication (Django REST Framework)
- **Testing**: Pytest with pytest-django
- **Code Quality**: Flake8 for linting
- **Environment**: Python 3.11+

## Project Structure

```
backend/
├── core/                   # Django project configuration
│   ├── settings.py        # Project settings
│   ├── urls.py            # Root URL configuration
│   ├── wsgi.py            # WSGI application
│   └── asgi.py            # ASGI application
│
├── users/                  # User management app
│   ├── models.py          # User & VolunteerApplication models
│   ├── serializers.py     # DRF serializers
│   ├── views.py           # API views/viewsets
│   ├── urls.py            # App URL routing
│   ├── admin.py           # Django admin configuration
│   ├── permissions.py     # Custom permissions
│   └── tests/             # Unit tests
│
├── inventory/              # Inventory management app
│   ├── models.py          # Location, Box, CollectionItem, ItemHistory
│   ├── serializers.py     # DRF serializers
│   ├── views.py           # API views/viewsets
│   ├── urls.py            # App URL routing
│   ├── admin.py           # Django admin configuration
│   ├── utils.py           # Helper functions
│   └── tests/             # Unit tests
│
├── requests/               # Movement request app
│   ├── models.py          # ItemMovementRequest model
│   ├── serializers.py     # DRF serializers
│   ├── views.py           # API views/viewsets
│   ├── urls.py            # App URL routing
│   ├── admin.py           # Django admin configuration
│   └── tests/             # Unit tests
│
├── manage.py               # Django management script
├── requirements.txt        # Python dependencies
├── pyproject.toml          # Project metadata
├── pytest.ini              # Pytest configuration
├── conftest.py             # Pytest fixtures
├── .env.example            # Environment variables template
└── DATABASE_SCHEMA.md      # Database schema documentation
```

## Architecture Patterns

### 1. **Django Apps Organization**

The project follows Django's app-based architecture with clear separation of concerns:

- **users**: Authentication, authorization, and volunteer management
- **inventory**: Item tracking, locations, boxes, and history
- **requests**: Movement request workflow

**Benefits:**
- Modular and maintainable
- Each app is self-contained
- Easy to test in isolation
- Reusable across projects

### 2. **Models Layer** (`models.py`)

Django ORM models represent database tables with business logic.

**Pattern:**
```python
# inventory/models.py
class CollectionItem(models.Model):
    """Main collection table - each game/object in the collection."""
    
    item_code = models.CharField(max_length=100, unique=True)
    title = models.CharField(max_length=255)
    current_location = models.ForeignKey(Location, on_delete=models.PROTECT)
    is_on_floor = models.BooleanField(default=False)
    
    class Meta:
        db_table = "collection_items"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["item_code"]),
            models.Index(fields=["is_on_floor"]),
        ]
    
    def update_location_from_history(self):
        """Update current_location based on item history."""
        # Business logic here
```

**Key Features:**
- Custom table names via `Meta.db_table`
- Database indexes for performance
- Business logic methods on models
- Relationships via ForeignKey
- Choices for enum-like fields

### 3. **Serializers Layer** (`serializers.py`)

DRF serializers handle data validation and transformation between JSON and Python objects.

**Pattern:**
```python
# inventory/serializers.py
class CollectionItemSerializer(serializers.ModelSerializer):
    """Serializer for collection items."""
    
    class Meta:
        model = CollectionItem
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def validate_item_code(self, value):
        """Custom validation for item_code."""
        if not value.isalnum():
            raise serializers.ValidationError("Item code must be alphanumeric")
        return value

class CollectionItemDetailSerializer(CollectionItemSerializer):
    """Detailed serializer with nested relationships."""
    
    current_location = LocationSerializer(read_only=True)
    box = BoxSerializer(read_only=True)
    
    class Meta(CollectionItemSerializer.Meta):
        fields = '__all__'
```

**Benefits:**
- Automatic validation
- Nested serialization
- Custom field validation
- Read-only fields
- Different serializers for list vs detail views

### 4. **ViewSets Layer** (`views.py`)

DRF ViewSets provide CRUD operations and custom actions.

**Pattern:**
```python
# inventory/views.py
class CollectionItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing collection items.
    Provides full CRUD + custom actions.
    """
    queryset = CollectionItem.objects.all()
    serializer_class = CollectionItemSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'item_code', 'platform']
    ordering_fields = ['title', 'created_at']
    
    def get_serializer_class(self):
        """Use detailed serializer for retrieve action."""
        if self.action == 'retrieve':
            return CollectionItemDetailSerializer
        return CollectionItemSerializer
    
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """
        Custom endpoint: GET /api/inventory/items/{id}/history/
        Returns item movement history.
        """
        item = self.get_object()
        history = item.history.all()
        serializer = ItemHistorySerializer(history, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def on_floor(self, request):
        """
        Custom endpoint: GET /api/inventory/items/on_floor/
        Returns items currently on floor.
        """
        items = self.queryset.filter(is_on_floor=True)
        serializer = self.get_serializer(items, many=True)
        return Response(serializer.data)
```

**Key Features:**
- Automatic CRUD endpoints
- Custom actions with `@action` decorator
- Permission classes
- Filtering and search
- Different serializers per action

### 5. **URL Routing** (`urls.py`)

DRF routers automatically generate URL patterns for ViewSets.

**Pattern:**
```python
# inventory/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CollectionItemViewSet, LocationViewSet, BoxViewSet

router = DefaultRouter()
router.register(r'items', CollectionItemViewSet, basename='item')
router.register(r'locations', LocationViewSet, basename='location')
router.register(r'boxes', BoxViewSet, basename='box')

urlpatterns = [
    path('', include(router.urls)),
]
```

**Generated URLs:**
```
GET    /api/inventory/items/              # List items
POST   /api/inventory/items/              # Create item
GET    /api/inventory/items/{id}/         # Retrieve item
PUT    /api/inventory/items/{id}/         # Update item
PATCH  /api/inventory/items/{id}/         # Partial update
DELETE /api/inventory/items/{id}/         # Delete item
GET    /api/inventory/items/{id}/history/ # Custom action
GET    /api/inventory/items/on_floor/     # Custom action
```

### 6. **Permissions** (`permissions.py`)

Custom permission classes for role-based access control.

**Pattern:**
```python
# users/permissions.py
from rest_framework import permissions

class IsAdminUser(permissions.BasePermission):
    """Allow access only to admin users."""
    
    def has_permission(self, request, view):
        return request.user and request.user.role == 'ADMIN'

class IsAdminOrReadOnly(permissions.BasePermission):
    """Allow read access to all, write access to admins only."""
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.role == 'ADMIN'
```

### 7. **Custom User Model** (`users/models.py`)

Extended Django user model with role-based access and expiry.

**Key Features:**
- Email-based authentication
- Role field (ADMIN/VOLUNTEER)
- Access expiry tracking
- Custom user manager
- Volunteer application workflow

## Data Flow

```
HTTP Request
    ↓
URL Router
    ↓
ViewSet (with permissions check)
    ↓
Serializer (validation)
    ↓
Model (business logic)
    ↓
Database (PostgreSQL)
    ↓
Model → Serializer → Response
    ↓
HTTP Response (JSON)
```

## Database Schema

### Core Tables

1. **users** - Custom user model
2. **volunteer_applications** - Volunteer signup workflow
3. **locations** - Physical locations (floor, storage, events)
4. **boxes** - Storage boxes with scannable codes
5. **collection_items** - Main inventory items
6. **item_history** - Append-only audit trail
7. **item_movement_requests** - Movement approval workflow

### Key Relationships

```
User ──┬─> ItemMovementRequest (requested_by)
       ├─> ItemMovementRequest (admin)
       └─> ItemHistory (acted_by)

Location ──┬─> Box
           ├─> CollectionItem (current_location)
           ├─> ItemHistory (from_location)
           └─> ItemHistory (to_location)

Box ──> CollectionItem

CollectionItem ──┬─> ItemHistory
                 └─> ItemMovementRequest

ItemMovementRequest ──> ItemHistory
```

## Authentication & Authorization

### Token Authentication

```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
}
```

### Login Flow

1. User sends credentials to `/api/auth/login/`
2. Backend validates and returns token
3. Frontend stores token
4. Token sent in `Authorization: Token <token>` header
5. Backend validates token on each request

### Permission Levels

- **Public**: Read-only access to public catalogue
- **Authenticated**: Create movement requests, view own requests
- **Admin**: Full CRUD, approve/reject requests, manage users

## Best Practices

### 1. **Use ViewSets for standard CRUD**
```python
# ✅ Good
class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer

# ❌ Bad - Don't write manual CRUD views
class ItemListView(APIView):
    def get(self, request):
        # Manual implementation...
```

### 2. **Keep business logic in models**
```python
# ✅ Good
class ItemMovementRequest(models.Model):
    def approve(self, admin_user, comment=""):
        """Approve the movement request."""
        self.status = "APPROVED"
        self.admin = admin_user
        self.save()
        # Create history event
        ItemHistory.objects.create(...)

# ❌ Bad - Logic in views
def approve_request(request, pk):
    req = ItemMovementRequest.objects.get(pk=pk)
    req.status = "APPROVED"
    req.save()
    # Scattered logic...
```

### 3. **Use serializer validation**
```python
# ✅ Good
class ItemSerializer(serializers.ModelSerializer):
    def validate_item_code(self, value):
        if not value.isalnum():
            raise serializers.ValidationError("Invalid code")
        return value

# ❌ Bad - Validation in views
def create_item(request):
    if not request.data['item_code'].isalnum():
        return Response({"error": "Invalid code"})
```

### 4. **Use select_related and prefetch_related**
```python
# ✅ Good - Avoid N+1 queries
queryset = CollectionItem.objects.select_related(
    'current_location', 'box'
).prefetch_related('history')

# ❌ Bad - N+1 queries
queryset = CollectionItem.objects.all()
# Each item.current_location triggers a query
```

### 5. **Use transactions for related operations**
```python
# ✅ Good
from django.db import transaction

@transaction.atomic
def approve_request(request_id, admin_user):
    request_obj = ItemMovementRequest.objects.get(id=request_id)
    request_obj.approve(admin_user)
    # Create history, update item location
    # All or nothing
```

## Environment Variables

```env
# .env
SECRET_KEY=your-secret-key
DEBUG=True
DATABASE_URL=postgresql://user:pass@localhost:5432/made_db
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

## Testing Strategy

### Unit Tests

```python
# inventory/tests/test_models.py
import pytest
from inventory.models import CollectionItem, Location

@pytest.mark.django_db
def test_item_creation():
    location = Location.objects.create(name="Floor", location_type="FLOOR")
    item = CollectionItem.objects.create(
        item_code="ITEM001",
        title="Test Item",
        current_location=location
    )
    assert item.item_code == "ITEM001"
    assert item.is_on_floor == False
```

### API Tests

```python
# inventory/tests/test_views.py
import pytest
from rest_framework.test import APIClient

@pytest.mark.django_db
def test_list_items(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)
    response = api_client.get('/api/inventory/items/')
    assert response.status_code == 200
```

## API Documentation

### Standard Endpoints

All ViewSets provide:
- `GET /api/{app}/{resource}/` - List
- `POST /api/{app}/{resource}/` - Create
- `GET /api/{app}/{resource}/{id}/` - Retrieve
- `PUT /api/{app}/{resource}/{id}/` - Update
- `PATCH /api/{app}/{resource}/{id}/` - Partial Update
- `DELETE /api/{app}/{resource}/{id}/` - Delete

### Custom Actions

Custom actions are defined with `@action` decorator:
- `GET /api/inventory/items/on_floor/` - Items on floor
- `GET /api/inventory/items/{id}/history/` - Item history
- `POST /api/requests/{id}/approve/` - Approve request
- `POST /api/requests/{id}/reject/` - Reject request

## Django Admin

The Django admin interface provides a powerful UI for data management:

```python
# inventory/admin.py
from django.contrib import admin
from .models import CollectionItem

@admin.register(CollectionItem)
class CollectionItemAdmin(admin.ModelAdmin):
    list_display = ['item_code', 'title', 'current_location', 'is_on_floor']
    list_filter = ['is_on_floor', 'is_public_visible']
    search_fields = ['item_code', 'title', 'platform']
    readonly_fields = ['created_at', 'updated_at']
```

Access at: `http://localhost:8000/admin/`

## Performance Considerations

### Database Indexes

```python
class Meta:
    indexes = [
        models.Index(fields=['item_code']),
        models.Index(fields=['is_on_floor']),
        models.Index(fields=['status', 'created_at']),
    ]
```

### Query Optimization

- Use `select_related()` for ForeignKey
- Use `prefetch_related()` for ManyToMany and reverse ForeignKey
- Use `only()` and `defer()` to limit fields
- Add database indexes on frequently queried fields

### Caching Strategy

- Cache public catalogue data
- Cache location/box lists
- Invalidate cache on mutations

## Security Best Practices

1. **Never commit `.env` files**
2. **Use environment variables for secrets**
3. **Validate all user input via serializers**
4. **Use permission classes on all views**
5. **Enable CORS only for trusted origins**
6. **Use HTTPS in production**
7. **Keep dependencies updated**

## Deployment Checklist

- [ ] Set `DEBUG=False`
- [ ] Configure proper `ALLOWED_HOSTS`
- [ ] Use strong `SECRET_KEY`
- [ ] Set up PostgreSQL database
- [ ] Configure static files serving
- [ ] Set up CORS properly
- [ ] Enable HTTPS
- [ ] Set up logging
- [ ] Configure email backend
- [ ] Run migrations
- [ ] Collect static files
- [ ] Set up monitoring

## Future Enhancements

- [ ] Add API versioning
- [ ] Implement GraphQL endpoint
- [ ] Add rate limiting
- [ ] Implement WebSocket for real-time updates
- [ ] Add comprehensive API documentation (Swagger/OpenAPI)
- [ ] Implement background tasks with Celery
- [ ] Add full-text search with PostgreSQL
- [ ] Implement data export functionality

## Related Documentation

- [Frontend Architecture](./FRONTEND_ARCHITECTURE.md)
- [Database Schema](../backend/DATABASE_SCHEMA.md)
- [Contributing Guidelines](../contribution_guidelines.md)
- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
