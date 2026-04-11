const db = require('../config/db');

// Extract admin UUID from request user
const getAdminUuid = (user) =>
  user?.adminUuid || user?.userUuid || user?.admin_uuid || user?.user_uuid || null;

// helper to parse JSON columns
function parseDiet(row) {
  if (!row) return row;
  return {
    ...row,
    days: typeof row.days === 'string' ? JSON.parse(row.days || '{}') : row.days,
  };
}

async function getAllDiets(req, res) {
  try {
    let sql = 'SELECT * FROM diet_plans WHERE 1=1';
    const params = [];

    // Check if user is super admin
    const isSuperAdmin = req.user && String(req.user.role || '').toLowerCase() === 'super admin';

    // If super admin, show all
    if (isSuperAdmin) {
      // No filter for super admin
    }
    // If requester is admin, filter by admin_uuid or admin_id
    else if (req.user?.role === 'admin') {
      const adminUuid = getAdminUuid(req.user);
      if (adminUuid) {
        sql += ' AND (created_by = ? OR admin_id = ?)';
        params.push(adminUuid, req.user.userId);
      } else {
        sql += ' AND admin_id = ?';
        params.push(req.user.userId);
      }
    }
    // If requester is a member, show only diets assigned to them
    else if (req.user?.role === 'user' || req.user?.role === 'member') {
      sql += ' AND member_id = (SELECT id FROM members WHERE email = ? OR phone = ?)';
      params.push(req.user.email || '', req.user.phone || '');
    }

    if (req.query.trainerId) {
      sql += ' AND trainer_id = ?';
      params.push(req.query.trainerId);
    }

    sql += ' ORDER BY created_at DESC';

    const [rows] = await db.query(sql, params);
    res.json(rows.map(parseDiet));
  } catch (err) {
    console.error('getAllDiets error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function getDietById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM diet_plans WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Diet plan not found' });
    }
    res.json(parseDiet(rows[0]));
  } catch (err) {
    console.error('getDietById error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function createDiet(req, res) {
  try {
    const {
      trainerId,
      trainerName,
      trainerSource,
      memberId,
      memberName,
      memberEmail,
      memberMobile,
      memberWeight,
      title,
      totalCalories,
      duration,
      days,
      status,
    } = req.body;

    const adminId = req.user?.role === 'admin' ? req.user.userId : null;
    const createdBy = req.user?.userId || null;

    const [result] = await db.query(
      `INSERT INTO diet_plans
      (trainer_id, trainer_name, trainer_source,
       member_id, member_name, member_email, member_mobile, member_weight,
       title, total_calories, duration, days, status, user_id, admin_id, created_by, updated_by)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        trainerId,
        trainerName || null,
        trainerSource || null,
        memberId,
        memberName || null,
        memberEmail || null,
        memberMobile || null,
        memberWeight || null,
        title || null,
        totalCalories ? Number(totalCalories) : null,
        duration ? Number(duration) : null,
        JSON.stringify(days || {}),
        status || 'active',
        memberId || null,
        adminId,
        createdBy,
        createdBy,
      ]
    );

    const [rows] = await db.query('SELECT * FROM diet_plans WHERE id = ?', [result.insertId]);
    res.json(parseDiet(rows[0]));
  } catch (err) {
    console.error('createDiet error', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function updateDiet(req, res) {
  try {
    const { id } = req.params;
    const {
      trainerId,
      trainerName,
      trainerSource,
      memberId,
      memberName,
      memberEmail,
      memberMobile,
      memberWeight,
      title,
      totalCalories,
      duration,
      days,
      status,
    } = req.body;

    const [result] = await db.query(
      `UPDATE diet_plans SET
        trainer_id=?, trainer_name=?, trainer_source=?,
        member_id=?, member_name=?, member_email=?, member_mobile=?, member_weight=?,
        title=?, total_calories=?, duration=?, days=?, status=?, user_id=?,
        updated_at=CURRENT_TIMESTAMP
       WHERE id=?`,
      [
        trainerId,
        trainerName || null,
        trainerSource || null,
        memberId,
        memberName || null,
        memberEmail || null,
        memberMobile || null,
        memberWeight || null,
        title || null,
        totalCalories ? Number(totalCalories) : null,
        duration ? Number(duration) : null,
        JSON.stringify(days || {}),
        status || 'active',
        memberId || null,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Diet plan not found' });
    }

    const [rows] = await db.query('SELECT * FROM diet_plans WHERE id = ?', [id]);
    res.json(parseDiet(rows[0]));
  } catch (err) {
    console.error('updateDiet error', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function deleteDiet(req, res) {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM diet_plans WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Diet plan not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('deleteDiet error', err);
    res.status(500).json({ error: 'Delete failed' });
  }
}

module.exports = {
  getAllDiets,
  getDietById,
  createDiet,
  updateDiet,
  deleteDiet,
};