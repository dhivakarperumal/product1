const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

// register a new user
async function register(req, res) {
  const { username, email, mobile, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users (email, password_hash, role, username, mobile)
         VALUES (?, ?, ?, ?, ?)`,
      [email, hashed, 'user', username || null, mobile || null]
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

// login existing user
async function login(req, res) {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    // provide clearer message for missing fields
    return res.status(400).json({ message: 'identifier and password are required' });
  }

  try {
    logger.info('login attempt for identifier: %s', identifier);
    // allow email, username or mobile to be used as identifier
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ? OR username = ? OR mobile = ?',
      [identifier, identifier, identifier]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    // strip password_hash before sending user back
    const { password_hash, ...userData } = user;
    res.json({ token, user: userData });
  } catch (err) {
    logger.error('login error: %O', err);
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
        `INSERT INTO users (email, username, role, google_id, picture)
         VALUES (?, ?, ?, ?, ?)`,
        [email, name || email.split('@')[0], 'user', googleId, picture]
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

    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    const { password_hash, ...userData } = user;
    res.json({ token, user: userData });

  } catch (err) {
    logger.error('googleLogin error: %O', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

module.exports = { register, login, googleLogin };