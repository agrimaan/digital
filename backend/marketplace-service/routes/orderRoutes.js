const express = require('express');
const { check } = require('express-validator');
const orderController = require('../controllers/orderController');
const { protect, authorize } = require('../../user-service/middleware/auth');

const router = express.Router();

// All routes require admin authentication
router.use(protect, authorize('admin', 'super-admin'));

// Order management routes
router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrdersByBuyer);
router.put('/:id/status', [
  check('status', 'Status is required').isIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'])
], orderController.updateOrderStatus);
router.put('/:id', orderController.updateOrderStatus);
//router.delete('/:id', orderController.);

// Order analytics
//router.get('/:id/items', orderController.getOrderItems);
//router.get('/analytics/summary', orderController.getOrderAnalytics);

module.exports = router;
