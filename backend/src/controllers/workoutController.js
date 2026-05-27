const db = require('../config/db');
const { getActorUuid } = require('../utils/auditTrail');

// NOTE: use getActorUuid(req.user) from utils/auditTrail for actor UUID

function isNumeric(value) {
  return typeof value === 'number' || (/^\d+$/.test(String(value || '').trim()));
}

async function resolveMemberTable() {
  const [memberRows] = await db.query("SHOW TABLES LIKE 'members'");
  if (memberRows.length > 0) return 'members';
  const [gymRows] = await db.query("SHOW TABLES LIKE 'gym_members'");
  if (gymRows.length > 0) return 'gym_members';
  return 'members';
}

async function normalizeTrainerId(trainerId) {
  if (!trainerId) return null;
  const requested = String(trainerId).trim();
  if (isNumeric(requested)) {
    const [staffRows] = await db.query(
      'SELECT employee_id FROM staff WHERE id = ? LIMIT 1',
      [requested]
    );
    if (staffRows.length > 0 && staffRows[0].employee_id) {
      return staffRows[0].employee_id;
    }
  }
  return requested;
}

async function resolveTrainerDetails(trainerId, trainerName) {
  if (!trainerId) {
    return { trainerUuid: null, trainerName };
  }

  const requested = String(trainerId).trim();
  const [staffRows] = await db.query(
    'SELECT id, employee_id, name FROM staff WHERE id = ? OR employee_id = ? LIMIT 1',
    [requested, requested]
  );

  if (staffRows.length === 0) {
    // Do not throw for numeric or string trainer identifiers here.
    // If staff not found, treat the requested value as the trainer identifier (UUID/string)
    // This keeps backward compatibility with systems that pass UUIDs or non-staff identifiers.
    return { trainerUuid: requested, trainerName };
  }

  const staff = staffRows[0];
  return {
    trainerUuid: staff.employee_id || String(staff.id),
    trainerName: trainerName || staff.name || null,
  };
}

async function resolveMemberDetails(memberId, memberName, memberEmail, memberMobile, userId = null) {
  if (!memberId && !userId) {
    return {
      memberUuid: null,
      memberName,
      memberEmail,
      memberMobile,
      userId: null,
    };
  }

  if (memberId) {
    const requested = String(memberId).trim();
    const [memberRows] = await db.query(
      'SELECT id, member_id, name, email, phone FROM members WHERE id = ? OR member_id = ? LIMIT 1',
      [requested, requested]
    );

    if (memberRows.length > 0) {
      const member = memberRows[0];
      return {
        memberUuid: member.member_id || String(member.id),
        memberName: memberName || member.name || null,
        memberEmail: memberEmail || member.email || null,
        memberMobile: memberMobile || member.phone || null,
        userId: member.id,
      };
    }

    if (isNumeric(requested)) {
      const [membershipRows] = await db.query(
        'SELECT memberId, userId FROM memberships WHERE id = ? LIMIT 1',
        [requested]
      );
      if (membershipRows.length > 0) {
        const membership = membershipRows[0];
        if (membership.memberId) {
          const [memberRowsByMemberId] = await db.query(
            'SELECT id, member_id, name, email, phone FROM members WHERE id = ? OR member_id = ? LIMIT 1',
            [membership.memberId, membership.memberId]
          );
          if (memberRowsByMemberId.length > 0) {
            const member = memberRowsByMemberId[0];
            return {
              memberUuid: member.member_id || String(member.id),
              memberName: memberName || member.name || null,
              memberEmail: memberEmail || member.email || null,
              memberMobile: memberMobile || member.phone || null,
              userId: member.id,
            };
          }
        }
        if (membership.userId) {
          return {
            memberUuid: null,
            memberName,
            memberEmail,
            memberMobile,
            userId: membership.userId,
          };
        }
      }
      throw new Error('Invalid memberId for workout');
    }

    return {
      memberUuid: requested,
      memberName,
      memberEmail,
      memberMobile,
      userId: userId || null,
    };
  }

  return {
    memberUuid: null,
    memberName,
    memberEmail,
    memberMobile,
    userId: userId || null,
  };
}

// helper to parse JSON columns
function parseWorkout(row) {
  if (!row) return row;
  return {
    ...row,
    days:
      typeof row.days === 'string' ? JSON.parse(row.days || '{}') : row.days,
  };
}

function getWorkoutExpiry(row) {
  const createdAt = new Date(row.created_at || row.createdAt || null);
  if (Number.isNaN(createdAt.getTime())) return null;
  const weeks = Number(row.duration_weeks || row.durationWeeks || 1) || 1;
  return new Date(createdAt.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);
}

