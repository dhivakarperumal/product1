const express = require('express');
const { getTodayCheckins } = require('../controllers/checkinController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/today', authenticateToken, requireAdmin, getTodayCheckins);

module.exports = router;
