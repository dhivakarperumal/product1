const express = require('express');
const { getAttendance, markAttendance, reverseGeocode, checkOut } = require('../controllers/attendanceController');

const router = express.Router();

router.get('/', getAttendance);
router.post('/', markAttendance);
router.post('/checkout', checkOut);
router.get('/reverse-geocode', reverseGeocode);

module.exports = router;
