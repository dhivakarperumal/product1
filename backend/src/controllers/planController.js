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
    
    let whereClause = '';
    let params = [];
    
    // If not super admin, filter by created_by (admin_uuid)
    if (!isSuperAdmin && req.user) {
      const adminUuid = getAdminUuid(req.user);
      if (adminUuid) {
        whereClause = ' WHERE created_by = ?';
        params.push(adminUuid);
      }
    }

    const [rows] = await db.query(`SELECT * FROM gym_plans ${whereClause} ORDER BY created_at DESC`, params);
    res.json(rows.map(parsePlan));
  } catch (err) {
    console.error('getAllPlans error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function getPlanById(req, res) {
  try {
    const { id } = req.params;
    
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
    res.json(parsePlan(rows[0]));
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

    // Extract admin UUID and user ID from JWT
    const adminUuid = req.user?.adminUuid || req.user?.userUuid || null;
    const userId = req.user?.userId || null;

    // generate plan_id
    const [countResult] = await db.query("SELECT COUNT(*) as count FROM gym_plans");
    const nextNumber = Number(countResult[0].count) + 1;
    const planId = `PL${String(nextNumber).padStart(3, "0")}`;

    const [result] = await db.query(
      `INSERT INTO gym_plans
      (plan_id, name, description, duration, price, discount, final_price, 
       facilities, trainer_included, diet_plans, active, admin_uuid, created_by, updated_by, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        planId, name, description, duration, Number(price), Number(discount),
        Number(finalPrice), JSON.stringify(facilities || []), trainerIncluded ? 1 : 0,
        JSON.stringify(dietPlans || []), active !== false ? 1 : 0,
        adminUuid, userId, userId, new Date(), new Date()
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

  try {
    // Try to parse as integer, otherwise use as string
    const idNum = parseInt(id, 10);
    const isNum = !isNaN(idNum);
    
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
        active=?, updated_at=CURRENT_TIMESTAMP
       WHERE id=?`;
      params = [...baseParams, idNum];
    } else {
      query = `UPDATE gym_plans SET
        name=?, description=?, duration=?, price=?, discount=?,
        final_price=?, facilities=?, trainer_included=?, diet_plans=?,
        active=?, updated_at=CURRENT_TIMESTAMP
       WHERE plan_id=?`;
      params = [...baseParams, id];
    }

    const [result] = await db.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Fetch the updated plan
    let fetchQuery;
    let fetchParams;
    if (isNum) {
      fetchQuery = `SELECT * FROM gym_plans WHERE id = ?`;
      fetchParams = [idNum];
    } else {
      fetchQuery = `SELECT * FROM gym_plans WHERE plan_id = ?`;
      fetchParams = [id];
    }

    const [rows] = await db.query(fetchQuery, fetchParams);
    res.json(parsePlan(rows[0]));

  } catch (err) {
    console.error('updatePlan error', err);
    res.status(500).json({ message: "Server error" });
  }
}

async function deletePlan(req, res) {
  try {
    const { id } = req.params;
    
    // Try to parse as integer, otherwise use as string
    const idNum = parseInt(id, 10);
    const isNum = !isNaN(idNum);
    
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
