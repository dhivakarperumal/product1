const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
  getAllDiets,
  getDietById,
  createDiet,
  updateDiet,
  deleteDiet,
} = require('../controllers/dietController');

const router = express.Router();

router.get('/', authenticateToken, requireAdmin, getAllDiets);
router.get('/:id', getDietById);
router.post('/', createDiet);
router.put('/:id', updateDiet);
router.delete('/:id', deleteDiet);

module.exports = router;