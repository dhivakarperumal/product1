const express = require('express');
const {
  createProduct,
  listProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getLowStockAlerts
} = require('../controllers/productController');
const { authenticateToken, optionalAuthenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuthenticateToken, listProducts);
router.get('/alerts/low-stock', optionalAuthenticateToken, getLowStockAlerts);
router.get('/:id', optionalAuthenticateToken, getProduct);
router.post('/', authenticateToken, requireAdmin, createProduct);
router.put('/:id', authenticateToken, requireAdmin, updateProduct);
router.delete('/:id', authenticateToken, requireAdmin, deleteProduct);

module.exports = router;