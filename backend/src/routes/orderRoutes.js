const express = require('express');
const router = express.Router();
const {
  getAllOrders,
  getOrder,
  updateOrderStatus,
  createOrder,
  generateOrderId,
  getUserOrders,
  getTodayOrders
} = require('../controllers/orderController');

router.get('/', getAllOrders);
router.get('/today', getTodayOrders);
router.get('/user/:userId', getUserOrders);
router.get('/:id', getOrder);
router.post('/', createOrder);
router.patch('/:id/status', updateOrderStatus);
router.post("/generate-order-id", generateOrderId);



module.exports = router;
