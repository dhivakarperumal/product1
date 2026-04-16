const db = require('../config/db');

// Extract admin UUID from request user
const getAdminUuid = (user) =>
  user?.adminUuid || user?.userUuid || user?.admin_uuid || user?.user_uuid || null;

// Helper function to parse JSON fields
const parsePlan = (plan) => {
  if (!plan) return plan;
  return {
    ...plan,
    facilities: typeof plan.facilities === 'string' ? JSON.parse(plan.facilities || '[]') : (plan.facilities || []),
    features: typeof plan.features === 'string' ? JSON.parse(plan.features || '[]') : (plan.features || []),
    diet_plans: typeof plan.diet_plans === 'string' ? JSON.parse(plan.diet_plans || '[]') : (plan.diet_plans || []),
    // Handle duration_months as fallback to duration
    duration: plan.duration || plan.duration_months,
    // Handle trainer_included mapping
    trainerIncluded: plan.trainer_included === 1 || plan.trainer_included === true
  };
};

async function getAllPlans(req, res) {
  try {
    // Check if user is super admin
    const isSuperAdmin = req.user && String(req.user.role || '').toLowerCase() === 'super admin';
    
    let query = 'SELECT * FROM gym_plans';
    let params = [];
    
    // Admin filter logic:
    // 1. Super admin: see all plans
    // 2. Admin/trainer with adminUuid: see plans they created
    // 3. Regular user/member: see all public/active plans
    if (isSuperAdmin) {
      // Super admin sees all plans
      // No WHERE clause needed
    } else if (req.user) {
      const adminUuid = getAdminUuid(req.user);
      if (adminUuid) {
        // Admin/trainer sees their own plans
        query += ' WHERE created_by = ?';
        params = [adminUuid];
      }
      // Regular users/members see all plans (no restriction)
      // Falls through without WHERE clause
    }
    // Unauthenticated users also see all plans
    
    query += ' ORDER BY created_at DESC';
    console.log('getAllPlans query:', query, 'params:', params, 'user:', req.user?.role);
    const [rows] = await db.query(query, params);
    // Parse JSON fields and return
    res.json(rows.map(parsePlan));
  } catch (err) {
    console.error('getAllPlans error:', err.stack || err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function getPlanById(req, res) {
  try {
    const { id } = req.params;
    
    // Check if user is super admin
    const isSuperAdmin = req.user && String(req.user.role || '').toLowerCase() === 'super admin';
    
    // Try to parse as integer, otherwise use as string
    const idNum = parseInt(id, 10);
    const isNum = !isNaN(idNum);
    
    let query;
    let params;
    if (isNum) {
      query = `SELECT * FROM gym_plans WHERE id = ?`;
      params = [idNum];
    } else {
      query = `SELECT * FROM gym_plans WHERE plan_id = ? OR CAST(id AS CHAR) = ?`;
      params = [id, id];
    }
    
    const [rows] = await db.query(query, params);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    const plan = rows[0];
    
    // Authorization check: if not super admin, verify plan belongs to user's admin
    if (!isSuperAdmin && req.user) {
      const adminUuid = getAdminUuid(req.user);
      if (!adminUuid || plan.created_by !== adminUuid) {
        return res.status(403).json({ error: 'Not authorized to access this plan' });
      }
    } else if (!isSuperAdmin) {
      // Unauthenticated user cannot access plans
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    res.json(parsePlan(plan));
  } catch (err) {
    console.error('getPlanById error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function createPlan(req, res) {
  const {
    name, description, duration, price, discount, finalPrice,
    facilities, trainerIncluded, dietPlans, active
  } = req.body;

  try {
    // Validate required fields
    if (!name || !duration || !price) {
      return res.status(400).json({ message: "Name, duration, and price are required" });
    }

    // Extract admin UUID from JWT for audit fields
    const adminUuid = getAdminUuid(req.user);
    const createdBy = adminUuid;

    // generate plan_id
    const [countResult] = await db.query("SELECT COUNT(*) as count FROM gym_plans");
    const nextNumber = Number(countResult[0].count) + 1;
    const planId = `PL${String(nextNumber).padStart(3, "0")}`;

    const [result] = await db.query(
      `INSERT INTO gym_plans
      (plan_id, name, description, duration, price, discount, final_price, 
       facilities, trainer_included, diet_plans, active, created_by, updated_by, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        planId, name, description, duration, Number(price), Number(discount),
        Number(finalPrice), JSON.stringify(facilities || []), trainerIncluded ? 1 : 0,
        JSON.stringify(dietPlans || []), active !== false ? 1 : 0,
        createdBy, createdBy, new Date(), new Date()
      ]
    );

    // Fetch the created plan
    const [rows] = await db.query('SELECT * FROM gym_plans WHERE id = ?', [result.insertId]);
    res.json(parsePlan(rows[0]));

  } catch (err) {
    console.error('createPlan error:', err.message, err.code, err.sqlMessage);
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

async function updatePlan(req, res) {
  const { id } = req.params;
  const {
    name, description, duration, price, discount, finalPrice,
    facilities, trainerIncluded, dietPlans, active
  } = req.body;

  const updatedBy = getAdminUuid(req.user);
  const isSuperAdmin = req.user && String(req.user.role || '').toLowerCase() === 'super admin';

  try {
    // Fetch the plan first to verify ownership
    const idNum = parseInt(id, 10);
    const isNum = !isNaN(idNum);
    
    let fetchQuery;
    let fetchParams;
    if (isNum) {
      fetchQuery = `SELECT * FROM gym_plans WHERE id = ?`;
      fetchParams = [idNum];
    } else {
      fetchQuery = `SELECT * FROM gym_plans WHERE plan_id = ?`;
      fetchParams = [id];
    }
    
    const [planRows] = await db.query(fetchQuery, fetchParams);
    if (planRows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    const plan = planRows[0];
    
    // Authorization check: if not super admin, verify plan belongs to user's admin
    if (!isSuperAdmin && updatedBy && plan.created_by !== updatedBy) {
      return res.status(403).json({ error: 'Not authorized to update this plan' });
    } else if (!isSuperAdmin && !updatedBy) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    let query;
    let params;
    
    const baseParams = [
      name, description, duration, Number(price), Number(discount),
      Number(finalPrice), JSON.stringify(facilities || []), trainerIncluded ? 1 : 0,
      JSON.stringify(dietPlans || []), active !== false ? 1 : 0
    ];

    if (isNum) {
      query = `UPDATE gym_plans SET
        name=?, description=?, duration=?, price=?, discount=?,
        final_price=?, facilities=?, trainer_included=?, diet_plans=?,
        active=?, updated_by=?, updated_at=CURRENT_TIMESTAMP
       WHERE id=?`;
      params = [...baseParams, updatedBy, idNum];
    } else {
      query = `UPDATE gym_plans SET
        name=?, description=?, duration=?, price=?, discount=?,
        final_price=?, facilities=?, trainer_included=?, diet_plans=?,
        active=?, updated_by=?, updated_at=CURRENT_TIMESTAMP
       WHERE plan_id=?`;
      params = [...baseParams, updatedBy, id];
    }

    const [result] = await db.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Fetch the updated plan
    let refetchQuery;
    let refetchParams;
    if (isNum) {
      refetchQuery = `SELECT * FROM gym_plans WHERE id = ?`;
      refetchParams = [idNum];
    } else {
      refetchQuery = `SELECT * FROM gym_plans WHERE plan_id = ?`;
      refetchParams = [id];
    }

    const [rows] = await db.query(refetchQuery, refetchParams);
    res.json(parsePlan(rows[0]));

  } catch (err) {
    console.error('updatePlan error', err);
    res.status(500).json({ message: "Server error" });
  }
}

async function deletePlan(req, res) {
  try {
    const { id } = req.params;
    
    // Check if user is super admin
    const isSuperAdmin = req.user && String(req.user.role || '').toLowerCase() === 'super admin';
    const adminUuid = getAdminUuid(req.user);
    
    // Try to parse as integer, otherwise use as string
    const idNum = parseInt(id, 10);
    const isNum = !isNaN(idNum);
    
    let fetchQuery;
    let fetchParams;
    if (isNum) {
      fetchQuery = `SELECT * FROM gym_plans WHERE id = ?`;
      fetchParams = [idNum];
    } else {
      fetchQuery = `SELECT * FROM gym_plans WHERE plan_id = ?`;
      fetchParams = [id];
    }
    
    const [planRows] = await db.query(fetchQuery, fetchParams);
    if (planRows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    const plan = planRows[0];
    
    // Authorization check: if not super admin, verify plan belongs to user's admin
    if (!isSuperAdmin && adminUuid && plan.created_by !== adminUuid) {
      return res.status(403).json({ error: 'Not authorized to delete this plan' });
    } else if (!isSuperAdmin && !adminUuid) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    let query;
    let params;
    if (isNum) {
      query = `DELETE FROM gym_plans WHERE id = ?`;
      params = [idNum];
    } else {
      query = `DELETE FROM gym_plans WHERE plan_id = ?`;
      params = [id];
    }

    const [result] = await db.query(query, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    res.json({ success: true, message: 'Plan deleted successfully' });
  } catch (err) {
    console.error('deletePlan error', err);
    res.status(500).json({ error: 'Delete failed' });
  }
}

module.exports = { getAllPlans, getPlanById, createPlan, updatePlan, deletePlan };
