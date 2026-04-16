# Backend Architecture & Data Linking Analysis

## Overview
The backend uses a **UUID-based admin scoping model** where each admin has their own isolated namespace for members, plans, products, and staff. This document details how data is linked and accessed.

---

## 1. HOW MEMBERS ARE LINKED TO ADMINS

### Core Linking Mechanism
```
Admin → Creates Member
        ↓
Member.created_by = Admin.UUID
        ↓
Member filtered via: WHERE created_by = admin_uuid
```

### Database Schema (Members Table)
```sql
CREATE TABLE members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id CHAR(36) UNIQUE NOT NULL,        -- UUID identifier
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100),
  gender VARCHAR(20),
  height DECIMAL(5,2),
  weight DECIMAL(5,2),
  bmi DECIMAL(5,2),
  plan VARCHAR(100),
  duration INT,
  join_date DATE DEFAULT CURDATE(),
  expiry_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  photo TEXT,
  notes TEXT,
  address TEXT,
  created_by CHAR(36) NULL,                  -- Admin UUID who created
  updated_by CHAR(36) NULL,                  -- Last admin who updated
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes for performance
  INDEX idx_created_by (created_by),
  -- Unique constraint per admin
  UNIQUE KEY (phone, created_by),
  UNIQUE KEY (email, created_by)
);
```

### Member-Admin Linking in Code

**In MemberController.js:**
```javascript
// Extract admin UUID from JWT token
const adminUuid = req.user?.adminUuid 
                || req.user?.userUuid 
                || req.user?.admin_uuid 
                || req.user?.user_uuid 
                || null;

// Create member with admin linkage
const [result] = await connection.query(
  `INSERT INTO members
  (member_id, name, phone, email, ..., created_by, updated_by)
  VALUES (?,?,?,?,...,?,?)`,
  [memberId, name, phone, email, ..., adminUuid, adminUuid]
);

// Get members - filtered by admin
const [rows] = await db.query(`
  SELECT gm.* FROM members gm
  WHERE gm.created_by = ?
`, [adminUuid]);
```

### Duplicate Check Within Admin Scope
```javascript
// Check if phone exists for THIS admin
const [existingPhone] = await connection.query(
  `SELECT * FROM members 
   WHERE phone = ? 
   AND created_by = ?`,
  [phone, currentUserUuid]
);
```

**This means:**
- Admin A can have member with phone "9999999999"
- Admin B can also have member with same phone "9999999999"
- Within Admin A's namespace, phone is unique
- Within Admin B's namespace, phone is unique

---

## 2. MEMBER MODEL/SCHEMA

### Full Member Fields
```javascript
{
  id: 123,                          // DB auto-increment primary key
  member_id: "550e8400-e29b-...",   // UUID (unique identifier)
  name: "John Doe",                 // Required
  phone: "9876543210",              // Required, unique per admin
  email: "john@example.com",        // Unique per admin
  gender: "M",
  height: 5.8,                      // decimal
  weight: 75.5,                     // decimal
  bmi: 22.4,                        // decimal
  plan: "Premium",                  // Plan name or ID
  duration: 12,                     // months
  join_date: "2024-01-15",
  expiry_date: "2024-12-15",
  status: "active",                 // or "inactive"
  photo: "base64_string_or_url",
  notes: "Any notes about member",
  address: "123 Main St, City",
  
  // Audit Trail
  created_by: "admin-uuid-here",    // CHAR(36) - Admin who created
  updated_by: "admin-uuid-here",    // CHAR(36) - Last admin who updated
  created_at: "2024-01-15T10:30:00Z",
  updated_at: "2024-03-20T14:45:00Z",
  
  // Related counts (aggregated in queries)
  workout_count: 5,
  diet_count: 3,
  user_id: 456,                     // Link to users table if exists
  u_id: "user-uuid-if-exists"
}
```

