const express = require('express');
const {
  getAllAssignments,
  upsertAssignments,
} = require('../controllers/assignmentController');
const { authenticateToken, requireTrainerOrAdmin, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/assignments
router.get('/', authenticateToken, requireTrainerOrAdmin, getAllAssignments);

// POST /api/assignments
router.post('/', authenticateToken, requireAdmin, upsertAssignments);

module.exports = router;
