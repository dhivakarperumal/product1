const express = require('express');
const router = express.Router();
const { register, login, googleLogin, registerSuperAdmin, registerAdmin, registerMember, setMemberPassword } = require('../controllers/authController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Public endpoints
router.post('/register', register);
router.post('/login', login);
router.post('/google-login', googleLogin);
router.post('/set-password', setMemberPassword);

// Role-specific registration (protected)
router.post('/register-superadmin', registerSuperAdmin);
router.post('/register-admin', authenticateToken, requireAdmin, registerAdmin);
router.post('/register-member', registerMember);

module.exports = router;