async function getAllWorkouts(req, res) {
  try {
    let sql = 'SELECT * FROM workout_programs WHERE 1=1';
    const params = [];

    const userRole = String(req.user?.role || '').toLowerCase();
    console.log('[getAllWorkouts] user:', { role: userRole, userId: req.user?.id, admin_id: req.user?.admin_id, user_uuid: req.user?.user_uuid, adminUuid: getActorUuid(req.user) });

    // Check if user is super admin
    const isSuperAdmin = ['super admin', 'superadmin'].includes(userRole);

    // If requester is super admin, shows all
    if (isSuperAdmin) {
      // No filter for super admin
    }
    // If requester is admin, filter by admin_uuid or admin_id
    else if (userRole === 'admin') {
      const adminUuid = getActorUuid(req.user);
      const adminId = req.user.admin_id || req.user.userId || req.user.id || req.user.user_id || null;
      const memberTable = await resolveMemberTable();

      if (adminUuid && adminId) {
        const memberSubquery = `member_id COLLATE utf8mb4_general_ci IN (
          SELECT COALESCE(member_id COLLATE utf8mb4_general_ci, CAST(id AS CHAR COLLATE utf8mb4_general_ci))
          FROM ${memberTable}
          WHERE created_by COLLATE utf8mb4_general_ci = ? OR user_id = CAST(? AS UNSIGNED)
        )`;
        sql += ` AND (${memberSubquery} OR created_by COLLATE utf8mb4_general_ci = ? OR admin_id = CAST(? AS UNSIGNED))`;
        params.push(adminUuid, adminId, adminUuid, adminId);
      } else if (adminId) {
        const memberSubquery = `member_id COLLATE utf8mb4_general_ci IN (
          SELECT COALESCE(member_id COLLATE utf8mb4_general_ci, CAST(id AS CHAR COLLATE utf8mb4_general_ci))
          FROM ${memberTable}
          WHERE user_id = CAST(? AS UNSIGNED)
        )`;
        sql += ` AND (${memberSubquery} OR admin_id = CAST(? AS UNSIGNED))`;
        params.push(adminId, adminId);
      } else if (adminUuid) {
        const memberSubquery = `member_id COLLATE utf8mb4_general_ci IN (
          SELECT COALESCE(member_id COLLATE utf8mb4_general_ci, CAST(id AS CHAR COLLATE utf8mb4_general_ci))
          FROM ${memberTable}
          WHERE created_by COLLATE utf8mb4_general_ci = ?
        )`;
        sql += ` AND (${memberSubquery} OR created_by COLLATE utf8mb4_general_ci = ?)`;
        params.push(adminUuid, adminUuid);
      }
    }
    // If requester is a member, show only workouts assigned to them
    else if (userRole === 'user' || userRole === 'member') {
      const requestUserId = req.user?.id || req.user?.userId || req.user?.user_id || null;
      const userEmail = req.user?.email || '';
      const userPhone = req.user?.phone || req.user?.mobile || '';

      const [memberRows] = await db.query(
        'SELECT id, member_id FROM members WHERE email COLLATE utf8mb4_general_ci = ? OR phone COLLATE utf8mb4_general_ci = ? LIMIT 1',
        [userEmail, userPhone]
      );

      if (memberRows.length > 0) {
        const member = memberRows[0];
        const memberIdValue = member.id;
        const memberUuidValue = member.member_id || member.id;

        sql += ' AND (member_id COLLATE utf8mb4_general_ci = ? OR member_id COLLATE utf8mb4_general_ci = ?';
        params.push(memberIdValue, memberUuidValue);

        if (requestUserId) {
          sql += ' OR user_id = ?';
          params.push(requestUserId);
        }

        sql += ')';
      } else if (requestUserId) {
        sql += ' AND (user_id = ? OR member_id COLLATE utf8mb4_general_ci = ?)';
        params.push(requestUserId, requestUserId);
      } else {
        sql += ' AND 0';
      }
    }

    if (req.query.trainerId) {
      const trainerUuid = await normalizeTrainerId(req.query.trainerId);
      sql += ' AND trainer_id = ?';
      params.push(trainerUuid);
    }

    sql += ' ORDER BY created_at DESC';

    console.log('[getAllWorkouts] SQL:', sql);
    console.log('[getAllWorkouts] params:', params);
    const [rows] = await db.query(sql, params);
    console.log('[getAllWorkouts] returning:', rows.length, 'rows');
    res.json(rows.map(parseWorkout));
  } catch (err) {
    console.error('getAllWorkouts error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function getWorkoutById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM workout_programs WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Workout not found' });
    }
    res.json(parseWorkout(rows[0]));
  } catch (err) {
    console.error('getWorkoutById error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function createWorkout(req, res) {
  try {
    const {
      trainerId,
      trainerName,
      trainerSource,
      memberId,
      userId,
      memberName,
      memberEmail,
      memberMobile,
      category,
      level,
      goal,
      durationWeeks,
      days,
      status,
    } = req.body;

    const requestedTrainerId = trainerId || req.body.trainer_id || null;
    const requestedMemberId = memberId || req.body.member_id || null;

    const trainerDetails = await resolveTrainerDetails(requestedTrainerId, trainerName);
    const memberDetails = await resolveMemberDetails(requestedMemberId, memberName, memberEmail, memberMobile, userId || req.body.user_id || null);

    const membersQuery = [];
    const membersParams = [];
    if (memberDetails.memberUuid) {
      membersQuery.push('member_id = ?');
      membersParams.push(memberDetails.memberUuid);
    }
    if (memberDetails.userId) {
      membersQuery.push('user_id = ?');
      membersParams.push(memberDetails.userId);
    }

    if (membersQuery.length > 0) {
      const [existing] = await db.query(
        `SELECT * FROM workout_programs WHERE (${membersQuery.join(' OR ')}) AND status = 'active'`,
        membersParams
      );
      const now = Date.now();
      for (const workout of existing) {
        const expiry = getWorkoutExpiry(workout);
        if (expiry && expiry.getTime() > now) {
          return res.status(400).json({
            error: 'This member already has an active workout schedule. Add a new workout only after the current duration completes.',
          });
        }
      }
    }

    const adminId = req.user?.role === 'admin' ? req.user.userId : null;
    const auditActor = trainerDetails.trainerUuid || getActorUuid(req.user) || null;

    const [result] = await db.query(
      `INSERT INTO workout_programs
      (trainer_id, trainer_name, trainer_source,
       member_id, member_name, member_email, member_mobile,
       category, level, goal,
       duration_weeks, days, status, user_id, admin_id, created_by, updated_by)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        trainerDetails.trainerUuid,
        trainerDetails.trainerName || null,
        trainerSource || null,
        memberDetails.memberUuid,
        memberDetails.memberName || null,
        memberDetails.memberEmail || null,
        memberDetails.memberMobile || null,
        category || null,
        level || null,
        goal || null,
        durationWeeks ? Number(durationWeeks) : null,
        JSON.stringify(days || {}),
        status || 'active',
        memberDetails.userId || null,
        adminId,
        auditActor,
        auditActor,
      ]
    );

    const [rows] = await db.query('SELECT * FROM workout_programs WHERE id = ?', [result.insertId]);
    res.json(parseWorkout(rows[0]));
  } catch (err) {
    console.error('createWorkout error', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function updateWorkout(req, res) {
  try {
    const { id } = req.params;
    const {
      trainerId,
      trainerName,
      trainerSource,
      memberId,
      userId,
      memberName,
      memberEmail,
      memberMobile,
      category,
      level,
      goal,
      durationWeeks,
      days,
      status,
    } = req.body;

    const requestedTrainerId = trainerId || req.body.trainer_id || null;
    const requestedMemberId = memberId || req.body.member_id || null;

    const trainerDetails = await resolveTrainerDetails(requestedTrainerId, trainerName);
    const memberDetails = await resolveMemberDetails(requestedMemberId, memberName, memberEmail, memberMobile, userId || req.body.user_id || null);

    const updatedBy = trainerDetails.trainerUuid || getActorUuid(req.user) || null;

    const [result] = await db.query(
      `UPDATE workout_programs SET
        trainer_id=?, trainer_name=?, trainer_source=?,
        member_id=?, member_name=?, member_email=?, member_mobile=?,
        category=?, level=?, goal=?,
        duration_weeks=?, days=?, status=?, user_id=?,
        updated_by=?, updated_at=CURRENT_TIMESTAMP
       WHERE id=?`,
      [
        trainerDetails.trainerUuid,
        trainerDetails.trainerName || null,
        trainerSource || null,
        memberDetails.memberUuid,
        memberDetails.memberName || null,
        memberDetails.memberEmail || null,
        memberDetails.memberMobile || null,
        category || null,
        level || null,
        goal || null,
        durationWeeks ? Number(durationWeeks) : null,
        JSON.stringify(days || {}),
        status || 'active',
        memberDetails.userId || null,
        updatedBy,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    const [rows] = await db.query('SELECT * FROM workout_programs WHERE id = ?', [id]);
    res.json(parseWorkout(rows[0]));
  } catch (err) {
    console.error('updateWorkout error', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function deleteWorkout(req, res) {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM workout_programs WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Workout not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('deleteWorkout error', err);
    res.status(500).json({ error: 'Delete failed' });
  }
}

module.exports = {
  getAllWorkouts,
  getWorkoutById,
  createWorkout,
  updateWorkout,
  deleteWorkout,
};