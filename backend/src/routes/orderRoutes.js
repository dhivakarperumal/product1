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

const { getOrdersByCreator, getMyOrdersByCreator } = require('../controllers/orderController');

router.get('/', authenticateToken, requireAdmin, getAllOrders);
router.get('/today', authenticateToken, getTodayOrders);
router.get('/user/:userId', getUserOrders);
// specific creator routes must come before the generic '/:id' to avoid conflicts
router.get('/created-by/:id', authenticateToken, getOrdersByCreator);
router.get('/created-by/me', authenticateToken, getMyOrdersByCreator);

router.get('/:id', getOrder);
router.post('/', optionalAuthenticateToken, createOrder);
router.patch('/:id/status', updateOrderStatus);
router.post("/generate-order-id", generateOrderId);

// return orders created by specific creator id (admin_uuid/created_by/updated_by)
router.get('/created-by/:id', authenticateToken, getOrdersByCreator);
// return orders created by the actor resolved from token
router.get('/created-by/me', authenticateToken, getMyOrdersByCreator);



module.exports = router;
