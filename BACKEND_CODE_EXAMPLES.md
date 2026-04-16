# Backend Code Examples & Implementation Guide

## 1. Creating a Member (from Frontend)

### Frontend Code (React)
```javascript
const createMember = async (memberData) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch('/api/members', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'John Doe',
      phone: '9876543210',
      email: 'john@example.com',
      gender: 'M',
      height: 5.8,
      weight: 75.5,
      plan: 'Premium',
      duration: 12,
      status: 'active'
    })
  });
  
  const data = await response.json();
  console.log('Created member:', data);
  // Returns: {id: 1, member_id: 'uuid-xxx', created_by: 'admin-uuid', ...}
};
```

### Backend Code (Node.js/Express)
```javascript
async function createMember(req, res) {
  const { name, phone, email, plan, duration, status } = req.body;
  
  // Step 1: Extract admin UUID from JWT
  const adminUuid = req.user?.adminUuid || req.user?.userUuid || null;
  console.log('Creating member for admin:', adminUuid);
  
  // Step 2: Validate input
  if (!name || !phone) {
    return res.status(400).json({
      message: "Name and phone are required"
    });
  }
  
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    // Step 3: Check for duplicates within admin's scope
    const [existingPhone] = await connection.query(
      `SELECT * FROM members 
       WHERE phone = ? AND created_by = ?`,
      [phone, adminUuid]
    );
    
    if (existingPhone.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        message: "Phone already exists for this admin"
      });
    }
    
    // Step 4: Generate member ID (UUID)
    const memberId = randomUUID();
    
    // Step 5: Insert member with admin linkage
    const [result] = await connection.query(
      `INSERT INTO members
      (member_id, name, phone, email, plan, duration,
       status, created_by, updated_by, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [
        memberId, name, phone, email, plan, duration,
        status, adminUuid, adminUuid, new Date(), new Date()
      ]
    );
    
    await connection.commit();
    
    // Step 6: Fetch and return created member
    const [rows] = await db.query(
      'SELECT * FROM members WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json(rows[0]);
    
  } catch (err) {
    await connection.rollback();
    console.error('createMember error:', err);
    res.status(500).json({
      error: 'Failed to create member',
      details: err.message
    });
  } finally {
    connection.release();
  }
}
```

---

## 2. Fetching Members (Filtered by Admin)

### Frontend Code
```javascript
const fetchMembers = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch('/api/members', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const members = await response.json();
  console.log('Admin\'s members:', members);
  // Returns: Array of members where created_by = admin_uuid
};
```

### Backend Code
```javascript
async function getAllMembers(req, res) {
  try {
    // Step 1: Check if user is super admin
    const isSuperAdmin = String(req.user.role || '').toLowerCase() === 'super admin';
    const adminUuid = req.user?.adminUuid || req.user?.userUuid || null;
    
    let whereClauses = [];
    let params = [];
    
    // Step 2: Add filtering if not super admin
    if (!isSuperAdmin && req.user) {
      if (adminUuid) {
        whereClauses.push('m.created_by = ?');
        params.push(adminUuid);
      }
    }
    
    const whereClause = whereClauses.length > 0 
      ? `WHERE ${whereClauses.join(' AND ')}` 
      : '';
    
    // Step 3: Query members
    const sql = `
      SELECT 
        m.id, m.member_id, m.name, m.phone, m.email,
        m.gender, m.height, m.weight, m.bmi, m.plan,
        m.status, m.created_at,
        (SELECT COUNT(*) FROM workout_programs wp WHERE wp.member_id = m.id) 
          AS workout_count,
        (SELECT COUNT(*) FROM diet_plans dp WHERE dp.member_id = m.id) 
          AS diet_count
      FROM members m
      ${whereClause}
      ORDER BY m.created_at DESC
    `;
    
    const [rows] = await db.query(sql, params);
    res.json(rows);
    
  } catch (err) {
    console.error('getAllMembers error:', err);
    res.status(500).json({
      error: 'Query failed',
      details: err.message
    });
  }
}
```

---

## 3. Creating a Plan

### Frontend Code
```javascript
const createPlan = async (planData) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch('/api/plans', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'Premium Membership',
      description: 'Full access to all facilities',
      duration: '12 months',
      price: 5000,
      discount: 10,
      finalPrice: 4500,
      facilities: ['Gym', 'Yoga', 'Swimming'],
      trainerIncluded: true,
      dietPlans: ['High Protein', 'Balanced'],
      active: true
    })
  });
  
  const data = await response.json();
  console.log('Created plan:', data);
  // Returns: {id: 1, plan_id: 'PL001', created_by: 'admin-uuid', ...}
};
```

### Backend Code
```javascript
async function createPlan(req, res) {
  const {
    name, description, duration, price, discount, finalPrice,
    facilities, trainerIncluded, dietPlans, active
  } = req.body;
  
  try {
    // Step 1: Validate required fields
    if (!name || !duration || !price) {
      return res.status(400).json({
        message: "Name, duration, and price are required"
      });
    }
    
    // Step 2: Extract admin UUID
    const adminUuid = req.user?.adminUuid || req.user?.userUuid || null;
    
    // Step 3: Generate readable plan_id
    const [countResult] = await db.query(
      "SELECT COUNT(*) as count FROM gym_plans"
    );
    const nextNumber = Number(countResult[0].count) + 1;
    const planId = `PL${String(nextNumber).padStart(3, "0")}`;
    
    // Step 4: Insert plan
    const [result] = await db.query(
      `INSERT INTO gym_plans
      (plan_id, name, description, duration, price, discount, 
       final_price, facilities, trainer_included, diet_plans, 
       active, created_by, updated_by, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        planId, name, description, duration, Number(price),
        Number(discount), Number(finalPrice),
        JSON.stringify(facilities || []),
        trainerIncluded ? 1 : 0,
        JSON.stringify(dietPlans || []),
        active !== false ? 1 : 0,
        adminUuid, adminUuid,
        new Date(), new Date()
      ]
    );
    
    // Step 5: Fetch and return created plan
    const [rows] = await db.query(
      'SELECT * FROM gym_plans WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json(rows[0]);
    
  } catch (err) {
    console.error('createPlan error:', err);
    res.status(500).json({
      error: 'Insert failed',
      details: err.message
    });
  }
}
```

---

## 4. Creating a Staff Member

### Frontend Code
```javascript
const createStaff = async (staffData) => {
  const token = localStorage.getItem('token');
  
  // First, generate employee ID
  const idResponse = await fetch('/api/staff/generate-employee-id');
  const { employeeId } = await idResponse.json();
  
  const response = await fetch('/api/staff', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      employee_id: employeeId,
      name: 'John Trainer',
      email: 'john@gym.com',
      phone: '9876543210',
      role: 'trainer',
      department: 'Training',
      joining_date: '2024-01-15',
      shift: '9AM-5PM',
      salary: 50000,
      qualification: 'Certified Trainer'
    })
  });
  
  const data = await response.json();
  console.log('Created staff:', data);
  // Returns: {id: 1, employee_id: 'uuid', admin_uuid: 'admin-uuid', ...}
};
```

### Backend Code
```javascript
async function createStaff(req, res) {
  try {
    const body = req.body;
    
    // Step 1: Extract admin UUID
    const adminUuid = req.user?.adminUuid || req.user?.admin_uuid || null;
    
    // Step 2: Use provided employee_id or generate
    const employeeId = body.employee_id || randomUUID();
    
    // Step 3: Insert staff with admin linkage
    const [result] = await db.query(
      `INSERT INTO staff
      (employee_id, name, email, phone, role, department,
       joining_date, shift, salary, qualification,
       admin_uuid, created_by, updated_by, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        employeeId,
        body.name,
        body.email,
        body.phone,
        body.role,
        body.department,
        body.joining_date,
        body.shift,
        body.salary,
        body.qualification,
        adminUuid,      // Set admin_uuid for authorization
        adminUuid,      // Set created_by
        adminUuid,      // Set updated_by
        new Date(),
        new Date()
      ]
    );
    
    // Step 4: Fetch and return created staff
    const [rows] = await db.query(
      'SELECT * FROM staff WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json(rows[0]);
    
  } catch (err) {
    console.error('createStaff error:', err);
    res.status(500).json({
      error: 'Failed to create staff',
      details: err.message
    });
  }
}
```

---

## 5. Updating a Resource (with Authorization)

### Frontend Code
```javascript
const updateMember = async (memberId, updateData) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`/api/members/${memberId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'Jane Doe',
      status: 'inactive'
    })
  });
  
  const data = await response.json();
  console.log('Updated member:', data);
};
```

### Backend Code
```javascript
async function updateMember(req, res) {
  const { id } = req.params;
  const updateData = req.body;
  
  try {
    // Step 1: Parse ID (could be numeric or UUID)
    const idNum = parseInt(id, 10);
    const isNum = !isNaN(idNum);
    
    // Step 2: Check if member exists
    let [existing] = isNum
      ? await db.query('SELECT * FROM members WHERE id = ?', [idNum])
      : await db.query('SELECT * FROM members WHERE member_id = ?', [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    
    // Step 3: Check authorization (admin can only update own members)
    const adminUuid = req.user?.adminUuid || null;
    if (existing[0].created_by !== adminUuid) {
      return res.status(403).json({
        error: 'Not authorized to update this member'
      });
    }
    
    // Step 4: Build update query
    const fields = [];
    const values = [];
    
    for (const [key, value] of Object.entries(updateData)) {
      if (['name', 'email', 'phone', 'status', 'plan'].includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    // Step 5: Add audit trail
    fields.push('updated_by = ?');
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(adminUuid);
    
    // Step 6: Execute update
    let query;
    if (isNum) {
      query = `UPDATE members SET ${fields.join(', ')} WHERE id = ?`;
      values.push(idNum);
    } else {
      query = `UPDATE members SET ${fields.join(', ')} WHERE member_id = ?`;
      values.push(id);
    }
    
    await db.query(query, values);
    
    // Step 7: Fetch and return updated member
    let [rows] = isNum
      ? await db.query('SELECT * FROM members WHERE id = ?', [idNum])
      : await db.query('SELECT * FROM members WHERE member_id = ?', [id]);
    
    res.json(rows[0]);
    
  } catch (err) {
    console.error('updateMember error:', err);
    res.status(500).json({ error: 'Update failed' });
  }
}
```

---

## 6. Authentication & Token Extraction

### Backend Middleware
```javascript
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  // Step 1: Extract token from Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  // Step 2: Verify token
  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    // Step 3: Attach user to request
    req.user = user;
    console.log('Authenticated user:', {
      email: user.email,
      role: user.role,
      adminUuid: user.adminUuid
    });
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const normalizedRole = String(req.user.role || '').toLowerCase();
  if (!['admin', 'super admin', 'superadmin'].includes(normalizedRole)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
};

module.exports = { authenticateToken, requireAdmin };
```

### Using Middleware in Routes
```javascript
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { getAllMembers, createMember } = require('../controllers/memberController');

// Protected route (auth required, admin only)
router.post('/', authenticateToken, requireAdmin, createMember);

// Protected route (auth required, admin only)
router.get('/', authenticateToken, requireAdmin, getAllMembers);

// Public route
router.get('/:id', getMemberById);

module.exports = router;
```

---

## 7. Common Query Patterns

### Get all resources for an admin
```javascript
const [rows] = await db.query(
  'SELECT * FROM table_name WHERE created_by = ? ORDER BY created_at DESC',
  [adminUuid]
);
```

### Check duplicate with admin scope
```javascript
const [existing] = await db.query(
  'SELECT * FROM members WHERE phone = ? AND created_by = ?',
  [phone, adminUuid]
);
```

### Get counts for dashboard
```javascript
const [stats] = await db.query(`
  SELECT
    (SELECT COUNT(*) FROM members WHERE created_by = ?) as member_count,
    (SELECT COUNT(*) FROM gym_plans WHERE created_by = ?) as plan_count,
    (SELECT COUNT(*) FROM products WHERE created_by = ?) as product_count,
    (SELECT COUNT(*) FROM staff WHERE admin_uuid = ?) as staff_count,
    (SELECT SUM(price) FROM gym_plans WHERE created_by = ?) as total_revenue
`, [adminUuid, adminUuid, adminUuid, adminUuid, adminUuid]);
```

### Join to get related data
```javascript
const [rows] = await db.query(`
  SELECT 
    m.*,
    p.name as plan_name,
    p.price,
    COUNT(w.id) as workout_count
  FROM members m
  LEFT JOIN gym_plans p ON m.plan = p.plan_id
  LEFT JOIN workout_programs w ON w.member_id = m.id
  WHERE m.created_by = ?
  GROUP BY m.id
  ORDER BY m.created_at DESC
`, [adminUuid]);
```

---

## 8. Error Handling Pattern

### Consistent Error Response
```javascript
try {
  // Database operation
  const [result] = await db.query(sql, params);
  res.json(result);
  
} catch (err) {
  console.error('Operation failed:', err);
  
  // Handle specific errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({
      error: 'Duplicate entry',
      details: 'This record already exists'
    });
  }
  
  if (err.code === 'ER_NO_REFERENCED_ROW') {
    return res.status(400).json({
      error: 'Invalid reference',
      details: 'Referenced record not found'
    });
  }
  
  // Generic error
  res.status(500).json({
    error: 'Operation failed',
    details: process.env.NODE_ENV !== 'production' ? err.message : undefined
  });
}
```

---

## 9. Transaction Pattern (for multi-step operations)

```javascript
async function complexOperation(req, res) {
  const connection = await db.getConnection();
  
  try {
    // Step 1: Start transaction
    await connection.beginTransaction();
    
    // Step 2: First operation
    const [result1] = await connection.query(
      'INSERT INTO table1 SET ?',
      [data1]
    );
    
    // Step 3: Second operation (dependent on first)
    await connection.query(
      'INSERT INTO table2 SET ?',
      { ...data2, relation_id: result1.insertId }
    );
    
    // Step 4: Commit if all successful
    await connection.commit();
    res.json({ success: true });
    
  } catch (err) {
    // Step 5: Rollback on error
    await connection.rollback();
    console.error('Transaction failed:', err);
    res.status(500).json({ error: 'Operation failed' });
    
  } finally {
    // Step 6: Release connection
    connection.release();
  }
}
```

