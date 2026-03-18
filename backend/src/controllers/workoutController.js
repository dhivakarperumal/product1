const db = require('../config/db');

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
    let sql = 'SELECT * FROM workout_programs';
    const params = [];

    if (req.query.trainerId) {
      sql += ' WHERE trainer_id = ?';
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

    const [result] = await db.query(
      `INSERT INTO workout_programs
      (trainer_id, trainer_name, trainer_source,
       member_id, member_name, member_email, member_mobile,
       category, level, goal,
       duration_weeks, days, status, user_id)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
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

    const [result] = await db.query(
      `UPDATE workout_programs SET
        trainer_id=?, trainer_name=?, trainer_source=?,
        member_id=?, member_name=?, member_email=?, member_mobile=?,
        category=?, level=?, goal=?,
        duration_weeks=?, days=?, status=?, user_id=?,
        updated_at=CURRENT_TIMESTAMP
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