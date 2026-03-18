const express = require('express');
const {
  getAllAssignments,
  upsertAssignments,
} = require('../controllers/assignmentController');

const router = express.Router();

// GET /api/assignments
router.get('/', getAllAssignments);

// POST /api/assignments
router.post('/', upsertAssignments);

module.exports = router;