### API Response Format (getAllMembers)
```javascript
[
  {
    id: 1,
    member_id: "uuid-1",
    name: "Member 1",
    phone: "9999999991",
    email: "member1@gym.com",
    // ... other fields
    workout_count: 3,
    diet_count: 2,
    source: "members",
    user_id: 10,
    u_id: "user-uuid"
  },
  // ... more members
]
```

---

## 3. HOW PLANS, TRAINERS, PRODUCTS ARE CREATED

### Plans (Gym Plans Table)

**Schema:**
```sql
CREATE TABLE gym_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plan_id VARCHAR(10) UNIQUE NOT NULL,     -- Readable ID: PL001, PL002
  name VARCHAR(100) NOT NULL,
  description TEXT,
  duration VARCHAR(50),                    -- "3 months", "1 year", etc.
  price DECIMAL(10,2) NOT NULL,
  discount DECIMAL(5,2) DEFAULT 0,
  final_price DECIMAL(10,2),
  facilities JSON DEFAULT '[]',             -- Array of facility IDs/names
  trainer_included TINYINT(1) DEFAULT 0,   -- 1 = yes, 0 = no
  diet_plans JSON DEFAULT '[]',             -- Array of diet plans
  active TINYINT(1) DEFAULT 1,
  created_by CHAR(36) NULL,                -- Admin creator UUID
  updated_by CHAR(36) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Creation Code:**
```javascript
// Generate readable plan_id
const [countResult] = await db.query("SELECT COUNT(*) as count FROM gym_plans");
const nextNumber = Number(countResult[0].count) + 1;
const planId = `PL${String(nextNumber).padStart(3, "0")}`;  // PL001, PL002...

