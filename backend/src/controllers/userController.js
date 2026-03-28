const db = require('../config/db');

async function getAllUsers(req, res) {
  try {
    const [rows] = await db.query('SELECT id, username, email, mobile, role, created_at FROM users ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('getAllUsers error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function getUserById(req, res) {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);

    const [rows] = await db.query(
      'SELECT id, username, email, mobile, role, created_at FROM users WHERE id = ?',
      [idNum]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('getUserById error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function updateUserRole(req, res) {
  try {
    const { id } = req.params;
    const { role, username, mobile } = req.body;
    const idNum = parseInt(id, 10);

    if (isNaN(idNum)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const updates = [];
    const params = [];

    if (role !== undefined && role !== null && role !== '') {
      const validRoles = ['admin', 'super admin', 'trainer', 'staff', 'member'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: `Invalid role '${role}'. Must be one of: ${validRoles.join(', ')}` });
      }
      updates.push('role = ?');
      params.push(role);
    }

    if (username !== undefined && username !== null && username !== '') {
      updates.push('username = ?');
      params.push(username);
    }

    if (mobile !== undefined && mobile !== null && mobile !== '') {
      updates.push('mobile = ?');
      params.push(mobile);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    params.push(idNum);

    const sql = `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    const [result] = await db.query(sql, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [rows] = await db.query(
      'SELECT id, username, email, mobile, role, created_at FROM users WHERE id = ?',
      [idNum]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error('updateUserRole error', err);
    res.status(500).json({ error: 'Update failed' });
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  updateUserRole,
};
