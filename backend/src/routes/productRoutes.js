const express = require('express');
const {
  createProduct,
  listProducts,
  getProduct,
  updateProduct,
  updateProductStock,
  deleteProduct,
  getLowStockAlerts
} = require('../controllers/productController');
const { authenticateToken, optionalAuthenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuthenticateToken, listProducts);
router.get('/alerts/low-stock', optionalAuthenticateToken, getLowStockAlerts);
router.get('/:id', optionalAuthenticateToken, getProduct);
router.post('/', authenticateToken, requireAdmin, createProduct);
// Stock update endpoint - allows authenticated users (for checkout flow)
router.patch('/:id/stock', authenticateToken, updateProductStock);
// Full product update - admin only
router.put('/:id', authenticateToken, requireAdmin, updateProduct);
router.delete('/:id', authenticateToken, requireAdmin, deleteProduct);

module.exports = router;