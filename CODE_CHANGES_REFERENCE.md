# 📝 Code Changes Reference

## Quick Code Changes Made

### 1. staffController.js - Line 3
```javascript
// ADDED THIS LINE:
const bcrypt = require('bcryptjs');
```

---

### 2. staffController.js - createStaff() function (Lines 62-68)
```javascript
// Hash password if provided
let passwordHash = null;
if (body.password) {
  passwordHash = await bcrypt.hash(body.password, 10);
}
```

---

### 3. staffController.js - INSERT query (Line 72)
```javascript
// CHANGED FROM:
const query = `INSERT INTO staff
  (employee_id, username, name, email, phone, role, ...., certificate_doc, admin_uuid, ...)

// TO:
const query = `INSERT INTO staff
  (employee_id, username, name, email, phone, role, ...., certificate_doc, password_hash, admin_uuid, ...)
```

---

### 4. staffController.js - params array (Line 101)
```javascript
// ADDED THIS LINE IN PARAMS ARRAY:
      passwordHash,  // ← NEW (goes after certificate_doc, before adminUuid)
      adminUuid,
```

---

### 5. staffController.js - updateStaff() function (Lines 158-165)
```javascript
// Hash password if provided in update
let passwordHash = null;
if (body.password) {
  passwordHash = await bcrypt.hash(body.password, 10);
}
```

---

### 6. staffController.js - updateStaff() UPDATE queries (Lines 167-202)
```javascript
// UPDATED UPDATE STATEMENT TO:
if (isNum) {
  if (passwordHash) {
    // Include password_hash in UPDATE
    query = `UPDATE staff SET ... password_hash = ?, updated_by = ?, ... WHERE id = ?`;
    params = [...baseParams, passwordHash, updatedBy, idNum];
  } else {
    // Skip password_hash if not updating
    query = `UPDATE staff SET ... updated_by = ?, ... WHERE id = ?`;
    params = [...baseParams, updatedBy, idNum];
  }
}
```

---

### 7. authController.js - Line 376
```javascript
// CHANGED FROM:
userData.role = role;

// TO:
userData.role = user.role || role;
```

---

## 🔄 Function Flow

### Creating Staff with Password:
```
Admin fills AddStaff form
    ↓
Frontend sends POST /staff with password
    ↓
Backend createStaff():
  1. Gets password from body
  2. Hashes with bcrypt.hash(password, 10)
  3. Stores in password_hash variable
  4. Inserts into staff table with password_hash
    ↓
Staff record created with hashed password
    ↓
Trainer can login immediately
```

### Trainer Login:
```
Trainer selects "Trainer" role
    ↓
Enters email: kumars@gmail.com
Enters password: 9638527410
    ↓
Frontend sends POST /auth/login
    ↓
Backend authController.login():
  1. Calls findTrainerByIdentifier(email)
  2. Finds trainer in staff table
  3. Gets password_hash from trainer record
  4. Uses bcrypt.compare(entered_password, password_hash)
  5. If match: creates JWT token, sets userData.role = trainer.role
    ↓
Frontend receives token & user data
    ↓
Redirects to /trainer dashboard
```

---

## 🎯 Key Points

1. **Password is NEVER stored as plain text**
   - Always hashed with bcrypt before storing
   - Salt rounds = 10 (secure, not too slow)

2. **Password comparison is TIMING-SAFE**
   - Uses bcrypt.compare() for verification
   - Prevents timing attacks

3. **password_hash column is required**
   - Must be VARCHAR(255) to store bcrypt hash
   - Already added via migration 0062

4. **Frontend unchanged**
   - AddStaff form sends password as before
   - AdvancedLogin sends password as before
   - No changes needed on frontend

5. **Backward compatible**
   - Old code still works
   - Password is optional in updateStaff
   - If no password provided, keeps existing hash

---

## 🧪 Testing Commands

```bash
# Verify password setup
cd backend
node test_trainer_password_flow.js

# Set passwords for existing trainers
node set_trainer_passwords_new.js

# Check specific trainer
mysql -u root gym_user_db
SELECT email, username, password_hash FROM staff WHERE role='trainer' LIMIT 1;
```

---

## ✅ Changes Checklist

- [x] Added bcrypt import
- [x] Updated createStaff() with password hashing
- [x] Updated INSERT query to include password_hash
- [x] Updated params array to include passwordHash
- [x] Updated updateStaff() with password hashing logic
- [x] Updated UPDATE queries to conditionally include password_hash
- [x] Fixed authController role assignment
- [x] Verified password_hash column exists
- [x] Set passwords for all 4 trainers
- [x] Created test scripts
- [x] Created documentation

---

## 📱 Real Example

### Creating a Trainer:
```javascript
// Frontend sends:
{
  name: "John Doe",
  email: "john@gym.com",
  username: "john",
  phone: "9876543210",
  password: "9876543210",  // ← From phone field
  role: "trainer",
  department: "Fitness"
}

// Backend does:
const hash = await bcrypt.hash("9876543210", 10);
// Result: $2b$10$abcdef...xyz (60 chars)

// Stores in DB:
INSERT INTO staff (..., password_hash) 
VALUES (..., "$2b$10$abcdef...xyz")

// Later, trainer logs in:
User enters: john@gym.com + 9876543210
Backend verifies:
const match = await bcrypt.compare("9876543210", "$2b$10$abcdef...xyz");
// Result: true ✓
```

---

## 🎓 What Was Wrong Before

1. **No bcrypt import** - Couldn't hash passwords
2. **password_hash not in INSERT** - Didn't store password
3. **No password hashing logic** - Stored plaintext (SECURITY RISK)
4. **No password_hash in UPDATE** - Couldn't update passwords
5. **Wrong role assignment** - User role confused with requested role

All of these have been fixed! ✅

