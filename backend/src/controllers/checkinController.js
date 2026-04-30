const db = require('../config/db');

async function resolveTrainerStaffId(trainerId) {
  if (!trainerId) return null;
  const numericId = Number(trainerId);
  if (!Number.isNaN(numericId) && numericId > 0) {
    const [staffById] = await db.query('SELECT id FROM staff WHERE id = ?', [numericId]);
    if (staffById.length > 0) return numericId;
  }

  const [userRows] = await db.query(
    'SELECT id, email, username, employee_id FROM users WHERE id = ?',
    [trainerId]
  );
  if (userRows.length === 0) return null;

  const u = userRows[0];
  const conditions = [];
  const params = [];
  if (u.email) {
    conditions.push('email = ?');
    params.push(u.email);
  }
  if (u.username) {
    conditions.push('username = ?');
    params.push(u.username);
  }
  if (u.employee_id) {
    conditions.push('employee_id = ?');
    params.push(u.employee_id);
  }
  if (conditions.length === 0) return null;

  const [staffRows] = await db.query(
    `SELECT id FROM staff WHERE ${conditions.join(' OR ')} LIMIT 1`,
    params
  );
  return staffRows.length > 0 ? staffRows[0].id : null;
}

/**
 * GET /api/checkins/today?trainerId=...
 * Returns the count of check-ins for the current day.
 * If trainerId is provided, filters by members assigned to that trainer.
 */
async function getTodayCheckins(req, res) {
  try {
    const { trainerId } = req.query; // This is the user_id from frontend
    
    let sql = "";
    let params = [];
    
    if (trainerId && trainerId !== 'undefined') {
      const resolvedStaffId = await resolveTrainerStaffId(trainerId);
      if (!resolvedStaffId) {
        return res.json({ count: 0 });
      }

      // 2. Count distinct members assigned to this staff
      sql = `
        SELECT COUNT(DISTINCT a.member_id) as count
        FROM attendance a
        INNER JOIN trainer_assignments ta ON ta.user_id = a.member_id
        WHERE (DATE(a.check_in) = CURDATE() OR a.date = CURDATE())
          AND ta.trainer_id = ?
          AND a.status = 'Present'
      `;
      params = [resolvedStaffId];
    } else {
      sql = `
        SELECT COUNT(DISTINCT member_id) as count
        FROM attendance
        WHERE (DATE(check_in) = CURDATE() OR date = CURDATE())
          AND status = 'Present'
      `;
    }
    
    const [rows] = await db.query(sql, params);
    res.json({ count: rows[0].count || 0 });
  } catch (err) {
    console.error('getTodayCheckins error:', err);
    res.status(500).json({ error: 'Failed to fetch today\'s check-ins' });
  }
}

module.exports = {
  getTodayCheckins
};
