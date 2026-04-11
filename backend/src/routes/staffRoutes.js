const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { authenticateToken, optionalAuthenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/generate-employee-id', staffController.generateEmployeeId);
router.get('/', optionalAuthenticateToken, staffController.getAllStaff);
router.get('/:id', optionalAuthenticateToken, staffController.getStaffById);
router.post('/', authenticateToken, requireAdmin, staffController.createStaff);
router.put('/:id', authenticateToken, requireAdmin, staffController.updateStaff);
router.delete('/:id', authenticateToken, requireAdmin, staffController.deleteStaff);

module.exports = router;
