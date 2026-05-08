const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const {
  sendEMIReminders,
  getEMINotificationStats,
  markEMIPaymentsPaid,
  markOverdueEMI
} = require('../controllers/emiNotificationController');

/* Send EMI reminders */
router.post('/send-reminders', authenticateToken, requireAdmin, sendEMIReminders);

/* Get EMI notification statistics */
router.get('/stats', authenticateToken, requireAdmin, getEMINotificationStats);

/* Mark multiple EMI payments as paid */
router.post('/mark-paid', authenticateToken, requireAdmin, markEMIPaymentsPaid);

/* Auto-mark overdue EMI payments */
router.post('/mark-overdue', authenticateToken, requireAdmin, markOverdueEMI);

module.exports = router;
