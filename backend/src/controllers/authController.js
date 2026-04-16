const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

let membersIdentifierColumnsCache = null;

function buildAuthPayload(user) {
  // For admins, adminUuid should be their own userUuid/user_uuid
  // For super admins, it might be stored as admin_uuid
  // For members, it's stored in created_by field
  const adminUuid = user.admin_uuid || user.user_uuid || user.userUuid || user.created_by || null;
  const contact = user.mobile || user.phone || null;
  
  return {
    userId: user.id || null,
    user_id: user.user_id || null,
    userUuid: user.user_uuid || user.userUuid || null,
    role: user.role,
    email: user.email,
    username: user.username || null,
    mobile: user.mobile || contact,
    phone: user.phone || contact,
    adminId: user.admin_id || null,
    adminUuid: adminUuid,  // For filtering - admin's own UUID or member's admin UUID
    subscriptionStatus: user.subscription_status || null,
  };
}

async function findSuperAdminByIdentifier(identifier) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM superadmins WHERE username = ? OR email = ?',
      [identifier, identifier]
    );
    return rows[0] || null;
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return null;
    }
    throw err;
  }
}

async function findAdminByIdentifier(identifier) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ? OR username = ? OR mobile = ?',
      [identifier, identifier, identifier]
    );
    return rows[0] || null;
  } catch (err) {
    throw err;
  }
}

