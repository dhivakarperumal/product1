const express = require('express');
const {
  listCart,
  addToCart,
  updateCartItem,
  removeCartItem,
} = require('../controllers/cartController');

const router = express.Router();

// GET /api/cart?userId=...
router.get('/', listCart);
// POST /api/cart
router.post('/', addToCart);
// PUT /api/cart/:id
router.put('/:id', updateCartItem);
// DELETE /api/cart/:id
router.delete('/:id', removeCartItem);

module.exports = router;