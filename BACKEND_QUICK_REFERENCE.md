# Backend Quick Reference Guide

## API Endpoints Summary

### Members Management

| Endpoint | Method | Auth | Admin Only | Filtering | Returns |
|----------|--------|------|-----------|-----------|---------|
| `/api/members` | GET | ✅ | ✅ | `created_by = admin_uuid` | Array of members |
| `/api/members/:id` | GET | ❌ | ❌ | None | Single member |
| `/api/members` | POST | ✅ | ✅ | Auto-set: `created_by = admin_uuid` | Created member |
| `/api/members/:id` | PUT | ✅ | ✅ | Check ownership | Updated member |
| `/api/members/:id` | DELETE | ✅ | ✅ | Check ownership | Success message |
| `/api/members/:id/plans` | GET | ❌ | ❌ | Member's plans | Array of plans |

### Plans Management

| Endpoint | Method | Auth | Admin Only | Filtering | Returns |
|----------|--------|------|-----------|-----------|---------|
| `/api/plans` | GET | ✅ | ✅ | `created_by = admin_uuid OR created_by IS NULL` | Array of plans |
| `/api/plans/:id` | GET | ❌ | ❌ | None | Single plan |
| `/api/plans` | POST | ✅ | ✅ | Auto-set: `created_by = admin_uuid` | Created plan |
| `/api/plans/:id` | PUT | ✅ | ✅ | Check ownership | Updated plan |
| `/api/plans/:id` | DELETE | ✅ | ✅ | Check ownership | Success message |

### Staff Management

| Endpoint | Method | Auth | Admin Only | Filtering | Returns |
|----------|--------|------|-----------|-----------|---------|
| `/api/staff/generate-employee-id` | GET | ❌ | ❌ | None | `{employeeId: "UUID"}` |
| `/api/staff` | GET | ❌ | ❌ | `admin_uuid = admin_uuid` if admin | Array of staff |
| `/api/staff/:id` | GET | ❌ | ❌ | `admin_uuid = admin_uuid` if admin | Single staff |
| `/api/staff` | POST | ✅ | ✅ | Auto-set: `admin_uuid, created_by = admin_uuid` | Created staff |
| `/api/staff/:id` | PUT | ✅ | ✅ | `admin_uuid` must match | Updated staff |
| `/api/staff/:id` | DELETE | ✅ | ✅ | `admin_uuid` must match | Success message |

### Products Management

| Endpoint | Method | Auth | Admin Only | Filtering | Returns |
|----------|--------|------|-----------|-----------|---------|
| `/api/products` | GET | ❌ | ❌ | `created_by = admin_uuid` if admin | Array of products |
| `/api/products/:id` | GET | ❌ | ❌ | Check ownership if admin | Single product |
| `/api/products` | POST | ✅ | ✅ | Auto-set: `created_by = admin_uuid` | Created product |
| `/api/products/:id` | PUT | ✅ | ✅ | Check ownership | Updated product |
| `/api/products/:id` | DELETE | ✅ | ✅ | Check ownership | `{success: true}` |

---

## Database Tables Quick Reference

### Members (gym_members → members)
```
Key Fields:
  member_id: CHAR(36)          -- UUID, unique identifier
  phone: VARCHAR(20)            -- Unique per admin
  email: VARCHAR(100)           -- Unique per admin
  created_by: CHAR(36)          -- Admin who created
  updated_by: CHAR(36)          -- Last admin who updated
  
Primary Key: id (INT)
Unique Keys: member_id, (phone, created_by), (email, created_by)
```

### Plans (gym_plans)
```
Key Fields:
  plan_id: VARCHAR(10)          -- Readable ID (PL001...)
  name: VARCHAR(100)
  price: DECIMAL(10,2)
  facilities: JSON              -- Array
  trainer_included: TINYINT(1)
  diet_plans: JSON              -- Array
  created_by: CHAR(36)          -- Admin who created
  updated_by: CHAR(36)          -- Last admin who updated
  
Primary Key: id (INT)
Unique Keys: plan_id
```

