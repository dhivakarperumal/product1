const express = require('express');
const {
  getAllReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
} = require('../controllers/reviewController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, requireAdmin, getAllReviews);
router.get('/:id', getReviewById);
router.post('/', createReview);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);

module.exports = router;
