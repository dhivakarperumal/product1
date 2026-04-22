const express = require('express');
const router = express.Router();
const { authenticateToken, optionalAuthenticateToken, requireAdmin } = require('../middleware/auth');
const {
  getAllOrders,
  getOrder,
  updateOrderStatus,
  createOrder,
  generateOrderId,
  getUserOrders,
  getTodayOrders
} = require('../controllers/orderController');

router.get('/', authenticateToken, requireAdmin, getAllOrders);
router.get('/today', authenticateToken, getTodayOrders);
router.get('/user/:userId', getUserOrders);
router.get('/:id', getOrder);
router.post('/', optionalAuthenticateToken, createOrder);
router.patch('/:id/status', updateOrderStatus);
router.post("/generate-order-id", generateOrderId);



module.exports = router;
