# Audit Fields Implementation - created_by & updated_by (Admin UUID Tracking)

## Overview
Added `created_by` and `updated_by` fields to store admin/user UUID across all important database tables. These fields track which admin/user created and last updated each record.

## Implementation Status

### ✅ Database Migrations Created

#### Migration 0047: `0047_add_audit_fields_to_remaining_tables.sql`
Adds `created_by` and `updated_by` (CHAR(36) for UUID) columns to:
- `orders`
- `reviews`
- `trainer_assignments`
- `attendance`
- `gym_facilities`
- `gym_equipment`
- `services`
- `user_addresses`
- `message_history`
- `gym_plans`

**Status**: ✅ Created and ready to apply

### ✅ Previously Implemented (Migrations 0041-0046)
The following tables already have audit fields from previous migrations:
- `users` ✅
- `members` (formerly gym_members) ✅
- `products` ✅
- `enquiries` ✅
- `workout_programs` ✅
- `diet_plans` ✅

## Controllers Updated with Audit Tracking

### New Utility Module
**File**: `backend/src/utils/auditTrail.js`
Provides reusable functions for audit trail management:
- `getActorUuid(user)` - Extract UUID from req.user
- `getActorUserId(user)` - Extract user ID from req.user
- `createAuditTrail(user)` - Get created_by and updated_by for INSERT
- `updateAuditTrail(user)` - Get updated_by for UPDATE

### Controllers Enhanced

#### 1. ✅ Order Controller
- **File**: `backend/src/controllers/orderController.js`
- **Changes**:
  - `createOrder()`: Added `created_by` and `updated_by` to INSERT
  - `updateOrderStatus()`: Added `updated_by` to UPDATE

#### 2. ✅ Attendance Controller
- **File**: `backend/src/controllers/attendanceController.js`
- **Changes**:
  - `markAttendance()`: Added `created_by` and `updated_by` to INSERT
  - `markAttendance()`: Added `updated_by` to UPDATE (for existing records)
  - `checkOut()`: Added `updated_by` to UPDATE

#### 3. ✅ Facility Controller
- **File**: `backend/src/controllers/facilityController.js`
- **Changes**:
  - `createFacility()`: Added `created_by` and `updated_by` to INSERT
  - `updateFacility()`: Added `updated_by` to both UPDATE queries (by id and slug)

#### 4. ✅ Equipment Controller
- **File**: `backend/src/controllers/equipmentController.js`
- **Changes**:
  - `createEquipment()`: Added `created_by` and `updated_by` to INSERT
  - `updateEquipment()`: Added `updated_by` to UPDATE

#### 5. ✅ Assignment Controller
- **File**: `backend/src/controllers/assignmentController.js`
- **Changes**:
  - `upsertAssignments()`: Added `created_by` and `updated_by` to INSERT
  - `upsertAssignments()`: Added `updated_by` to ON DUPLICATE KEY UPDATE

#### 6. ✅ Review Controller
- **File**: `backend/src/controllers/reviewController.js`
- **Changes**:
  - `createReview()`: Added `created_by` and `updated_by` to INSERT
  - `updateReview()`: Added `updated_by` to UPDATE

#### 7. ✅ Service Controller
- **File**: `backend/src/controllers/serviceController.js`
- **Changes**:
  - `createService()`: Added `created_by` and `updated_by` to INSERT
  - `updateService()`: Added `updated_by` to UPDATE (both id and service_id branches)

#### 8. ✅ Message Controller
- **File**: `backend/src/controllers/messageController.js`
- **Changes**:
  - `sendMessages()`: Added `created_by` and `updated_by` to INSERT into message_history

### Already Updated (Previous Work)
- ✅ Enquiry Controller - Already implementing audit fields
- ✅ Product Controller - Already implementing audit fields
- ✅ Staff Controller - Already implementing audit fields
- ✅ User Controller - Already implementing audit fields
- ✅ Auth Controller - Adding users with audit fields
- ✅ Workout Controller - Uses created_by and updated_by
- ✅ Diet Controller - Uses created_by and updated_by

## How It Works

### Getting Admin UUID from Request
```javascript
const { getActorUuid } = require('../utils/auditTrail');

// In any route handler
const createdBy = getActorUuid(req.user) || null;

// The getActorUuid function checks multiple property names:
// - user.userUuid
// - user.user_uuid
// - user.adminUuid
// - user.admin_uuid
// - user.uuid
```

### INSERT Pattern
```javascript
const createdBy = getActorUuid(req.user) || null;

const [result] = await db.query(
  'INSERT INTO table (col1, col2, created_by, updated_by) VALUES (?, ?, ?, ?)',
  [val1, val2, createdBy, createdBy]
);
```

### UPDATE Pattern
```javascript
const updatedBy = getActorUuid(req.user) || null;

const [result] = await db.query(
  'UPDATE table SET col1 = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
  [val1, updatedBy, id]
);
```

## Verification Checklist

Before deployment, verify:

- [ ] Run migration 0047 on production database
  ```bash
  npm run migrate
  ```

- [ ] All controllers import the auditTrail utility
  ```bash
  grep -r "getActorUuid" backend/src/controllers/
  ```

- [ ] Auth middleware is setting req.user with UUID properties
  - Check that JWT tokens include userUuid or adminUuid

- [ ] Test API endpoints:
  - Create new record → verify created_by and updated_by are set
  - Update record → verify updated_by is updated with current timestamp
  - Query records → verify audit fields return correct UUIDs

## Admin UUID Query Examples

### Find records created by specific admin
```sql
SELECT * FROM orders WHERE created_by = 'admin-uuid-here';
```

### Find records updated in last 24 hours
```sql
SELECT id, created_by, updated_by, updated_at FROM orders 
WHERE updated_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
ORDER BY updated_at DESC;
```

### Audit trail by admin
```sql
SELECT id, created_by, updated_by, created_at, updated_at FROM products 
WHERE created_by = 'admin-uuid' OR updated_by = 'admin-uuid'
ORDER BY updated_at DESC;
```

### Get all records with audit info
```sql
SELECT COUNT(*) as total, created_by, updated_by FROM orders GROUP BY created_by, updated_by;
```

## Notes

- **UUID Storage**: Fields use `CHAR(36)` to store UUIDs (MySQL native format)
- **NULL Values**: Fields are nullable for backward compatibility and user self-created records
- **Indexes**: Added indexes on both `created_by` and `updated_by` for efficient filtering
- **Auth Requirement**: Endpoints using audit tracking should be protected with auth middleware
- **Backward Compatibility**: Old records will have NULL in audit fields; new records will have UUIDs

## Next Steps

1. Run migration 0047 to add columns to production database
2. Deploy updated controllers to production
3. Monitor audit fields in API responses
4. Generate audit reports for admin activity tracking
5. Consider adding API endpoints for audit trail queries
