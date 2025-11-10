# Database Schema Documentation

## Overview
This database schema implements a museum/collection inventory management system with volunteer access control, item tracking, and a complete movement history system.

## Tables

### 1. `users` - Volunteers & Admins
Tracks who can log in and whether they still have access.

**Key Features:**
- Email-based authentication
- Role-based access (ADMIN/VOLUNTEER)
- Time-limited access for volunteers via `access_expires_at`
- Active/inactive status

**Usage:**
```python
# Check if user has active access
user.has_active_access()  # Returns True/False based on expiry + is_active
```

---

### 2. `volunteer_applications` - Interest Form
Captures the volunteer application workflow: volunteer fills form → admin approves.

**Workflow:**
1. Volunteer submits application (status: PENDING)
2. Admin reviews and approves/rejects
3. On approval, create corresponding User record

**Fields:**
- `name`, `email`, `motivation_text`
- `status`: PENDING → APPROVED/REJECTED
- `reviewed_by`: Admin who processed the application

---

### 3. `locations` - Shelves, Floor, Storage, Events
Generic "place where an item/box can live".

**Location Types:**
- `FLOOR`: Items on public display
- `STORAGE`: Items in storage
- `EVENT`: Items at events/exhibitions
- `OTHER`: Miscellaneous locations

**Query Examples:**
```python
# Get all items on the floor
floor_locations = Location.objects.filter(location_type='FLOOR')
items_on_floor = CollectionItem.objects.filter(current_location__in=floor_locations)

# Or use the cached field
items_on_floor = CollectionItem.objects.filter(is_on_floor=True)
```

---

### 4. `boxes` - Physical Boxes
Physical boxes that hold items. Each box has a scannable code.

**Features:**
- `box_code`: Unique scannable identifier
- `label`: Human-friendly name
- `location`: Where the box currently is

---

### 5. `collection_items` - Main Collection Table
Each game/object in the collection.

**Key Fields:**
- `item_code`: Unique barcode/scannable code
- `title`, `platform`, `description`
- `box`: Optional - which box contains this item
- `current_location`: Cached current location (derived from history)
- `is_on_floor`: Cached boolean for fast queries
- `is_public_visible`: Whether to show in public catalogue

**Performance Optimization:**
The `current_location` and `is_on_floor` fields are cached for performance but are derived from the `item_history` table.

**Update Location:**
```python
item.update_location_from_history()  # Recalculates from history
```

---

### 6. `item_movement_requests` - Workflow Table
Represents a single request from a volunteer to move an item.

**Workflow:**
1. Volunteer creates request (status: WAITING_APPROVAL)
2. Admin reviews and approves/rejects
3. On approval/rejection, history event is created

**Methods:**
```python
# Approve a request
request.approve(admin_user, comment="Approved for exhibition")

# Reject a request
request.reject(admin_user, comment="Item needed in storage")
```

---

### 7. `item_history` - The History Table ⭐
**This is the key to solving the "state machine is not enough" problem.**

**Philosophy:**
- Never overwrite location data
- Always append events
- Current location is derived from the last valid event

**Event Types:**
- `INITIAL`: Item first added to system
- `MOVE_REQUESTED`: Volunteer requested a move
- `MOVE_APPROVED`: Admin approved the move
- `MOVE_REJECTED`: Admin rejected the move
- `IN_TRANSIT`: Item is being moved
- `ARRIVED`: Item arrived at destination
- `VERIFIED`: Location verified by staff
- `LOCATION_CORRECTION`: Manual correction

**Location-Changing Events:**
Only these events actually change the physical location:
- `INITIAL`
- `ARRIVED`
- `VERIFIED`
- `LOCATION_CORRECTION`

**Example History Flow:**
```
1. INITIAL          from: NULL      to: Shelf 1      (Item added to system)
2. MOVE_REQUESTED   from: Shelf 1   to: Floor A      (Volunteer wants to display it)
3. MOVE_APPROVED    from: Shelf 1   to: Floor A      (Admin approves)
4. IN_TRANSIT       from: Shelf 1   to: Floor A      (Being moved)
5. ARRIVED          from: Shelf 1   to: Floor A      (Now on Floor A)
6. VERIFIED         from: Floor A   to: Floor A      (Location confirmed)
```

**Current Location:**
The item's current location is Floor A because the last location-changing event (ARRIVED) set it there.

---

## Utility Functions

### `get_current_location(item_id)`
Returns the current location based on history.

### `get_item_location_history(item_id)`
Returns complete movement history for an item.

### `is_item_in_transit(item_id)`
Checks if an item is currently being moved.

### `get_pending_movements_for_item(item_id)`
Gets all pending movement requests for an item.

---

## Database Indexes

Performance indexes are created on:
- `collection_items.item_code`
- `collection_items.is_on_floor`
- `collection_items.is_public_visible`
- `item_history.item + created_at`
- `item_history.event_type`
- `item_movement_requests.status + created_at`
- `item_movement_requests.item`

---

## Migration Steps

1. **Copy .env.example to .env:**
   ```bash
   cp backend/.env.example backend/.env
   ```

2. **Start PostgreSQL:**
   ```bash
   docker-compose up -d db
   ```

3. **Run migrations:**
   ```bash
   docker-compose run backend python manage.py makemigrations
   docker-compose run backend python manage.py migrate
   ```

4. **Create superuser:**
   ```bash
   docker-compose run backend python manage.py createsuperuser
   ```
   - Email: your-email@example.com
   - Name: Your Name
   - Password: (your password)

5. **Start all services:**
   ```bash
   docker-compose up
   ```

---

## Common Queries

### Get all items on the floor
```python
CollectionItem.objects.filter(is_on_floor=True)
```

### Get all pending movement requests
```python
ItemMovementRequest.objects.filter(status='WAITING_APPROVAL')
```

### Get complete history for an item
```python
from inventory.utils import get_item_location_history
history = get_item_location_history(item_id)
```

### Check volunteer access
```python
if user.has_active_access():
    # Allow access
else:
    # Deny access
```

---

## Notes

- **Foreign Key Protection:** Most foreign keys use `PROTECT` to prevent accidental deletion
- **Soft Deletes:** Consider adding `is_deleted` flags if you need soft deletes
- **Audit Trail:** The `item_history` table provides a complete audit trail
- **Performance:** Cached fields (`current_location`, `is_on_floor`) improve query performance
