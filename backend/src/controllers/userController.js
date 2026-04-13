const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { getActorUuid } = require('../utils/auditTrail');

const validRoles = ['admin', 'super admin', 'trainer', 'staff', 'member'];

const canManageUser = async (currentUser, targetUserId) => {
  if (currentUser.role === 'super admin') {
    return true;
  }

  if (currentUser.role === 'admin') {
    const [rows] = await db.query('SELECT admin_id, admin_uuid FROM users WHERE id = ?', [targetUserId]);
    if (rows.length === 0) return false;
    const targetAdminUuid = rows[0].admin_uuid;
    if (currentUser.userUuid && targetAdminUuid) {
      return targetAdminUuid === currentUser.userUuid || targetUserId === currentUser.userId;
    }
    return rows[0].admin_id === currentUser.userId || targetUserId === currentUser.userId;
  }

  return false;
};

async function createUser(req, res) {
  try {
    const { username, email, mobile, password, role } = req.body;
    const normalizedRole = (role || 'member').toLowerCase();

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required', message: 'Email and password are required' });
    }

    if (!validRoles.includes(normalizedRole)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}`, message: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    if (req.user.role === 'admin' && ['admin', 'super admin'].includes(normalizedRole)) {
      return res.status(403).json({ error: 'Admin cannot create other admin or super admin accounts', message: 'Admin cannot create other admin or super admin accounts' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const tenantAdminId = req.user.role === 'admin' ? req.user.userId : null;
    const tenantAdminUuid = req.user.role === 'admin' ? req.user.userUuid : null;
    const subscriptionStatus = normalizedRole === 'admin'
      ? (req.body.subscription_status === 'active' ? 'active' : 'pending')
      : 'active';
    // Store admin UUID in created_by and updated_by for audit trail
    const createdByUuid = getActorUuid(req.user);
    const updatedByUuid = getActorUuid(req.user);

    const [result] = await db.query(
      `INSERT INTO users
         (email, password_hash, role, username, mobile, admin_id, admin_uuid, subscription_status, user_uuid, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, UUID(), ?, ?)`,
      [email, hashed, normalizedRole, username || null, mobile || null, tenantAdminId, tenantAdminUuid, subscriptionStatus, createdByUuid, updatedByUuid]
    );

    if (normalizedRole === 'admin' && req.user.role === 'super admin') {
      await db.query('UPDATE users SET admin_id = ?, admin_uuid = user_uuid WHERE id = ?', [result.insertId, result.insertId]);
    }

    const [rows] = await db.query(
      'SELECT id, user_uuid, username, email, mobile, role, subscription_status, subscription_plan, subscription_amount, subscription_start_date, created_at, updated_at, created_by, updated_by, admin_id, admin_uuid FROM users WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email or username already exists', message: 'Email or username already exists' });
    }
    console.error('createUser error', err);
    res.status(500).json({ error: 'Create user failed', message: 'Create user failed' });
  }
}

async function getAllUsers(req, res) {
  try {
    let rows;
    if (req.user.role === 'super admin') {
      [rows] = await db.query(
        'SELECT id, user_uuid, username, email, mobile, role, subscription_status, subscription_plan, subscription_amount, subscription_start_date, created_at, updated_at, created_by, updated_by, admin_id, admin_uuid FROM users ORDER BY created_at DESC'
      );
    } else if (req.user.role === 'admin') {
      [rows] = await db.query(
        `SELECT id, user_uuid, username, email, mobile, role, subscription_status, subscription_plan, subscription_amount, subscription_start_date, created_at, updated_at, created_by, updated_by, admin_id, admin_uuid
         FROM users WHERE admin_uuid = ? OR admin_id = ? OR id = ? ORDER BY created_at DESC`,
        [req.user.userUuid, req.user.userId, req.user.userId]
      );
    } else {
      return res.status(403).json({ error: 'Admin access required' });
    }
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
    if (isNaN(idNum)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    if (!(await canManageUser(req.user, idNum))) {
      return res.status(403).json({ error: 'Not authorized to view this user' });
    }

    const [rows] = await db.query(
      'SELECT id, user_uuid, username, email, mobile, role, subscription_status, created_at, updated_at, created_by, updated_by, admin_id, admin_uuid FROM users WHERE id = ?',
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

    if (!(await canManageUser(req.user, idNum))) {
      return res.status(403).json({ error: 'Not authorized to update this user' });
    }

    const updates = [];
    const params = [];

    if (role !== undefined && role !== null && role !== '') {
      const normalizedRole = role.toLowerCase();
      if (!validRoles.includes(normalizedRole)) {
        return res.status(400).json({ error: `Invalid role '${role}'. Must be one of: ${validRoles.join(', ')}` });
      }
      if (req.user.role === 'admin' && ['admin', 'super admin'].includes(normalizedRole)) {
        return res.status(403).json({ error: 'Admin cannot assign admin or super admin roles' });
      }
      updates.push('role = ?');
      params.push(normalizedRole);
    }

    if (username !== undefined && username !== null && username !== '') {
      updates.push('username = ?');
      params.push(username);
    }

    if (mobile !== undefined && mobile !== null && mobile !== '') {
      updates.push('mobile = ?');
      params.push(mobile);
    }

    if (req.body.subscription_status !== undefined && req.body.subscription_status !== null && req.body.subscription_status !== '') {
      const normalizedSubscription = String(req.body.subscription_status).toLowerCase();
      const validStates = ['active', 'pending', 'cancelled', 'expired'];
      if (!validStates.includes(normalizedSubscription)) {
        return res.status(400).json({ error: `Invalid subscription status. Must be one of: ${validStates.join(', ')}` });
      }
      const requesterRole = String(req.user?.role || '').toLowerCase();
      if (!['super admin', 'superadmin'].includes(requesterRole)) {
        return res.status(403).json({ error: 'Only super admin can update subscription status' });
      }
      updates.push('subscription_status = ?');
      params.push(normalizedSubscription);
    }

    if (req.body.subscription_plan !== undefined && req.body.subscription_plan !== null && req.body.subscription_plan !== '') {
      const validPlans = ['demo', '1month', '6month', '12month'];
      const plan = String(req.body.subscription_plan).toLowerCase();
      if (!validPlans.includes(plan)) {
        return res.status(400).json({ error: `Invalid subscription plan. Must be one of: ${validPlans.join(', ')}` });
      }
      updates.push('subscription_plan = ?');
      params.push(plan);
    }

    if (req.body.subscription_amount !== undefined && req.body.subscription_amount !== null && req.body.subscription_amount !== '') {
      const amount = parseFloat(req.body.subscription_amount);
      if (isNaN(amount) || amount < 0) {
        return res.status(400).json({ error: 'Invalid subscription amount. Must be a positive number' });
      }
      updates.push('subscription_amount = ?');
      params.push(amount);
    }

    if (req.body.subscription_start_date !== undefined && req.body.subscription_start_date !== null && req.body.subscription_start_date !== '') {
      const startDate = new Date(req.body.subscription_start_date);
      if (isNaN(startDate.getTime())) {
        return res.status(400).json({ error: 'Invalid subscription start date format' });
      }
      updates.push('subscription_start_date = ?');
      params.push(req.body.subscription_start_date);
    }

    let updatedBy = null;
    const requesterRole = String(req.user?.role || '').toLowerCase();
    if (['admin', 'super admin'].includes(requesterRole)) {
      // Store admin UUID in updated_by for audit trail
      updatedBy = getActorUuid(req.user);
    }

    if (updatedBy !== null) {
      updates.push('updated_by = ?');
      params.push(updatedBy);
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
      'SELECT id, username, email, mobile, role, subscription_status, subscription_plan, subscription_amount, subscription_start_date, created_at, admin_id FROM users WHERE id = ?',
      [idNum]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error('updateUserRole error', err.message);
    console.error(err.stack);
    res.status(500).json({ error: err.message || 'Update failed' });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);

    if (isNaN(idNum)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    if (!(await canManageUser(req.user, idNum))) {
      return res.status(403).json({ error: 'Not authorized to delete this user' });
    }

    const [result] = await db.query('DELETE FROM users WHERE id = ?', [idNum]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('deleteUser error', err);
    res.status(500).json({ error: 'Delete failed', details: err.message });
  }
}

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
};
