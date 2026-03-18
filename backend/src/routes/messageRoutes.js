const express = require('express');
const router = express.Router();
const { sendMessages, getMessageHistory } = require('../controllers/messageController');

router.post('/', sendMessages);
router.get('/history', getMessageHistory);

module.exports = router;
