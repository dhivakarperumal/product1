const express = require('express');
const {
  getAllAssignments,
  upsertAssignments,
} = require('../controllers/assignmentController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/assignments
router.get('/', authenticateToken, requireAdmin, getAllAssignments);

// POST /api/assignments
router.post('/', upsertAssignments);

module.exports = router;
