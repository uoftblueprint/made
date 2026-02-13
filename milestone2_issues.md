## Group 5 – Inventory Management

### **Issue 11 – [Backend] Inventory CRUD API**
**Goal:**
Allow admins to create and manage the physical inventory records without direct SQL access.

**Tasks:**
- `POST /api/items` – Create a new item (Title, Platform, Barcode/UUID, Status). This should only be accessible to admin and volunteers.
- `PUT /api/items/:id` – Edit metadata (fix typos, change platform, update notes). This should only be accessible to admin and volunteers.
- `DELETE /api/items/:id` – Implement "Soft Delete" (archive item so history is preserved, but hide from active lists). This should only be accessible to admins.
- Ensure Barcode/UUID uniqueness validation.

**Acceptance Criteria:**
- New items created via API appear immediately in lists.
- Archived items are hidden from the Public Catalogue but remain in the database for historical tracking.
- Invalid data (e.g., missing title) is rejected.

---

### **Issue 12 – [Frontend] Inventory Management UI**
**Goal:**
The interface for Admins to add new games/items to the database.

**Tasks:**
- "Inventory Master List" table in Admin Dashboard (distinct from the Catalogue view).
- "Add Item" Modal/Page with form validation.
- "Edit Item" slide-over or modal.
- "Archive/Delete" confirmation dialog.
- Uses endpoints from Issue 11.

**Acceptance Criteria:**
- Admins can add a new game successfully.
- UI handles validation errors (e.g., "Barcode already exists") gracefully.
- Admins can edit details of existing items.

---

## Group 6 – Box & Container Architecture

### **Issue 13 – [Backend] Box Management API**
**Goal:**
Establish the "Box" concept to group items, supporting the requirement to "add to boxes."

**Tasks:**
- Create `Box` entity (ID, Label/Number, Description).
- Update `CollectionItem` table to add nullable `box_id` foreign key.
- `GET /api/boxes` – List all boxes.
- `GET /api/boxes/:id` – Return box details AND list of `items` currently inside.

**Acceptance Criteria:**
- System can accurately identify which items are inside a specific box.
- Moving an item to a box updates the `box_id` on the item.

---

### **Issue 14 – [Frontend] Box Management UI**
**Goal:**
Allow admins to manage boxes and view their contents without physically opening them.

**Tasks:**
- "Box Management" view in Admin Dashboard.
- Clicking a box reveals a list of items inside it.
- (Optional) Button to "Print Box Label" (Barcode/QR for the box ID).

**Acceptance Criteria:**
- Admin can create a new Box record.
- Admin can view a list of boxes and see the count of items inside each.

---

## Group 7 – Scanner Workflow & Verification

### **Issue 15 – [Frontend] Scanner Input / Quick Action UI**
**Goal:**
Implement the workflow where an admin or volunteer uses a physical barcode scanner to manage inventory.

**Tasks:**
- Create a "Quick Scan" mode in the Admin Dashboard.
- Auto-focus input field that accepts Barcode/UUID input.
- Logic: Detect if input is a Box ID or Item ID.
- **Workflow:** If Admin scans "Box A" then scans "Game X", trigger API to move Game X into Box A.

**Acceptance Criteria:**
- Scanning an item ID automatically locates that item or prepares it for action.
- Admins can bulk-scan items into a box without manually clicking "Edit" for every item.

---

### **Issue 16 – [Backend/Frontend] Move Verification Workflow**
**Goal:**
Enforce the `VERIFIED` state when items arrive at their destination.

**Tasks:**
- Update `PATCH /api/move-requests/:id` to accept a transition to `VERIFIED`.
- UI: "Incoming Items" dashboard widget.
- Action: Admin clicks "Verify" (or scans the item) when it physically arrives to finalize the move.

**Acceptance Criteria:**
- Items in `IN_TRANSIT` remain flagged until verified.
- The `ItemHistory` log reflects the exact time of verification.

---
## Group 8 – UI/UX Overhaul & Design System

### **Issue 17 – [Frontend] Global Theme & Design System Setup**
**Goal:**
Translate the Figma "Styles" (Colors, Typography, Spacing) into the codebase variables so developers can use them easily.

**Tasks:**
- Extract Color Palette (Primary, Secondary, Alerts, Grays) from Figma and set up as CSS Variables (or Tailwind config).
- Set up Typography hierarchy (H1, H2, Body, Caption) to match Figma.
- Define global spacing variables (margins, paddings).
- Reset/Normalize CSS to ensure browser consistency.

**Acceptance Criteria:**
- The "Hello World" page uses the correct font family and background color.
- Developers can use classes/variables like `text-primary` or `spacing-lg` instead of hardcoding hex values.

---

### **Issue 18 – [Frontend] Core Component Library**
**Goal:**
Build the reusable "LEGO blocks" of the UI so developers don't have to style every button from scratch.

**Tasks:**
- **Buttons:** Create Primary, Secondary, Destructive, and Ghost variants (with hover/active states).
- **Inputs:** Style Text Fields, Checkboxes, and Dropdowns (including error states).
- **Cards/Containers:** Standardize the white boxes/shadows used for holding content.
- **Alerts/Toasts:** Style the success/error notifications.

**Acceptance Criteria:**
- Components match Figma pixel-perfectly.
- Components are responsive (mobile vs. desktop).
- All future UI tasks must use these components.

---

### **Issue 19 – [Frontend] Public Layout & Catalogue Styling**
**Goal:**
Apply the Figma design to the Public-facing pages.

**Tasks:**
- **Navigation Bar:** Implement the public header/footer.
- **Catalogue Grid:** Style the game cards (cover art aspect ratio, badges for "On Floor").
- **Search/Filter:** Style the search bar and filter toggles.
- **Responsive Check:** Ensure the catalogue stacks correctly on mobile phones.

**Acceptance Criteria:**
- The Public Catalogue looks identical to the Figma mockups.
- Navigation works smoothly on mobile.

---

### **Issue 20 – [Frontend] Admin Dashboard Layout & Styling**
**Goal:**
Apply the Figma design to the Admin-facing backend.

**Tasks:**
- **Sidebar/Navigation:** Create the collapsible admin sidebar.
- **Data Tables:** Style the rows, headers, and pagination for lists (User List, Inventory List).
- **Page Headers:** Standardize how titles and action buttons (like "Add Item") appear at the top of pages.
- **Mobile View:** Ensure Admins can perform basic tasks (like Verification) on a phone screen.

**Acceptance Criteria:**
- Admin dashboard matches the Figma "App Shell" design.
- Data tables are readable and aligned correctly.