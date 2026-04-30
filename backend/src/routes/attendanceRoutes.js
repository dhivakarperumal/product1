const express = require('express');
const { getAttendance, markAttendance, reverseGeocode, checkOut } = require('../controllers/attendanceController');
const { authenticateToken, requireTrainerOrAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, requireTrainerOrAdmin, getAttendance);
router.post('/', authenticateToken, requireTrainerOrAdmin, markAttendance);
router.post('/checkout', authenticateToken, requireTrainerOrAdmin, checkOut);
router.get('/reverse-geocode', reverseGeocode);

module.exports = router;
