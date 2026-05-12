const db = require('../config/db');
const { getActorUuid } = require('../utils/auditTrail');

async function resolveTrainerStaffId(trainerUserId) {
  if (!trainerUserId) return null;
  const numericId = Number(trainerUserId);
  if (!Number.isNaN(numericId) && numericId > 0) {
    const [staffById] = await db.query('SELECT id FROM staff WHERE id = ?', [numericId]);
    if (staffById.length > 0) return numericId;
  }

  const [userRows] = await db.query(
    'SELECT id, email, username, employee_id FROM users WHERE id = ?',
    [trainerUserId]
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

// Extract admin UUID from request user
const getAdminUuid = (user) =>
  user?.adminUuid || user?.userUuid || user?.admin_uuid || user?.user_uuid || null;

function normalizeAssignment(row) {
  return {
    id: row.id,
    membershipId: row.id,
    userId: row.userId || row.user_id_resolved || null,
    username: row.member_name || row.username || null,
    userEmail: row.member_email || row.user_email || null,
    userMobile: row.member_mobile || row.user_mobile || null,
    userWeight: (row.member_weight !== null && row.member_weight !== undefined) ? row.member_weight : null,
    memberId: row.memberId || row.member_id || null,
    gymMemberId: row.member_db_id || null,
    planId: row.planId || row.plan_id || null,
    planName: row.planName || row.plan_name || null,
    planDuration: row.duration || row.plan_duration || null,
    planStartDate: row.startDate || row.plan_start_date || null,
    planEndDate: row.endDate || row.plan_end_date || null,
    planPrice: row.pricePaid || row.plan_price || null,
    trainerId: row.trainerId || row.trainer_id || null,
    trainerName: row.trainerName || row.trainer_name || null,
    trainerSource: row.trainer_source || 'staff',
    sessionTime: row.session_time || null,
    status: row.status,
    updatedAt: row.updatedAt || row.updated_at || null,
  };
}

async function getAllAssignments(req, res) {
  try {
    const { trainerUserId } = req.query;
    let staffIdForFilter = null;

    if (trainerUserId) {
      staffIdForFilter = await resolveTrainerStaffId(trainerUserId);
      if (!staffIdForFilter) {
        console.warn('[assignments] Could not resolve staff for trainerUserId:', trainerUserId);
        return res.json([]);
      }
      console.log('[assignments] Resolved trainerUserId to staff.id:', staffIdForFilter);
    }

    const isSuperAdmin = req.user && String(req.user.role || '').toLowerCase() === 'super admin';
    const adminUuid = getAdminUuid(req.user);

    let sql = `
      SELECT m.*, 
             u.id AS user_id_resolved,
             u.username,
             u.email AS user_email,
             u.mobile AS user_mobile,
             gm.name AS member_name,
             gm.phone AS member_mobile,
             gm.email AS member_email,
             s.name AS trainer_name,
             s.role AS trainer_source,
             s.employee_id AS trainer_employee_id
      FROM memberships m
      LEFT JOIN users u ON m.userId = u.id OR (m.userId IS NULL AND LOWER(TRIM(m.member_email)) = LOWER(TRIM(u.email)))
      LEFT JOIN members gm ON m.memberId = gm.id
      LEFT JOIN staff s ON m.trainerId = s.id
    `;

    const whereConditions = ['m.trainerId IS NOT NULL'];
    const queryParams = [];

    if (staffIdForFilter) {
      whereConditions.push('m.trainerId = ?');
      queryParams.push(staffIdForFilter);
    }

    if (!isSuperAdmin && req.user) {
      if (adminUuid) {
        whereConditions.push('(m.created_by = ? OR m.created_by IS NULL)');
        queryParams.push(adminUuid);
      }
    }

    if (whereConditions.length > 0) {
      sql += ' WHERE ' + whereConditions.join(' AND ');
    }

    sql += ' ORDER BY m.updatedAt DESC';

    const [rows] = await db.query(sql, queryParams);
    console.log('[assignments] returning', rows.length, 'rows for staffId:', staffIdForFilter);
    res.json(rows.map(normalizeAssignment));
  } catch (err) {
    console.error('getAllAssignments error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function upsertAssignments(req, res) {
  try {
    const { assignments } = req.body;
    if (!Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({ error: 'No assignments provided' });
    }

    const errors = [];

    for (const a of assignments) {
      let resolvedUserId = a.userId ? Number(a.userId) : null;
      if (resolvedUserId && Number.isNaN(resolvedUserId)) {
        resolvedUserId = null;
      }

      if (resolvedUserId) {
        const [userRows] = await db.query('SELECT id FROM users WHERE id = ?', [resolvedUserId]);
        if (userRows.length === 0) {
          const [memberRows] = await db.query(
            'SELECT id FROM members WHERE id = ? OR member_id = ? LIMIT 1',
            [resolvedUserId, resolvedUserId]
          );
          if (memberRows.length === 0) {
            resolvedUserId = null;
          }
        }
      }

      if (!resolvedUserId && a.memberId) {
        const numericMemberId = Number(a.memberId);
        if (!Number.isNaN(numericMemberId)) {
          const [memberRows] = await db.query(
            'SELECT id FROM members WHERE id = ? OR member_id = ? LIMIT 1',
            [numericMemberId, numericMemberId]
          );
          if (memberRows.length > 0) {
            resolvedUserId = memberRows[0].id;
            console.log('[assignments] Resolved userId from memberId:', resolvedUserId);
          }
        }
      }

      if (!resolvedUserId && a.userEmail) {
        try {
          const [userRows] = await db.query(
            'SELECT id FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM(?)) LIMIT 1',
            [a.userEmail]
          );
          if (userRows.length > 0) {
            resolvedUserId = userRows[0].id;
            console.log('[assignments] Resolved userId from email:', resolvedUserId, 'for', a.userEmail);
          }
        } catch (queryErr) {
          console.warn('[assignments] Error resolving user from email:', queryErr.message);
        }
      }

      const numericTrainerId = a.trainerId ? Number(a.trainerId) : null;
      let trainerEmployeeId = null;
      if (numericTrainerId) {
        try {
          const [staffRows] = await db.query('SELECT employee_id, name FROM staff WHERE id = ?', [numericTrainerId]);
          if (staffRows.length > 0) {
            trainerEmployeeId = staffRows[0].employee_id;
            if (staffRows[0].name && !a.trainerName) {
              a.trainerName = staffRows[0].name;
            }
          }
        } catch (queryErr) {
          console.warn('[assignments] Error fetching trainer info:', queryErr.message);
        }
      }

      if (!a.membershipId && !resolvedUserId && !a.memberId) {
        errors.push(`Cannot assign trainer for member ${a.username || a.userEmail || 'unknown'}: no valid identifier provided.`);
        continue;
      }

      let sqlMemberships;
      let membershipParams;
      if (a.membershipId) {
        sqlMemberships = `
          UPDATE memberships
          SET trainerId = ?,
              trainerName = ?,
              trainerEmployeeId = ?
          WHERE id = ?
        `;
        membershipParams = [
          numericTrainerId,
          a.trainerName || null,
          trainerEmployeeId || null,
          Number(a.membershipId),
        ];
      } else if (resolvedUserId && a.planId) {
        sqlMemberships = `
          UPDATE memberships
          SET trainerId = ?,
              trainerName = ?,
              trainerEmployeeId = ?
          WHERE userId = ? AND planId = ?
        `;
        membershipParams = [
          numericTrainerId,
          a.trainerName || null,
          trainerEmployeeId || null,
          resolvedUserId,
          Number(a.planId),
        ];
      } else if (a.memberId && a.planId) {
        sqlMemberships = `
          UPDATE memberships
          SET trainerId = ?,
              trainerName = ?,
              trainerEmployeeId = ?
          WHERE memberId = ? AND planId = ?
        `;
        membershipParams = [
          numericTrainerId,
          a.trainerName || null,
          trainerEmployeeId || null,
          Number(a.memberId),
          Number(a.planId),
        ];
      } else {
        errors.push(`Cannot assign trainer for member ${a.username || a.userEmail || 'unknown'}: missing plan or membership information.`);
        continue;
      }

      try {
        const [result] = await db.query(sqlMemberships, membershipParams);
        if (!result || result.affectedRows === 0) {
          errors.push(`No matching membership updated for ${a.username || a.userEmail || a.memberId || a.membershipId || 'unknown'}`);
          continue;
        }
        console.log('[assignments] Updated memberships:', result.affectedRows, 'rows for',
          a.membershipId ? `membershipId=${a.membershipId}` : a.memberId ? `memberId=${a.memberId}` : `userId=${resolvedUserId}`,
          'planId=', Number(a.planId), 'trainerId=', numericTrainerId);
      } catch (queryErr) {
        console.warn('[assignments] Warning - failed to update memberships table:', queryErr.message);
        errors.push(`Failed to update membership for ${a.username || a.userEmail || a.memberId || a.membershipId || 'unknown'}: ${queryErr.message}`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Some assignments failed', details: errors });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('upsertAssignments error', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

module.exports = {
  getAllAssignments,
  upsertAssignments,
};
