const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
  getAllWorkouts,
  getWorkoutById,
  createWorkout,
  updateWorkout,
  deleteWorkout,
} = require('../controllers/workoutController');

const router = express.Router();

router.get('/', authenticateToken, requireAdmin, getAllWorkouts);
router.get('/:id', getWorkoutById);
router.post('/', createWorkout);
router.put('/:id', updateWorkout);
router.delete('/:id', deleteWorkout);

module.exports = router;