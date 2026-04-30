const db = require('../config/db');
const { getActorUuid } = require('../utils/auditTrail');

// Extract admin UUID from request user
const getAdminUuid = (user) =>
  user?.adminUuid || user?.userUuid || user?.admin_uuid || user?.user_uuid || null;

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
 * GET /api/attendance?date=YYYY-MM-DD&trainerId=...
 * Returns all attendance records for a specific date.
 */
async function getAttendance(req, res) {
  try {
    const { date, trainerId, memberOnly } = req.query;

    // Check if user is super admin
    const isSuperAdmin = req.user && String(req.user.role || '').toLowerCase() === 'super admin';
    
    let adminUuidFilter = '';
    let adminUuidParam = null;
    
    // If not super admin, filter by created_by (admin_uuid)
    if (!isSuperAdmin && req.user) {
      const adminUuid = getAdminUuid(req.user);
      if (adminUuid) {
        adminUuidFilter = ' AND a.created_by = ?';
        adminUuidParam = adminUuid;
      }
    }

    // Improved query to get names from either users or staff
    let sql = `
      SELECT 
        a.*, 
        COALESCE(s.name, u.username, u.email, 'Unknown') as name, 
        COALESCE(u.email, s.email) as email,
        COALESCE(s.role, u.role, 'Staff') as role
      FROM attendance a
      LEFT JOIN users u ON u.id = a.member_id
      LEFT JOIN staff s ON (s.email = u.email OR s.username = u.username OR s.id = a.member_id)
      WHERE 1=1
    `;
    let params = [];

    if (date && date !== 'All') {
      sql += " AND (a.`date` = ? OR DATE(a.check_in) = ?)";
      params.push(date, date);
    }

    if (trainerId) {
      const resolvedStaffId = await resolveTrainerStaffId(trainerId);
      if (!resolvedStaffId) {
        return res.json([]);
      }
      sql += " AND a.trainer_id = ?";
      params.push(resolvedStaffId);
    }

    // 🔒 memberOnly=true → exclude trainer/staff/admin records (Member Attendance page)
    if (memberOnly === 'true') {
      sql += " AND (u.role IS NULL OR (LOWER(u.role) NOT IN ('trainer', 'staff', 'admin')))";
    }

    // Apply admin_uuid filter
    if (adminUuidFilter) {
      sql += adminUuidFilter;
      params.push(adminUuidParam);
    }

    sql += " GROUP BY a.id ORDER BY a.check_in DESC";

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('getAttendance error:', err);
    res.status(500).json({ error: 'Query failed', details: err.message });
  }
}

/**
 * GET /api/attendance/reverse-geocode?lat=...&lng=...
 * Proxies to Nominatim to avoid CSP issues on frontend.
 */
async function reverseGeocode(req, res) {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'Lat and Lng required' });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'GymManagementApp/1.0' // Nominatim requires a User-Agent
        }
      }
    );
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('reverseGeocode error:', err);
    res.status(500).json({ error: 'Failed to fetch address' });
  }
}

/**
 * POST /api/attendance
 * Marks attendance for a member by a trainer.
 */
async function markAttendance(req, res) {
  try {
    const { memberId, trainerId, status, date, lat, lng, locationName } = req.body;

    if (!memberId || !status || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let resolvedStaffId = null;
    if (trainerId) {
      resolvedStaffId = await resolveTrainerStaffId(trainerId);
      if (!resolvedStaffId) {
        return res.status(400).json({ error: 'Invalid trainer id' });
      }
    }

    // Check if record already exists for this member and date that hasn't been checked out yet
    const [existing] = await db.query(
      "SELECT id FROM attendance WHERE member_id = ? AND (`date` = ? OR DATE(check_in) = ?) AND check_out IS NULL",
      [memberId, date, date]
    );

    if (existing.length > 0) {
      // Update existing record only if it's currently "checked in"
      const updatedBy = getActorUuid(req.user) || null;
      await db.query(
        "UPDATE attendance SET status = ?, trainer_id = ?, lat = ?, lng = ?, location_name = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [status, resolvedStaffId || null, lat || null, lng || null, locationName || null, updatedBy, existing[0].id]
      );
      return res.json({ success: true, message: 'Attendance updated' });
    }

    // Insert new record
    const createdBy = getActorUuid(req.user) || null;
    await db.query(
      "INSERT INTO attendance (member_id, trainer_id, status, `date`, lat, lng, location_name, check_in, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)",
      [memberId, resolvedStaffId || null, status, date, lat || null, lng || null, locationName || null, createdBy, createdBy]
    );

    res.json({ success: true, message: 'Attendance marked' });
  } catch (err) {
    console.error('markAttendance error:', err);
    res.status(500).json({ error: 'Failed to mark attendance', details: err.message });
  }
}

/**
 * POST /api/attendance/checkout
 * Sets check_out time for an existing attendance record.
 */
async function checkOut(req, res) {
  try {
    const { memberId, date } = req.body;

    if (!memberId || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find the current active check-in (where check_out is null)
    // We prioritize the most recent check-in for this member that hasn't been checked out
    const [existing] = await db.query(
      "SELECT id, member_id, check_in, check_out FROM attendance WHERE member_id = ? AND check_out IS NULL ORDER BY check_in DESC LIMIT 1",
      [memberId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'No active check-in found. Please check in first.' });
    }
    
    const updatedBy = getActorUuid(req.user) || null;
    await db.query(
      "UPDATE attendance SET check_out = CURRENT_TIMESTAMP, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [updatedBy, existing[0].id]
    );

    res.json({ success: true, message: 'Checked out successfully' });
  } catch (err) {
    console.error('checkOut error:', err);
    res.status(500).json({ error: 'Failed to check out', details: err.message });
  }
}

module.exports = {
  getAttendance,
  markAttendance,
  reverseGeocode,
  checkOut
};
