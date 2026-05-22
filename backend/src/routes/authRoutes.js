const express = require('express');
const router = express.Router();
const { register, login, googleLogin, registerSuperAdmin, registerAdmin, registerMember, setMemberPassword, changePassword, getAllAdmins } = require('../controllers/authController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Public endpoints
router.post('/register', register);
router.post('/login', login);
router.post('/google-login', googleLogin);
router.post('/set-password', setMemberPassword);

// Protected endpoints
router.post('/change-password', authenticateToken, changePassword);

// Role-specific registration (protected)
router.post('/register-superadmin', registerSuperAdmin);
router.post('/register-admin', authenticateToken, requireAdmin, registerAdmin);
router.post('/register-member', registerMember);

// Get all admins (for super admin filtering)
router.get('/admins', authenticateToken, getAllAdmins);

module.exports = router;