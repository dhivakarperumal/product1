const express = require('express');
const router = express.Router();
const { sendPlanAssignmentMessage } = require('../controllers/whatsappController');
const { authenticateToken } = require('../middleware/auth');

/**
 * POST /api/whatsapp/send-plan-message
 * Send WhatsApp message after plan assignment
 */
router.post('/send-plan-message', authenticateToken, sendPlanAssignmentMessage);

module.exports = router;
