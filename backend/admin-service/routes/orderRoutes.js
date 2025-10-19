const express = require('express');
const { check } = require('express-validator');
const orderController = require('../controllers/orderController');
const { protect, logAction, authorize } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// All routes require admin authentication
router.use( authorize('admin', 'super-admin'));

// Order management routes
router.put('/:id/status', [
  check('status', 'Status is required').isIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'])
], orderController.updateOrderStatus);
router.get('/:id', orderController.getOrderById);
router.put('/:id', orderController.updateOrder);
router.delete('/:id', orderController.deleteOrder);
router.get('/', orderController.getAllOrders);

// Order analytics
router.get('/analytics/summary', orderController.getOrderAnalytics);
router.get('/:id/items', orderController.getOrderItems);

module.exports = router;
