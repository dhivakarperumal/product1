const express = require('express');
const router = express.Router();
const { getReports } = require('../controllers/reportController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, requireAdmin, getReports);

module.exports = router;
