const db = require('../config/db');

// Extract admin UUID from request user
const getAdminUuid = (user) =>
  user?.adminUuid || user?.userUuid || user?.admin_uuid || user?.user_uuid || null;

// helper to parse JSON columns
function parseWorkout(row) {
  if (!row) return row;
  return {
    ...row,
    days:
      typeof row.days === 'string' ? JSON.parse(row.days || '{}') : row.days,
  };
}

async function getAllWorkouts(req, res) {
  try {
    let sql = 'SELECT * FROM workout_programs WHERE 1=1';
    const params = [];

    // Check if user is super admin
    const isSuperAdmin = req.user && String(req.user.role || '').toLowerCase() === 'super admin';

    // If requester is super admin, shows all
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
    // If requester is a member, show only workouts assigned to them
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

    const adminId = req.user?.role === 'admin' ? req.user.userId : null;
    const createdBy = getAdminUuid(req.user) || null;

    const [result] = await db.query(
      `INSERT INTO workout_programs
      (trainer_id, trainer_name, trainer_source,
       member_id, member_name, member_email, member_mobile,
       category, level, goal,
       duration_weeks, days, status, user_id, admin_id, created_by, updated_by)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        trainerId,
        trainerName || null,
        trainerSource || null,
        memberId,
        memberName || null,
        memberEmail || null,
        memberMobile || null,
        category || null,
        level || null,
        goal || null,
        durationWeeks ? Number(durationWeeks) : null,
        JSON.stringify(days || {}),
        status || 'active',
        memberId || null,
        adminId,
        createdBy,
        createdBy,
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

    // Get admin UUID for updated_by field
    const updatedBy = getAdminUuid(req.user) || null;

    const [result] = await db.query(
      `UPDATE workout_programs SET
        trainer_id=?, trainer_name=?, trainer_source=?,
        member_id=?, member_name=?, member_email=?, member_mobile=?,
        category=?, level=?, goal=?,
        duration_weeks=?, days=?, status=?, user_id=?,
        updated_by=?, updated_at=CURRENT_TIMESTAMP
       WHERE id=?`,
      [
        trainerId,
        trainerName || null,
        trainerSource || null,
        memberId,
        memberName || null,
        memberEmail || null,
        memberMobile || null,
        category || null,
        level || null,
        goal || null,
        durationWeeks ? Number(durationWeeks) : null,
        JSON.stringify(days || {}),
        status || 'active',
        memberId || null,
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