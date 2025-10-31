const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { protect, authorize } = require('@agrimaan/shared').middleware;
//const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Admin/SuperAdmin only routes
router.use(authorize('admin', 'super-admin'));

// Get system overview statistics
router.get('/overview', analyticsController.getSystemOverview);

// Get user statistics
router.get('/users', analyticsController.getUserStatistics);

// Get marketplace statistics
router.get('/marketplace', analyticsController.getMarketplaceStatistics);

// Get crop statistics
router.get('/crops', analyticsController.getCropStatistics);

// Get IoT device statistics
router.get('/iot', analyticsController.getIoTStatistics);

// Get weather statistics
router.get('/weather', analyticsController.getWeatherStatistics);

// Get logistics statistics
router.get('/logistics', analyticsController.getLogisticsStatistics);

// Get revenue statistics
router.get('/revenue', analyticsController.getRevenueStatistics);

// Get order statistics
router.get('/orders', analyticsController.getOrderStatistics);

// Get field statistics
router.get('/fields', analyticsController.getFieldStatistics);

// Get system health statistics
router.get('/health', analyticsController.getSystemHealth);

module.exports = router;