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
    userId: row.user_id,
    username: row.member_name || row.username,
    userEmail: row.member_email || row.user_email,
    userMobile: row.member_mobile || row.user_mobile,
    userWeight: (row.member_weight !== null && row.member_weight !== undefined) ? row.member_weight : null,
    gymMemberId: row.member_db_id || null,
    planId: row.plan_id,
    planName: row.plan_name,
    planDuration: row.plan_duration,
    planStartDate: row.plan_start_date,
    planEndDate: row.plan_end_date,
    planPrice: row.plan_price,
    trainerId: row.trainer_id,
    trainerName: row.current_trainer_name || row.trainer_name,
    trainerSource: row.trainer_source,
    sessionTime: row.session_time || null,
    status: row.status,
    updatedAt: row.updated_at,
  };
}

async function getAllAssignments(req, res) {
  try {
    const { trainerUserId } = req.query;
    let staffIdForFilter = null;

    // If called by a trainer (dashboard), resolve their users.id → staff.id
    if (trainerUserId) {
      staffIdForFilter = await resolveTrainerStaffId(trainerUserId);
      if (!staffIdForFilter) {
        console.warn('[assignments] Could not resolve staff for trainerUserId:', trainerUserId);
        return res.json([]);
      }
      console.log('[assignments] Resolved trainerUserId to staff.id:', staffIdForFilter);
    }

    // Build the main query
    let sql = `
      SELECT a.*,
             m.id as member_db_id,
             m.name as member_name,
             m.email as member_email,
             m.phone as member_mobile,
             m.weight as member_weight,
             s.name as current_trainer_name,
             s.role as trainer_source
      FROM trainer_assignments a
      LEFT JOIN users u ON u.id = a.user_id
      LEFT JOIN members m ON (m.email = u.email AND m.email IS NOT NULL AND m.email != '') 
                              OR (m.phone = u.mobile AND m.phone IS NOT NULL AND m.phone != '')
      LEFT JOIN staff s ON s.id = a.trainer_id
    `;
    const whereConditions = [];
    const queryParams = [];

    // If trainer is filtering for their own assignments
    if (staffIdForFilter) {
      whereConditions.push('a.trainer_id = ?');
      queryParams.push(staffIdForFilter);
    }

    // Check if user is super admin
    const isSuperAdmin = req.user && String(req.user.role || '').toLowerCase() === 'super admin';

    // If not super admin and not filtering by trainer, filter by created_by (admin_uuid)
    if (!isSuperAdmin && req.user && !staffIdForFilter) {
      const adminUuid = getAdminUuid(req.user);
      if (adminUuid) {
        whereConditions.push('(a.created_by = ? OR a.created_by IS NULL)');
        queryParams.push(adminUuid);
      }
    }

    // Build WHERE clause
    if (whereConditions.length > 0) {
      sql += ' WHERE ' + whereConditions.join(' AND ');
    }

    sql += ' GROUP BY a.id ORDER BY a.updated_at DESC';

    const [rows] = await db.query(sql, queryParams);
    console.log('[assignments] returning', rows.length, 'rows for staffId:', staffIdForFilter);
    res.json(rows.map(normalizeAssignment));
  } catch (err) {
    console.error('getAllAssignments error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

// accepts { assignments: [ {userId, planId, planName,..., trainerId, trainerName, trainerSource, status} ] }
async function upsertAssignments(req, res) {
  try {
    const { assignments } = req.body;
    if (!Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({ error: 'No assignments provided' });
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      for (const a of assignments) {
        // Validate userId is numeric
        if (!a.userId || isNaN(a.userId)) {
          console.error('[assignments] Invalid userId:', a.userId, 'for user', a.username);
          throw new Error(`Invalid userId: ${a.userId} for user ${a.username}`);
        }

        // Get trainer employee_id from staff table
        let trainerEmployeeId = null;
        const numericTrainerId = a.trainerId ? Number(a.trainerId) : null;
        
        if (numericTrainerId) {
          const [staffRows] = await connection.query(
            'SELECT employee_id, name FROM staff WHERE id = ?',
            [numericTrainerId]
          );
          if (staffRows.length > 0) {
            trainerEmployeeId = staffRows[0].employee_id;
            // Update trainerName with actual staff name if available
            if (staffRows[0].name && !a.trainerName) {
              a.trainerName = staffRows[0].name;
            }
          }
        }

        // Insert/update trainer_assignments table
        const params = [
          Number(a.userId),
          a.username || null,
          a.userEmail || null,
          Number(a.planId) || null,
          a.planName || null,
          a.planDuration || null,
          a.planStartDate || null,
          a.planEndDate || null,
          a.planPrice || null,
          numericTrainerId,
          a.trainerName || null,
          a.trainerSource || 'unknown',
          a.sessionTime || null,
          a.status || 'active',
        ];

        const createdBy = getActorUuid(req.user) || null;
        const params_with_audit = [...params, createdBy, createdBy, createdBy];

        const sqlAssignments = `
          INSERT INTO trainer_assignments
          (user_id, username, user_email, plan_id, plan_name, plan_duration, plan_start_date, plan_end_date, plan_price, trainer_id, trainer_name, trainer_source, session_time, status, created_by, updated_by)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
          ON DUPLICATE KEY UPDATE
            username=VALUES(username),
            user_email=VALUES(user_email),
            plan_name=VALUES(plan_name),
            plan_duration=VALUES(plan_duration),
            plan_start_date=VALUES(plan_start_date),
            plan_end_date=VALUES(plan_end_date),
            plan_price=VALUES(plan_price),
            trainer_id=VALUES(trainer_id),
            trainer_name=VALUES(trainer_name),
            trainer_source=VALUES(trainer_source),
            session_time=VALUES(session_time),
            status=VALUES(status),
            updated_by=VALUES(updated_by),
            updated_at=CURRENT_TIMESTAMP
        `;

        await connection.query(sqlAssignments, params_with_audit);

        // Also update memberships table with trainer info
        if (a.planId) {
          const membershipParams = [
            numericTrainerId,
            a.trainerName || null,
            trainerEmployeeId || null,
            Number(a.userId),
            Number(a.planId),
          ];

          const sqlMemberships = `
            UPDATE memberships
            SET trainerId = ?,
                trainerName = ?,
                trainerEmployeeId = ?
            WHERE userId = ? AND planId = ?
          `;

          const result = await connection.query(sqlMemberships, membershipParams);
          console.log('[assignments] Updated memberships:', result[0].affectedRows, 'rows for userId=', Number(a.userId), 'planId=', Number(a.planId), 'trainerId=', numericTrainerId);
        }
      }

      await connection.commit();
      res.json({ success: true });
    } catch (err) {
      await connection.rollback();
      console.error('upsertAssignments error', err);
      res.status(500).json({ error: 'Failed to save assignments' });
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('upsertAssignments outer error', err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = {
  getAllAssignments,
  upsertAssignments,
};
