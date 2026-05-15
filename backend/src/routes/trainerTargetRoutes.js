const express = require('express');
const { getTrainerTargets, upsertTrainerTarget, updateTrainerTarget } = require('../controllers/trainerTargetController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET trainer targets - accessible by trainers (their own) and admins (all)
router.get('/', authenticateToken, getTrainerTargets);

// POST trainer target - accessible by trainers and admins
router.post('/', authenticateToken, upsertTrainerTarget);

// PUT trainer target - update specific target
router.put('/:id', authenticateToken, updateTrainerTarget);

module.exports = router;
