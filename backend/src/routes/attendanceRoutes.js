const express = require('express');
const { getAttendance, markAttendance, reverseGeocode, checkOut } = require('../controllers/attendanceController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, requireAdmin, getAttendance);
router.post('/', markAttendance);
router.post('/checkout', checkOut);
router.get('/reverse-geocode', reverseGeocode);

module.exports = router;