async function getMembersIdentifierColumns() {
  if (membersIdentifierColumnsCache) {
    return membersIdentifierColumnsCache;
  }

  const [rows] = await pool.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'members'
       AND COLUMN_NAME IN ('email', 'username', 'mobile', 'phone')`
  );

  membersIdentifierColumnsCache = rows.map((row) => row.COLUMN_NAME);
  return membersIdentifierColumnsCache;
}

async function findMemberByIdentifier(identifier) {
  try {
    console.log('[DEBUG] findMemberByIdentifier called with:', identifier);
    const availableColumns = await getMembersIdentifierColumns();
    const searchColumns = ['email', 'username', 'mobile', 'phone'].filter((column) =>
      availableColumns.includes(column)
    );

    if (searchColumns.length === 0) {
      throw new Error(
        'Members table does not expose a supported identifier column. Add email, phone, username or mobile to the members schema.'
      );
    }

    const conditions = searchColumns.map((column) => `${column} = ?`).join(' OR ');
    const params = searchColumns.map(() => identifier);
    const [rows] = await pool.query(`SELECT * FROM members WHERE ${conditions}`, params);

    console.log('[DEBUG] findMemberByIdentifier found', rows.length, 'rows');
    if (rows[0]) {
      console.log('[DEBUG] First row email:', rows[0].email, 'role:', rows[0].role, 'phone:', rows[0].phone || rows[0].mobile);
    }
    logger.debug('findMemberByIdentifier(%s): found %d rows', identifier, rows.length);
    return rows[0] || null;
  } catch (err) {
    console.error('[DEBUG] findMemberByIdentifier error:', err.message);
    if (err.code === 'ER_NO_SUCH_TABLE') {
      logger.warn('members table not found');
      return null;
    }
    logger.error('findMemberByIdentifier error: %O', err);
    throw err;
  }
}

async function findMemberAuthByIdentifier(identifier) {
  try {
    console.log('[DEBUG] findMemberAuthByIdentifier called with:', identifier);
    const [rows] = await pool.query(
      'SELECT * FROM members_auth WHERE email = ? OR username = ? OR mobile = ? LIMIT 1',
      [identifier, identifier, identifier]
    );
    logger.debug('findMemberAuthByIdentifier(%s): found %d rows', identifier, rows.length);
    return rows[0] || null;
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') {
      logger.warn('members_auth table not found');
      return null;
    }
    throw err;
  }
}

async function updateMemberPasswordByIdentifier(identifier, password) {
  const hashed = await bcrypt.hash(password, 10);

  const existingMemberAuth = await findMemberAuthByIdentifier(identifier);
  if (existingMemberAuth) {
    await pool.query('UPDATE members_auth SET password_hash = ? WHERE id = ?', [hashed, existingMemberAuth.id]);
    return { table: 'members_auth', id: existingMemberAuth.id };
  }

  return null;
}

async function findUserByIdentifier(identifier) {
  try {
    console.log('[DEBUG] findUserByIdentifier called with:', identifier);
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ? OR username = ? OR mobile = ?',
      [identifier, identifier, identifier]
    );
    console.log('[DEBUG] findUserByIdentifier found', rows.length, 'rows');
    if (rows[0]) {
      console.log('[DEBUG] First row email:', rows[0].email, 'role:', rows[0].role);
    }
    logger.debug('findUserByIdentifier(%s): found %d rows', identifier, rows.length);
    return rows[0] || null;
  } catch (err) {
    console.error('[DEBUG] findUserByIdentifier error:', err.message);
    throw err;
  }
}

// register a new user
async function register(req, res) {
  const { username, email, mobile, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users
         (email, password_hash, role, username, mobile, subscription_status, user_uuid, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, UUID(), NULL, NULL)`,
      [email, hashed, 'user', username || null, mobile || null, 'active']
    );

    const user = {
      id: result.insertId,
      email,
      role: 'user',
      username: username || null,
      mobile: mobile || null
    };
    return res.status(201).json({ user });
  } catch (err) {
    // unique violation (ER_DUP_ENTRY) covers both email and username uniquely constrained
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email or username already exists' });
    }

    logger.error('register error: %O', err);
    return res.status(500).json({ message: 'Server error', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
}

// login existing user - role-based authentication
async function login(req, res) {
  const { identifier, password, role = 'member' } = req.body;
  console.log('[LOGIN] Received login attempt - identifier:', identifier, 'role:', role);
  
  if (!identifier || !password) {
    return res.status(400).json({ message: 'identifier and password are required' });
  }

  try {
    logger.info('login attempt for identifier: %s, role: %s', identifier, role);
    let user = null;
    let table = 'users';
    let debug_branch = 'none';

    // Route to appropriate table based on role
    if (role === 'super admin') {
      debug_branch = 'super_admin';
      user = await findSuperAdminByIdentifier(identifier);
      table = 'superadmins';
      if (!user) {
        logger.warn('superadmin not found for identifier: %s', identifier);
        return res.status(400).json({ message: 'Invalid credentials', debug: debug_branch });
      }
    } else if (role === 'admin') {
      debug_branch = 'admin';
      user = await findAdminByIdentifier(identifier);
      table = 'users';
      if (!user) {
        logger.warn('admin not found for identifier: %s', identifier);
        return res.status(400).json({ message: 'Invalid credentials', debug: debug_branch });
      }
      // Verify user is actually an admin
      if (user.role !== 'admin') {
        logger.warn('unauthorized role for admin login: %s', user.role);
        return res.status(403).json({ message: 'Invalid role. This account is not an admin.', debug: debug_branch });
      }
    } else if (role === 'member' || role === 'trainer' || role === 'user') {
      debug_branch = 'member_trainer';
      console.log('[LOGIN] Routing to members table for role:', role);
      user = await findMemberByIdentifier(identifier);
      table = 'members';
      console.log('[LOGIN] findMemberByIdentifier returned:', user ? 'Found' : 'Not found');

      if (!user) {
        logger.warn('member not found for identifier: %s in members table', identifier);
        // Fallback to members_auth if the account is stored in the legacy auth table.
        const legacyMember = await findMemberAuthByIdentifier(identifier);
        if (legacyMember) {
          const relatedMember = await findMemberByIdentifier(identifier);
          if (relatedMember) {
            user = {
              ...relatedMember,
              password_hash: legacyMember.password_hash,
              role: relatedMember.role || legacyMember.role,
              username: relatedMember.username || legacyMember.username,
              mobile: relatedMember.mobile || relatedMember.phone || legacyMember.mobile,
              email: relatedMember.email || legacyMember.email,
            };
            table = 'members_auth';
            console.log('[LOGIN] Legacy member auth fallback linked to member record for identifier:', identifier);
          } else {
            user = legacyMember;
            table = 'members_auth';
            console.log('[LOGIN] Legacy member auth fallback found for identifier:', identifier);
          }
        }
      }

      if (!user) {
        logger.warn('member not found for identifier: %s', identifier);
        return res.status(400).json({ message: 'Invalid credentials', debug: debug_branch + '_not_found' });
      }

      // Verify user has correct role for this login flow
      if (role === 'trainer' && user.role !== 'trainer') {
        logger.warn('unauthorized role for trainer login: expected trainer, got %s', user.role);
        return res.status(403).json({ message: `Invalid role. This account is a ${user.role}.` });
      }

      if ((role === 'member' || role === 'user') && !['member', 'user'].includes(user.role)) {
        logger.warn('unauthorized role for member/user login: expected member/user, got %s', user.role);
        return res.status(403).json({ message: `Invalid role. This account is a ${user.role}.` });
      }
    }

    if (!user) {
      logger.warn('user not found for identifier: %s with role: %s', identifier, role);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    let storedPassword = user.password_hash || user.password;
    if (!storedPassword && table === 'members' && user.phone) {
      storedPassword = String(user.phone);
      logger.info('login using phone value as password fallback for members identifier: %s', identifier);
    }

    if (!storedPassword && table === 'members') {
      const legacyMember = await findMemberAuthByIdentifier(identifier);
      if (legacyMember && legacyMember.password_hash) {
        storedPassword = legacyMember.password_hash;
        user = { ...user, ...legacyMember };
        table = 'members_auth';
        logger.info('login using fallback legacy members_auth for identifier: %s', identifier);
      }
    }

    if (!storedPassword) {
      logger.warn('login failed because password was not set for identifier: %s in table %s', identifier, table);
      return res.status(400).json({ message: 'Account exists but no password is set. Please reset your password or contact support.' });
    }

    // Verify password
    let match = false;
    if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2y$')) {
      match = await bcrypt.compare(password, storedPassword);
    } else {
      match = password === storedPassword;
    }

    if (!match) {
      logger.warn('login failed: invalid password for identifier: %s', identifier);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check subscription status for admins
    if (user.role === 'admin' && user.subscription_status !== 'active') {
      logger.warn('admin login blocked due to subscription status: %s', user.subscription_status);
      return res.status(403).json({ message: 'Admin account is not active. Complete the subscription before logging in.' });
    }

    const payload = buildAuthPayload(user);
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

    const { password_hash, ...userData } = user;
    userData.role = role;
    logger.info('login successful for %s: %d from table %s', role, user.id, table);
    res.json({ token, user: userData });
  } catch (err) {
    logger.error('login error: %O', err);
    logger.error('login error details - code: %s, message: %s, stack: %s', err.code, err.message, err.stack);
    res.status(500).json({ message: 'Server error', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
}

// Google login
async function googleLogin(req, res) {
  const { name, email, googleId, picture } = req.body;
  
  if (!email) {
    return res.status(400).json({ message: 'Email is required from Google' });
  }

  try {
    // Check if user exists
    let [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    let user;

    if (rows.length === 0) {
      // Create user if not exists
      const [result] = await pool.query(
        `INSERT INTO users (email, username, role, google_id, picture, subscription_status, user_uuid, created_by, updated_by)
         VALUES (?, ?, ?, ?, ?, ?, UUID(), NULL, NULL)`,
        [email, name || email.split('@')[0], 'user', googleId, picture, 'active']
      );
      
      const [newRows] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
      user = newRows[0];
    } else {
      user = rows[0];
      // Update google ID and picture if not present
      if (!user.google_id || !user.picture) {
        await pool.query(
          'UPDATE users SET google_id = ?, picture = ? WHERE id = ?',
          [googleId, picture, user.id]
        );
      }
    }

    if (user.role === 'admin' && user.subscription_status !== 'active') {
      return res.status(403).json({ message: 'Admin account is not active. Complete the subscription before logging in.' });
    }

    const payload = buildAuthPayload(user);
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

    const { password_hash, ...userData } = user;
    res.json({ token, user: userData });

  } catch (err) {
    logger.error('googleLogin error: %O', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// Register Superadmin
async function registerSuperAdmin(req, res) {
  const { username, email, mobile, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO superadmins (user_id, email, password_hash, role, username)
       VALUES (UUID(), ?, ?, ?, ?)`,
      [email, hashed, 'super admin', username || null]
    );

    const user = {
      id: result.insertId,
      email,
      role: 'super admin',
      username: username || null
    };
    logger.info('superadmin registered: %d', result.insertId);
    return res.status(201).json({ user });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email or username already exists' });
    }
    logger.error('registerSuperAdmin error: %O', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Register Admin (called by superadminonly)
async function registerAdmin(req, res) {
  const { username, email, mobile, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users (email, password_hash, role, username, mobile, subscription_status, user_uuid)
       VALUES (?, ?, ?, ?, ?, ?, UUID())`,
      [email, hashed, 'admin', username || null, mobile || null, 'active']
    );

    const user = {
      id: result.insertId,
      email,
      role: 'admin',
      username: username || null,
      mobile: mobile || null
    };
    logger.info('admin registered: %d', result.insertId);
    return res.status(201).json({ user });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email or username already exists' });
    }
    logger.error('registerAdmin error: %O', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Register Member or Trainer
async function registerMember(req, res) {
  const { username, email, mobile, phone, password, role = 'member', admin_id, branch_id } = req.body;
  const contactValue = phone || mobile;

  if (!email || !password || !contactValue) {
    return res.status(400).json({ message: 'email, password and phone/mobile are required' });
  }

  // Validate role
  if (!['member', 'trainer'].includes(role)) {
    return res.status(400).json({ message: 'Role must be member or trainer' });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO members_auth (email, password_hash, username, mobile, role, admin_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [email, hashed, username || null, contactValue, role, admin_id || null]
    );

    const user = {
      id: result.insertId,
      email,
      role,
      username: username || null,
      mobile: contactValue,
      admin_id
    };
    logger.info('%s registered into members_auth: %d', role, result.insertId);
    return res.status(201).json({ user });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email or username already exists' });
    }
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({ message: 'Members auth table not found. Run migrations.' });
    }
    logger.error('registerMember error: %O', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function setMemberPassword(req, res) {
  const { identifier, mobile, password } = req.body;
  const lookup = identifier || mobile;

  if (!lookup || !password) {
    return res.status(400).json({ message: 'mobile/identifier and password are required' });
  }

  try {
    const result = await updateMemberPasswordByIdentifier(lookup, password);
    if (!result) {
      return res.status(404).json({ message: 'Member not found for the provided mobile/identifier' });
    }

    logger.info('Password updated for member id %d in table %s', result.id, result.table);
    return res.json({ message: 'Password set successfully', table: result.table });
  } catch (err) {
    logger.error('setMemberPassword error: %O', err);
    return res.status(500).json({ message: 'Unable to set password', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
}

module.exports = { register, login, googleLogin, registerSuperAdmin, registerAdmin, registerMember, setMemberPassword };