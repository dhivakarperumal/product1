const db = require('../config/db');

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

    let staffId = null;

    // If called by a trainer, resolve their users.id → staff.id
    if (trainerUserId) {
      const [userRows] = await db.query(
        'SELECT id, email, username FROM users WHERE id = ?',
        [trainerUserId]
      );

      if (userRows.length === 0) {
        // User not found — return nothing
        return res.json([]);
      }

      const u = userRows[0];
      console.log('[assignments] resolving trainer user:', u.id, u.email, u.username);

      // Find matching staff record by email or username
      const [staffRows] = await db.query(
        'SELECT id, name FROM staff WHERE email = ? OR username = ? LIMIT 1',
        [u.email, u.username]
      );

      console.log('[assignments] staff match:', staffRows.length, staffRows[0]);

      if (staffRows.length > 0) {
        staffId = staffRows[0].id;
      } else {
        // staffId couldn't be resolved — return empty to avoid leaking all assignments
        console.warn('[assignments] Could not resolve staff for user', u.id, '- returning empty');
        return res.json([]);
      }
    }

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
      LEFT JOIN gym_members m ON (m.email = u.email AND m.email IS NOT NULL AND m.email != '') 
                              OR (m.phone = u.mobile AND m.phone IS NOT NULL AND m.phone != '')
      LEFT JOIN staff s ON s.id = a.trainer_id
    `;
    const params = [];

    if (staffId) {
      sql += ' WHERE a.trainer_id = ?';
      params.push(staffId);
    }

    sql += ' GROUP BY a.id ORDER BY a.updated_at DESC';

    const [rows] = await db.query(sql, params);
    console.log('[assignments] returning', rows.length, 'rows for staffId', staffId);
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
        // simple upsert using unique(user_id, plan_id)
        const params = [
          a.userId,
          a.username || null,
          a.userEmail || null,
          a.planId || null,
          a.planName || null,
          a.planDuration || null,
          a.planStartDate || null,
          a.planEndDate || null,
          a.planPrice || null,
          a.trainerId,
          a.trainerName || null,
          a.trainerSource || 'unknown',
          a.sessionTime || null,
          a.status || 'active',
        ];

        const sql = `
          INSERT INTO trainer_assignments
          (user_id, username, user_email, plan_id, plan_name, plan_duration, plan_start_date, plan_end_date, plan_price, trainer_id, trainer_name, trainer_source, session_time, status)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
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
            updated_at=CURRENT_TIMESTAMP
        `;

        await connection.query(sql, params);
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
