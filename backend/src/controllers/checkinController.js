const db = require('../config/db');

const isNumeric = (value) => {
  const normalized = String(value || '').trim();
  return /^[1-9]\d*$/.test(normalized);
};

async function resolveTrainerStaffId(trainerId) {
  if (!trainerId) return null;
  const requested = String(trainerId).trim();
  if (!requested || requested === '0') return null;

  if (isNumeric(requested)) {
    const [staffRows] = await db.query(
      'SELECT id, employee_id FROM staff WHERE id = ? OR employee_id = ? LIMIT 1',
      [requested, requested]
    );
    if (staffRows.length > 0) {
      return staffRows[0].employee_id || String(staffRows[0].id);
    }
  }

  const [staffRows] = await db.query(
    'SELECT id, employee_id FROM staff WHERE employee_id = ? LIMIT 1',
    [requested]
  );
  if (staffRows.length > 0) {
    return staffRows[0].employee_id;
  }

  const [userRows] = await db.query(
    'SELECT id, email, username, employee_id, user_uuid FROM users WHERE id = ? OR user_uuid = ? LIMIT 1',
    [requested, requested]
  );
  if (userRows.length === 0) return null;

  const user = userRows[0];
  if (user.employee_id) return user.employee_id;

  const conditions = [];
  const params = [];
  if (user.email) {
    conditions.push('email = ?');
    params.push(user.email);
  }
  if (user.username) {
    conditions.push('username = ?');
    params.push(user.username);
  }
  if (user.employee_id) {
    conditions.push('employee_id = ?');
    params.push(user.employee_id);
  }

  if (conditions.length === 0) return null;

  const [staffByUser] = await db.query(
    `SELECT id, employee_id FROM staff WHERE ${conditions.join(' OR ')} LIMIT 1`,
    params
  );
  if (staffByUser.length > 0) {
    return staffByUser[0].employee_id || String(staffByUser[0].id);
  }

  return null;
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
        INNER JOIN memberships m ON m.userId = a.member_id
        WHERE (DATE(a.check_in) = CURDATE() OR a.date = CURDATE())
          AND m.trainerId = ?
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
