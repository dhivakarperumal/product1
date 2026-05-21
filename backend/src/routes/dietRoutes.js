const express = require('express');
const { authenticateToken, requireTrainerOrAdmin } = require('../middleware/auth');
const {
  getAllDiets,
  getDietById,
  createDiet,
  updateDiet,
  deleteDiet,
} = require('../controllers/dietController');

const router = express.Router();

router.get('/', authenticateToken, getAllDiets);
router.get('/:id', authenticateToken, getDietById);
router.post('/', authenticateToken, requireTrainerOrAdmin, createDiet);
router.put('/:id', authenticateToken, requireTrainerOrAdmin, updateDiet);
router.delete('/:id', authenticateToken, requireTrainerOrAdmin, deleteDiet);

module.exports = router;