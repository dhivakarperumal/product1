const express = require('express');
const { authenticateToken, requireTrainerOrAdmin } = require('../middleware/auth');
const {
  getAllWorkouts,
  getWorkoutById,
  createWorkout,
  updateWorkout,
  deleteWorkout,
} = require('../controllers/workoutController');

const router = express.Router();

router.get('/', authenticateToken, getAllWorkouts);
router.get('/:id', authenticateToken, getWorkoutById);
router.post('/', authenticateToken, requireTrainerOrAdmin, createWorkout);
router.put('/:id', authenticateToken, requireTrainerOrAdmin, updateWorkout);
router.delete('/:id', authenticateToken, requireTrainerOrAdmin, deleteWorkout);

module.exports = router;