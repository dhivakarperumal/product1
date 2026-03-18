const express = require('express');
const {
  getAllDiets,
  getDietById,
  createDiet,
  updateDiet,
  deleteDiet,
} = require('../controllers/dietController');

const router = express.Router();

router.get('/', getAllDiets);
router.get('/:id', getDietById);
router.post('/', createDiet);
router.put('/:id', updateDiet);
router.delete('/:id', deleteDiet);

module.exports = router;