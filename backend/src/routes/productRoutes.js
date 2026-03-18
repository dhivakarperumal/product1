const express = require('express');
const {
  createProduct,
  listProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getLowStockAlerts
} = require('../controllers/productController');

const router = express.Router();

router.get('/', listProducts);
router.get('/alerts/low-stock', getLowStockAlerts);
router.get('/:id', getProduct);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;