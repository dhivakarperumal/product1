const express = require('express');
const { getTodayCheckins } = require('../controllers/checkinController');

const router = express.Router();

router.get('/today', getTodayCheckins);

module.exports = router;
