const express = require('express');
const router = express.Router();
const { sendMessages, getMessageHistory } = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, sendMessages);
router.get('/history', authenticateToken, getMessageHistory);

module.exports = router;
