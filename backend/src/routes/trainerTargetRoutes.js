const express = require('express');
const { getTrainerTargets, upsertTrainerTarget } = require('../controllers/trainerTargetController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, requireAdmin, getTrainerTargets);
router.post('/', authenticateToken, requireAdmin, upsertTrainerTarget);

module.exports = router;
