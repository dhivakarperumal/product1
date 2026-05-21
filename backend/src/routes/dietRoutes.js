const express = require('express');
const { authenticateToken, requireTrainerOrAdmin, requireAdmin } = require('../middleware/auth');
const {
  getAllDiets,
  getDietById,
  createDiet,
  updateDiet,
  deleteDiet,
} = require('../controllers/dietController');

const router = express.Router();

router.get('/', authenticateToken, requireTrainerOrAdmin, getAllDiets);
router.get('/:id', authenticateToken, requireTrainerOrAdmin, getDietById);
router.post('/', authenticateToken, requireTrainerOrAdmin, createDiet);
router.put('/:id', authenticateToken, requireTrainerOrAdmin, updateDiet);
router.delete('/:id', authenticateToken, requireTrainerOrAdmin, deleteDiet);

module.exports = router;