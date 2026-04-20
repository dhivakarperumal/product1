const express = require('express');
const {
  listCart,
  addToCart,
  updateCartItem,
  removeCartItem,
} = require('../controllers/cartController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/cart?userId=...
router.get('/', authenticateToken, listCart);
// POST /api/cart
router.post('/', authenticateToken, addToCart);
// PUT /api/cart/:id
router.put('/:id', authenticateToken, updateCartItem);
// DELETE /api/cart/:id
router.delete('/:id', authenticateToken, removeCartItem);

module.exports = router;