# Week 1 – Core Development Issues

---

### **Issue 1 – [Backend] Implement Authentication and Authorization**
**Goal:**  
Set up secure authentication for admins and volunteers.

**Tasks:**  
- Implement JWT or session-based auth for login and logout  
- Create `POST /api/auth/login` and `POST /api/auth/logout` endpoints  
- Store hashed passwords and issue access tokens  
- Add middleware to validate tokens and enforce role-based access (`ADMIN`, `VOLUNTEER`)  
- Optional: refresh-token mechanism for longer sessions  

**Acceptance Criteria:**  
- Users can log in and receive a valid token  
- Protected routes reject unauthorized access  
- Admins can reach admin endpoints; volunteers cannot  

---

### **Issue 2 – [Backend] Volunteer Application API**
**Goal:**  
Allow volunteers to submit interest forms and admins to review, approve, or reject them.

**Tasks:**  
- `POST /api/volunteer-applications` – submit new application (`PENDING`)  
- `GET /api/volunteer-applications` – list all (admin only)  
- `PATCH /api/volunteer-applications/:id` – approve or reject, set `reviewed_by`, `reviewed_at`  
- On approval, auto-create `User` with role `VOLUNTEER` and temporary password or invite flow  

**Acceptance Criteria:**  
- Volunteers can submit forms without authentication  
- Admins can view and update application status  
- Approved applications create user accounts  

---

### **Issue 3 – [Backend] User Management & Access Expiry**
**Goal:**  
Enable admins to manage volunteer accounts and handle expirations.

**Tasks:**  
- `GET /api/users` – list and filter by role and activity  
- `PATCH /api/users/:id` – update `is_active` and `access_expires_at`  
- Add middleware to block expired users  
- Optional scheduled job to deactivate expired users  

**Acceptance Criteria:**  
- Admins can edit and deactivate volunteers  
- Expired users automatically lose access  

---

### **Issue 4 – [Backend] Public Catalogue API**
**Goal:**  
Expose read-only collection data to the public.

**Tasks:**  
- `GET /api/public/items` – search and filter (platform, on-floor, text)  
- `GET /api/public/items/:id` – show item details  
- Exclude items where `is_public_visible = false`  

**Acceptance Criteria:**  
- Public can view items and filter/search correctly  
- Hidden items never appear  
- Pagination and search work smoothly  

---

### **Issue 5 – [Frontend] Authentication & Login UI**
**Goal:**  
Build frontend login for admins and volunteers.

**Tasks:**  
- Login page with email/password fields  
- `POST /api/auth/login` → store JWT or session token  
- Redirect based on role (ADMIN → dashboard, VOLUNTEER → home)  
- Logout clears token and redirects to login  

**Acceptance Criteria:**  
- Valid login grants access to protected pages  
- Invalid credentials show an error  
- Session persists safely and clears on logout  

---

### **Issue 6 – [Backend] Define Item History & Location Rules**
**Goal:**  
Formalize how `ItemHistory` determines an item’s current location.

**Tasks:**  
- Identify events that update true location (`INITIAL`, `ARRIVED`, `VERIFIED`, `CORRECTION`)  
- Identify workflow-only events (`MOVE_REQUESTED`, `MOVE_APPROVED`, `MOVE_REJECTED`)  
- Write algorithm for `get_current_location(item_id)`  
- Document the rules with example transitions  

**Acceptance Criteria:**  
- Logic clearly documented and approved by team  
- Example flows yield expected results  

---

### **Issue 7 – [Backend] Implement Item History Service**
**Goal:**  
Implement logic to keep `CollectionItem.current_location` and `is_on_floor` synced with history.

**Tasks:**  
- Implement `compute_current_location(item_id)` helper  
- Update current location when relevant events occur  
- Add maintenance command to rebuild all locations  

**Acceptance Criteria:**  
- Location updates correctly on history change  
- Rebuild command yields consistent results  

---

### **Issue 8 – [Backend] Move Request & Approval API**
**Goal:**  
Allow volunteers to request moves and admins to approve or reject.

**Tasks:**  
- `POST /api/items/:id/move-requests` – volunteer creates request  
- `GET /api/move-requests` – admin lists pending requests  
- `PATCH /api/move-requests/:id` – admin approves/rejects  
- Generate corresponding `ItemHistory` events  

**Acceptance Criteria:**  
- Volunteers can request moves when authorized  
- Admin approvals/rejections reflected in both tables  
- History entries match the current status  

---

### **Issue 9 – [Frontend] Public Catalogue UI**
**Goal:**  
Create a simple, public-facing UI for browsing the collection.

**Tasks:**  
- Catalogue page fetching from `/api/public/items`  
- Search bar and filter controls  
- Item detail page showing metadata (title, platform, status)  

**Acceptance Criteria:**  
- Public users can browse without login  
- Filters and search behave correctly  
- Item detail pages render accurate data  

---

### **Issue 10 – [Frontend] Admin Dashboard Shell + Volunteer Application Review UI**
**Goal:**  
Build base admin dashboard and connect volunteer-application review.

**Tasks:**  
- Protected Admin layout with navigation  
- Volunteer Applications page fetching from `/api/volunteer-applications`  
- Approve/Reject buttons triggering API calls and updating UI  
- Display success/error toasts  

**Acceptance Criteria:**  
- Admin can log in and review applications  
- UI updates dynamically after each action  
- Non-admins blocked from dashboard  

---

✅ **Deliverable by end of Week 1:**  
Fully authenticated backend + public catalogue + admin login and volunteer approval flow.  
System supports user roles, application lifecycle, and item movement groundwork.