// Insert plan with admin linkage
const [result] = await db.query(
  `INSERT INTO gym_plans
  (plan_id, name, description, duration, price, discount, final_price,
   facilities, trainer_included, diet_plans, active, created_by, updated_by, created_at, updated_at)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  [
    planId, name, description, duration, Number(price), Number(discount),
    Number(finalPrice), JSON.stringify(facilities || []), trainerIncluded ? 1 : 0,
    JSON.stringify(dietPlans || []), active !== false ? 1 : 0,
    createdBy,              // Admin UUID
    createdBy,              // Admin UUID
    new Date(),
    new Date()
  ]
);
```

**Filtering Plans by Admin:**
```javascript
let query = 'SELECT * FROM gym_plans';
let params = [];

if (!isSuperAdmin && req.user) {
  const adminUuid = getAdminUuid(req.user);
  if (adminUuid) {
    // Include plans created by this admin OR plans with no creator (legacy)
    query += ' WHERE (created_by = ? OR created_by IS NULL)';
    params = [adminUuid];
  }
}
```

### Products

**Schema:**
```sql
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100) NOT NULL,
  description TEXT,
  ratings INT DEFAULT 0,
  weight JSON DEFAULT '[]',         -- Array of weight options
  size JSON DEFAULT '[]',           -- Array of sizes
  gender JSON DEFAULT '[]',         -- Array: [M, F, U]
  mrp DECIMAL(10,2) DEFAULT 0,     -- Maximum Retail Price
  offer INT DEFAULT 0,              -- Discount percentage
  offer_price DECIMAL(10,2) DEFAULT 0,
  stock JSON DEFAULT '{}',          -- {"M": 10, "L": 5} etc
  images JSON DEFAULT '[]',         -- Array of image URLs
  created_by CHAR(36) NULL,        -- Admin creator UUID
  updated_by CHAR(36) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Creation Code:**
```javascript
const createdBy = getActorUuid(req.user);  // Admin UUID

const [result] = await db.query(
  `INSERT INTO products
  (name, category, subcategory, description, ratings, weight, size, gender,
   mrp, offer, offer_price, stock, images, created_by, updated_by)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  [
    name,
    category,
    subcategory,
    description,
    ratings,
    JSON.stringify(weight || []),
    JSON.stringify(size || []),
    JSON.stringify(gender || []),
    mrp,
    offer,
    offerPrice,
    JSON.stringify(stock || {}),
    JSON.stringify(images || []),
    createdBy,              // Admin UUID
    createdBy,              // Admin UUID
  ]
);
```

### Staff (Trainers/Employees)

**Schema:**
```sql
CREATE TABLE staff (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id VARCHAR(36) UNIQUE,          -- UUID
  username VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50),
  role VARCHAR(100),                       -- trainer, manager, etc.
  department VARCHAR(100),
  gender VARCHAR(50),
  blood_group VARCHAR(10),
  dob DATE,
  joining_date DATE,
  qualification TEXT,
  experience TEXT,
  shift VARCHAR(100),
  salary DECIMAL(12,2),
  address TEXT,
  emergency_name VARCHAR(255),
  emergency_phone VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active',
  time_in VARCHAR(10),
  time_out VARCHAR(10),
  photo TEXT,
  aadhar_doc TEXT,                        -- Base64 encoded
  id_doc TEXT,
  certificate_doc TEXT,
  admin_uuid CHAR(36) NULL,                -- Admin who manages this staff
  created_by CHAR(36) NULL,                -- Admin creator UUID
  updated_by CHAR(36) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_admin_uuid (admin_uuid),
  INDEX idx_created_by (created_by)
);
```

**Creation Code:**
```javascript
const adminUuid = req.user?.adminUuid || req.user?.admin_uuid || null;
const createdBy = adminUuid;

let employeeId = body.employee_id || randomUUID();

const [result] = await db.query(
  `INSERT INTO staff
  (employee_id, username, name, email, phone, role, department,
   gender, blood_group, dob, joining_date, qualification, experience,
   shift, salary, address, emergency_name, emergency_phone, status,
   time_in, time_out, photo, aadhar_doc, id_doc, certificate_doc,
   admin_uuid, created_by, updated_by, created_at, updated_at)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  [
    employeeId, username, name, email, phone, role, department,
    gender, blood_group, dob, joining_date, qualification, experience,
    shift, salary, address, emergency_name, emergency_phone, status,
    time_in, time_out, photo, aadhar_doc, id_doc, certificate_doc,
    adminUuid,    // Both admin_uuid and created_by set to admin
    createdBy,
    createdBy,
    new Date(),
    new Date()
  ]
);
```

**Authorization Check for Update:**
```javascript
// Check if staff exists first
const [existingRows] = await db.query(
  'SELECT * FROM staff WHERE employee_id = ?',
  [id]
);

// Only allow if admin matches
if (req.user?.role === 'admin') {
  const adminUuid = req.user?.adminUuid || req.user?.admin_uuid || null;
  if (adminUuid && existingRows[0].admin_uuid !== adminUuid) {
    return res.status(403).json({
      error: 'Not authorized to update this staff member'
    });
  }
}
```

---

## 4. API ENDPOINTS

### Members (`/api/members`)
```
GET    /api/members
       Auth: Required (admin only)
       Filter: created_by = admin_uuid
       Returns: Array of members

GET    /api/members/:id
       Auth: Optional
       Params: id (numeric ID or member_id UUID)
       Returns: Single member object

POST   /api/members
       Auth: Required (admin only)
       Body: {name, phone, email, gender, height, weight, bmi, plan, duration, status, ...}
       Creates: member with auto-assigned member_id (UUID) and created_by
       Returns: Created member object

PUT    /api/members/:id
       Auth: Required (admin only)
       Updates: Member properties
       Returns: Updated member object

DELETE /api/members/:id
       Auth: Required (admin only)
       Deletes: Member record

GET    /api/members/:id/plans
       Auth: Optional
       Returns: Plans associated with member
```

### Plans (`/api/plans`)
```
GET    /api/plans
       Auth: Required (admin only)
       Filter: created_by = admin_uuid OR created_by IS NULL
       Returns: Array of plans

GET    /api/plans/:id
       Auth: Optional
       Returns: Single plan (public access)

POST   /api/plans
       Auth: Required (admin only)
       Body: {name, description, duration, price, discount, finalPrice,
              facilities[], trainerIncluded, dietPlans[], active}
       Creates: Plan with auto-generated plan_id (PL001...) and created_by
       Returns: Created plan object

PUT    /api/plans/:id
       Auth: Required (admin only)
       Updates: Plan properties

DELETE /api/plans/:id
       Auth: Required (admin only)
       Deletes: Plan record
```

### Staff (`/api/staff`)
```
GET    /api/staff/generate-employee-id
       Auth: Optional
       Returns: {employeeId: "UUID"}

GET    /api/staff
       Auth: Optional (filters if admin)
       Filter: admin_uuid = admin_uuid if not super admin
       Returns: Array of staff

GET    /api/staff/:id
       Auth: Optional
       Params: id (numeric ID or employee_id UUID)
       Returns: Single staff object

POST   /api/staff
       Auth: Required (admin only)
       Body: All staff fields (see schema)
       Creates: Staff with auto-generated employee_id if not provided,
                admin_uuid set to requester's UUID
       Returns: Created staff object

PUT    /api/staff/:id
       Auth: Required (admin only)
       Authorization: Staff's admin_uuid must match requester's
       Returns: Updated staff object

DELETE /api/staff/:id
       Auth: Required (admin only)
       Authorization: Staff's admin_uuid must match requester's
```

### Products (`/api/products`)
```
GET    /api/products
       Auth: Optional (filters if admin)
       Filter: created_by = admin_uuid if not super admin
       Returns: Array of products

GET    /api/products/:id
       Auth: Optional (filters if admin)
       Authorization: Product creator must match or be super admin
       Returns: Single product object

POST   /api/products
       Auth: Required (admin only)
       Body: {name, category, subcategory, description, ratings,
              weight[], size[], gender[], mrp, offer, offerPrice,
              stock{}, images[]}
       Creates: Product with created_by = admin_uuid
       Returns: Created product object

PUT    /api/products/:id
       Auth: Required (admin only)
       Authorization: Product creator must match or be super admin
       Returns: Updated product object

DELETE /api/products/:id
       Auth: Required (admin only)
       Authorization: Product creator must match or be super admin
       Returns: {success: true}
```

---

## 5. AUTHENTICATION CONTEXT

### JWT Token Structure (buildAuthPayload)
```javascript
{
  userId: 123,                              // Numeric DB ID
  user_id: 123,                             // Alternative
  userUuid: "550e8400-e29b-41d3-a4d8-...", // User's UUID from DB
  role: "admin" | "member" | "trainer" | "super admin",
  email: "admin@gym.com",
  username: "admin_user",
  mobile: "9876543210",
  phone: "9876543210",
  adminId: null,                            // Legacy
  adminUuid: "550e8400-e29b-...",          // CURRENT ADMIN'S UUID
  subscriptionStatus: "active"
}
```

### How Filtering Works
```javascript
// In controller
const adminUuid = req.user?.adminUuid      // Try camelCase first
                || req.user?.userUuid
                || req.user?.admin_uuid    // Fall back to snake_case
                || req.user?.user_uuid
                || null;

// Check if super admin (no filter)
const isSuperAdmin = String(req.user.role || '').toLowerCase() === 'super admin';

if (isSuperAdmin) {
  // Show all data
  const [rows] = await db.query('SELECT * FROM gym_plans');
} else {
  // Filter by admin UUID
  const [rows] = await db.query(
    'SELECT * FROM gym_plans WHERE created_by = ?',
    [adminUuid]
  );
}
```

### Middleware Chain
```javascript
router.post(
  '/',
  authenticateToken,        // Verify JWT, throw 401 if missing
  requireAdmin,              // Check if role is 'admin' or 'super admin'
  createMember              // Handler receives req.user with admin UUID
);
```

---

## 6. DATA LINKING SUMMARY

### Member-Admin Relationship Diagram
```
┌─────────────────┐
│    Admin User   │
│ (UUID: admin-1) │
└────────┬────────┘
         │
         │ Creates Member
         │ (stores admin-1 in created_by)
         ▼
┌─────────────────────────────────┐
│   Member (id: 1)                │
│ • member_id: UUID-member-1      │
│ • created_by: admin-1 (UUID)    │
│ • updated_by: admin-1 (UUID)    │
│ • plan: "Premium"               │
│ • status: "active"              │
└─────────────────────────────────┘
         │
         ├─ Can only be managed by admin-1
         │
         ├─ Query filter: WHERE created_by = 'admin-1'
         │
         └─ Audit trail tracks admin's changes
```

### Multi-Admin Isolation
```
Admin A (UUID: admin-a)                Admin B (UUID: admin-b)
      │                                       │
      ├─ Member: John (9999999999)    ├─ Member: John (9999999999)
      ├─ Member: Jane (8888888888)    ├─ Member: Sarah (7777777777)
      ├─ Plan: Premium                ├─ Plan: Basic
      └─ Product: Protein Shake       └─ Product: Yoga Mat
      
      (Same phone number allowed)     (Same phone number allowed)
      (Different namespaces)           (Different namespaces)
```

### Creation Flow
```
1. Admin sends POST /api/members with {name, phone, email, ...}
   ↓
2. Backend extracts adminUuid from JWT token (req.user.adminUuid)
   ↓
3. Generates member_id = randomUUID()
   ↓
4. Inserts into DB with created_by = adminUuid, updated_by = adminUuid
   ↓
5. Returns created member with all fields including UUIDs
   ↓
6. Future queries for this member:
   SELECT * FROM members WHERE created_by = 'adminUuid'
```

---

## 7. KEY FEATURES

### Unique Constraints Per Admin
```sql
UNIQUE KEY (phone, created_by)    -- phone unique within admin's scope
UNIQUE KEY (email, created_by)    -- email unique within admin's scope
```

### Audit Trail
Every data modification tracked:
```javascript
created_by: "admin-uuid-who-created"
updated_by: "admin-uuid-who-last-updated"
created_at: "timestamp"
updated_at: "timestamp"
```

### Soft Scoping (No Foreign Keys)
- No hard FK to force admin-member relationship
- Filtering done in application layer
- Allows flexibility and easier data migration
- Requires explicit authorization checks

### JSON Storage
- `facilities`: Array of facility IDs
- `diet_plans`: Array of diet plan configs
- `weight`, `size`, `gender`: Arrays of options
- `stock`: Object with variant quantities
- `images`: Array of URLs

---

## 8. AUTHENTICATION FLOW

```
1. User logs in with email/phone/username
   ↓
2. Backend finds user in DB (users table for admins, members table for members)
   ↓
3. Verifies password with bcrypt
   ↓
4. Creates JWT with buildAuthPayload():
   - userUuid = user's UUID from DB
   - adminUuid = user's UUID (for admin users)
   - role = user's role
   ↓
5. Returns token to client
   ↓
6. Client sends token in Authorization header for all requests
   ↓
7. Backend middleware extracts and verifies token
   ↓
8. Stores decoded token in req.user for handlers to use
   ↓
9. Handlers extract req.user.adminUuid for scoping queries
```

---

## Summary: Admin-Member Linking

| Aspect | Value |
|--------|-------|
| **Primary Link** | `member.created_by = admin.uuid` |
| **Member ID** | UUID (unique across all admins) |
| **Admin ID** | UUID (from JWT token) |
| **Filtering** | `WHERE created_by = ?` with admin UUID |
| **Scope** | Phone/email unique per admin, not globally |
| **Audit Trail** | `created_by`, `updated_by` track changes |
| **Multi-Admin** | Admins see only their own data (super admin sees all) |
| **Relationship Type** | Soft scoping (no FK constraint, app-layer filtering) |