### Staff
```
Key Fields:
  employee_id: VARCHAR(36)      -- UUID, unique identifier
  name: VARCHAR(255)
  email: VARCHAR(255)           -- Unique
  role: VARCHAR(100)            -- trainer, manager, etc.
  admin_uuid: CHAR(36)          -- Admin who manages
  created_by: CHAR(36)          -- Admin who created
  updated_by: CHAR(36)          -- Last admin who updated
  
Primary Key: id (INT)
Unique Keys: employee_id, email
```

### Products
```
Key Fields:
  name: TEXT
  category: VARCHAR(100)
  subcategory: VARCHAR(100)
  price: DECIMAL(10,2)          -- mrp
  offer: INT                    -- Discount %
  offer_price: DECIMAL(10,2)
  stock: JSON                   -- Quantity by variant
  images: JSON                  -- Array of URLs
  created_by: CHAR(36)          -- Admin who created
  updated_by: CHAR(36)          -- Last admin who updated
  
Primary Key: id (INT)
```

---

## Authentication Context (JWT Payload)

```javascript
{
  userId: 123,                              // Numeric DB ID
  user_id: 123,
  userUuid: "550e8400-e29b-41d3-a4d8-...", // User's UUID
  role: "admin" | "member" | "trainer" | "super admin",
  email: "user@gym.com",
  username: "username",
  mobile: "9876543210",
  phone: "9876543210",
  adminUuid: "550e8400-e29b-...",          // ADMIN'S UUID (key field!)
  subscriptionStatus: "active"
}
```

### How to Extract Admin UUID in Code
```javascript
const adminUuid = req.user?.adminUuid 
                || req.user?.userUuid 
                || req.user?.admin_uuid 
                || req.user?.user_uuid 
                || null;
```

---

## Authorization Patterns

### Admin-Only Endpoint Pattern
```javascript
router.post('/api/members', authenticateToken, requireAdmin, createMember);
```

### Query Filtering for Regular Admin
```javascript
if (!isSuperAdmin && adminUuid) {
  query += ' WHERE created_by = ?';
  params.push(adminUuid);
}
```

### Ownership Check
```javascript
const existing = await db.query('SELECT * FROM products WHERE id = ?', [id]);
if (existing[0].created_by !== adminUuid && userRole !== 'super admin') {
  return res.status(403).json({error: 'Not authorized'});
}
```

---

## Data Creation Flow

### Step 1: Extract Admin UUID from JWT
```javascript
const adminUuid = req.user?.adminUuid || req.user?.userUuid || null;
```

### Step 2: Generate Unique ID
```javascript
// For members
const memberId = randomUUID();

// For plans (readable)
const [count] = await db.query("SELECT COUNT(*) as count FROM gym_plans");
const planId = `PL${String(count[0].count + 1).padStart(3, '0')}`;

// For staff
const employeeId = randomUUID();
```

### Step 3: Insert with Admin Linkage
```javascript
await db.query(
  `INSERT INTO table_name
  (field1, field2, ..., created_by, updated_by, created_at, updated_at)
  VALUES (?,?,?,...,?,?,?,?)`,
  [value1, value2, ..., adminUuid, adminUuid, new Date(), new Date()]
);
```

### Step 4: Return Created Object
```javascript
const [rows] = await db.query('SELECT * FROM table_name WHERE id = ?', [result.insertId]);
res.status(201).json(rows[0]);
```

---

## Role Hierarchy

```
┌─────────────────┐
│  Super Admin    │  ← Sees ALL data
│  (role: "super  │     No filtering
│   admin")       │
└────────┬────────┘
         │
         │
┌────────▼────────────┐
│  Admin              │  ← Sees own data
│  (role: "admin")    │     Filtered by created_by
└─────────────────────┘
         │
         │
┌────────▼──────────────────┐
│  Member / Trainer / User  │  ← Sees personal data only
│  (role: "member"/"trainer")       Limited endpoints
└───────────────────────────┘
```

---

## Common Queries

