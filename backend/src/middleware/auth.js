const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const optionalAuthenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
    if (!err && user) {
      req.user = user;
    }
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const normalizedRole = String(req.user.role || '').toLowerCase();
  if (!['admin', 'super admin', 'superadmin'].includes(normalizedRole)) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

const requireTrainerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const normalizedRole = String(req.user.role || '').toLowerCase();
  if (!['admin', 'super admin', 'superadmin', 'trainer'].includes(normalizedRole)) {
    return res.status(403).json({ error: 'Trainer or admin access required' });
  }

  next();
};

module.exports = { authenticateToken, optionalAuthenticateToken, requireAdmin, requireTrainerOrAdmin };
