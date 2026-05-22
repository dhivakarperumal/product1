const jwt = require('jsonwebtoken');

// helper to parse a raw Cookie header without adding a dependency
function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').map(c => c.trim()).reduce((acc, pair) => {
    const [k, ...v] = pair.split('=');
    acc[k] = decodeURIComponent(v.join('='));
    return acc;
  }, {});
}

const authenticateToken = (req, res, next) => {
  // Check standard Authorization header first
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  // Fallback to common alternate headers
  if (!token) {
    token = req.headers['x-access-token'] || req.headers['token'] || null;
  }

  // Fallback to cookie named 'token' if present (useful when frontend sets token as cookie)
  if (!token && req.headers && req.headers.cookie) {
    const cookies = parseCookies(req.headers.cookie);
    if (cookies.token) token = cookies.token;
    if (!token && cookies.access_token) token = cookies.access_token;
  }

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
  let token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    token = req.headers['x-access-token'] || req.headers['token'] || null;
  }
  if (!token && req.headers && req.headers.cookie) {
    const cookies = parseCookies(req.headers.cookie);
    token = cookies.token || cookies.access_token || null;
  }

  if (!token) return next();

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
