const db = require('../config/db');

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
      // 1. Resolve users.id -> staff.id
      const [staffRows] = await db.query(
        "SELECT s.id FROM staff s JOIN users u ON (s.email = u.email OR s.username = u.username) WHERE u.id = ?",
        [trainerId]
      );
      
      const resolvedStaffId = staffRows.length > 0 ? staffRows[0].id : null;

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
