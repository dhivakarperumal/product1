const db = require('../config/db');
const { getActorUuid } = require('../utils/auditTrail');

const isNumeric = (value) => {
  const normalized = String(value || '').trim();
  return /^[1-9]\d*$/.test(normalized);
};

const normalizeUuid = (value) => {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed && /[^0-9]/.test(trimmed) ? trimmed : null;
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

async function resolveAttendanceMemberId(memberId) {
  if (!memberId) return null;
  const requested = String(memberId).trim();
  if (!requested || requested === '0') return null;

  const [memberRows] = await db.query(
    'SELECT id, member_id, user_id FROM members WHERE id = ? OR member_id = ? LIMIT 1',
    [requested, requested]
  );
  if (memberRows.length > 0) {
    return memberRows[0].member_id || String(memberRows[0].id);
  }

  const [userRows] = await db.query(
    'SELECT id, user_uuid FROM users WHERE id = ? OR user_uuid = ? LIMIT 1',
    [requested, requested]
  );
  if (userRows.length > 0) {
    return userRows[0].user_uuid || String(userRows[0].id);
  }

  const [membershipRows] = await db.query(
    'SELECT memberId, userId FROM memberships WHERE id = ? OR member_id = ? LIMIT 1',
    [requested, requested]
  );
  if (membershipRows.length > 0) {
    const membership = membershipRows[0];
    if (membership.memberId) {
      const [memberById] = await db.query(
        'SELECT member_id FROM members WHERE id = ? LIMIT 1',
        [membership.memberId]
      );
      if (memberById.length > 0) {
        return memberById[0].member_id || String(membership.memberId);
      }
    }
    if (membership.userId) {
      const [userById] = await db.query(
        'SELECT user_uuid FROM users WHERE id = ? LIMIT 1',
        [membership.userId]
      );
      if (userById.length > 0) {
        return userById[0].user_uuid || String(membership.userId);
      }
      return String(membership.userId);
    }
  }

  return requested;
}

/**
 * GET /api/attendance?date=YYYY-MM-DD&trainerId=...
 * Returns all attendance records for a specific date.
 */
async function getAttendance(req, res) {
  try {
    const { date, trainerId, memberOnly, memberId, activeOnly } = req.query;

    // Check if user is super admin
    const isSuperAdmin = req.user && String(req.user.role || '').toLowerCase() === 'super admin';
    
    let adminUuidFilter = '';
    let adminUuidParam = null;
    
    // If not super admin, filter by created_by (admin_uuid)
    if (!isSuperAdmin && req.user) {
      const adminUuid = getActorUuid(req.user);
      if (adminUuid) {
        adminUuidFilter = ' AND a.created_by = ?';
        adminUuidParam = adminUuid;
      }
    }

    // Improved query to get names from users, staff, memberships, or members
    let sql = `
      SELECT DISTINCT
        a.*,
        COALESCE(
          gm.name,
          mu.username,
          mu.email,
          u.username,
          u.email,
          s.name,
          'Unknown'
        ) AS name,
        COALESCE(mu.email, u.email, s.email) AS email,
        COALESCE(mu.role, u.role, s.role, 'Member') AS role
      FROM attendance a
      LEFT JOIN members gm ON gm.member_id = a.member_id OR gm.id = a.member_id
      LEFT JOIN users u ON u.id = a.member_id OR u.user_uuid = a.member_id
      LEFT JOIN memberships m2 ON m2.memberId = gm.id OR m2.userId = a.member_id
      LEFT JOIN users mu ON mu.id = m2.userId
      LEFT JOIN staff s ON s.id = a.member_id OR s.employee_id = a.member_id
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
      sql += " AND (a.trainer_id = ? OR a.trainer_id = (SELECT employee_id FROM staff WHERE id = ? LIMIT 1))";
      params.push(resolvedStaffId, trainerId);
    }

    if (memberId) {
      const resolvedMemberId = await resolveAttendanceMemberId(memberId);
      if (!resolvedMemberId) {
        return res.json([]);
      }
      const memberFilter = [resolvedMemberId];
      if (isNumeric(memberId) && resolvedMemberId !== memberId) {
        memberFilter.push(memberId);
      }
      sql += ` AND (${memberFilter.map(() => 'a.member_id = ?').join(' OR ')})`;
      params.push(...memberFilter);
    }

    if (activeOnly === 'true') {
      sql += ' AND a.check_out IS NULL';
    }

    // 🔒 memberOnly=true → exclude trainer/staff/admin records (Member Attendance page)
    if (memberOnly === 'true') {
      sql += " AND ((u.role IS NULL OR (LOWER(u.role) NOT IN ('trainer', 'staff', 'admin'))) AND (s.role IS NULL OR (LOWER(s.role) NOT IN ('trainer', 'staff', 'admin'))))";
    }

    // Apply admin_uuid filter
    if (adminUuidFilter) {
      sql += adminUuidFilter;
      params.push(adminUuidParam);
    }

    sql += " ORDER BY a.check_in DESC";

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

    const resolvedMemberId = await resolveAttendanceMemberId(memberId);
    if (!resolvedMemberId) {
      return res.status(400).json({ error: 'Invalid member id' });
    }

    const memberFilter = [resolvedMemberId];
    if (isNumeric(memberId) && resolvedMemberId !== memberId) {
      memberFilter.push(memberId);
    }

    const [existing] = await db.query(
      `SELECT id, check_out FROM attendance WHERE (${memberFilter.map(() => 'member_id = ?').join(' OR ')}) AND (\`date\` = ? OR DATE(check_in) = ?) ORDER BY check_in DESC LIMIT 1`,
      [...memberFilter, date, date]
    );

    if (existing.length > 0) {
      const record = existing[0];
      if (record.check_out === null) {
        const updatedBy = getActorUuid(req.user) || null;
        await db.query(
          "UPDATE attendance SET status = ?, trainer_id = ?, lat = ?, lng = ?, location_name = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
          [status, resolvedStaffId || null, lat || null, lng || null, locationName || null, updatedBy, record.id]
        );
        return res.json({ success: true, message: 'Attendance updated' });
      }

      return res.status(409).json({ error: 'Attendance has already been recorded for this member today.' });
    }

    const createdBy = getActorUuid(req.user) || null;
    await db.query(
      "INSERT INTO attendance (member_id, trainer_id, status, `date`, lat, lng, location_name, check_in, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)",
      [resolvedMemberId, resolvedStaffId || null, status, date, lat || null, lng || null, locationName || null, createdBy, createdBy]
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

    const resolvedMemberId = await resolveAttendanceMemberId(memberId);
    if (!resolvedMemberId) {
      return res.status(400).json({ error: 'Invalid member id' });
    }

    const memberFilter = [resolvedMemberId];
    if (isNumeric(memberId) && resolvedMemberId !== memberId) {
      memberFilter.push(memberId);
    }

    // Find the current active check-in (where check_out is null)
    // We prioritize the most recent check-in for this member that hasn't been checked out
    const [existing] = await db.query(
      `SELECT id, member_id, check_in, check_out FROM attendance WHERE (${memberFilter.map(() => 'member_id = ?').join(' OR ')}) AND check_out IS NULL ORDER BY check_in DESC LIMIT 1`,
      memberFilter
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