### Get Admin's Members
```sql
SELECT * FROM members 
WHERE created_by = 'admin-uuid-here'
ORDER BY created_at DESC;
```

### Get Admin's Plans
```sql
SELECT * FROM gym_plans 
WHERE created_by = 'admin-uuid-here' OR created_by IS NULL
ORDER BY created_at DESC;
```

### Get Admin's Staff
```sql
SELECT * FROM staff 
WHERE admin_uuid = 'admin-uuid-here'
ORDER BY created_at DESC;
```

### Check Duplicate Phone Within Admin Scope
```sql
SELECT * FROM members 
WHERE phone = '9876543210' 
AND created_by = 'admin-uuid-here';
```

### Get Counts for Admin
```sql
SELECT 
  (SELECT COUNT(*) FROM members WHERE created_by = 'admin-uuid') as member_count,
  (SELECT COUNT(*) FROM gym_plans WHERE created_by = 'admin-uuid') as plan_count,
  (SELECT COUNT(*) FROM staff WHERE admin_uuid = 'admin-uuid') as staff_count,
  (SELECT COUNT(*) FROM products WHERE created_by = 'admin-uuid') as product_count;
```

---

## Audit Trail Fields

Every table has these fields for tracking:
```
created_by: CHAR(36)     -- UUID of admin who created
updated_by: CHAR(36)     -- UUID of admin who last updated
created_at: TIMESTAMP    -- When created
updated_at: TIMESTAMP    -- When last updated
```

These are automatically set when:
- **Creating**: Both set to requesting admin's UUID
- **Updating**: `updated_by` changed to requesting admin's UUID, `updated_at` set to current time

---

## Super Admin vs Regular Admin

| Feature | Admin | Super Admin |
|---------|-------|------------|
| See own data | ✅ | N/A |
| See all data | ❌ | ✅ |
| Create own members | ✅ | ✅ |
| Create members for others | ❌ | ✅ (by setting created_by) |
| Edit own data | ✅ | ✅ |
| Edit others' data | ❌ | ✅ |
| Delete own data | ✅ | ✅ |
| Delete others' data | ❌ | ✅ |
| Access billing | ✅ | ✅ |

---

## UUID vs Numeric ID Usage

### Where UUIDs are Used (CHAR(36))
- `member.created_by` - Admin who created
- `member.updated_by` - Admin who updated
- `plan.created_by` - Admin who created
- `product.created_by` - Admin who created
- `staff.admin_uuid` - Admin who manages
- `staff.employee_id` - Unique staff identifier
- `member.member_id` - Unique member identifier
- `user.user_uuid` - User's unique identifier

### Where Numeric IDs are Used (INT)
- Primary keys: `id`
- Foreign keys in most cases
- Counters

---

## Error Responses

### 401 - Unauthorized
```json
{
  "error": "Access token required"
}
```
Cause: Missing JWT token

### 403 - Forbidden
```json
{
  "error": "Admin access required"
}
```
Cause: Non-admin trying to access admin endpoint

```json
{
  "error": "Not authorized to update this staff member"
}
```
Cause: Admin trying to manage another admin's staff

### 400 - Bad Request
```json
{
  "message": "Phone already exists for this admin"
}
```
Cause: Duplicate phone within admin's scope

### 404 - Not Found
```json
{
  "error": "Member not found"
}
```
Cause: Requested record doesn't exist

### 500 - Server Error
```json
{
  "error": "Query failed",
  "details": "error message"
}
```
Cause: Database or server error

---

## Performance Indexes

These indexes are created for performance:
```sql
-- Members table
INDEX idx_created_by (created_by)
INDEX idx_gym_members_phone (phone)
INDEX idx_gym_members_member_id (member_id)

-- Plans table
INDEX idx_gym_plans_plan_id (plan_id)
INDEX idx_gym_plans_active (active)
INDEX idx_gym_plans_created_by (created_by)

-- Staff table
INDEX idx_staff_employee_id (employee_id)
INDEX idx_staff_role (role)
INDEX idx_staff_admin_uuid (admin_uuid)
INDEX idx_staff_created_by (created_by)
```

