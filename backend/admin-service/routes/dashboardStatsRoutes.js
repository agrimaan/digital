
const express = require('express');
const dashboardStatsController = require('../controllers/dashboardStatsController');
const { protect, authorize, logAction } = require('@agrimaan/shared').middleware;
const router = express.Router();

// Protect all routes
router.use(protect);

// Dashboard statistics routes
router.get('/stats', dashboardStatsController.getDashboardStats);
router.get('/users/stats', dashboardStatsController.getUserStats);
router.get('/fields/stats', dashboardStatsController.getFieldStats);
router.get('/crops/stats', dashboardStatsController.getCropStats);
router.get('/sensors/stats', dashboardStatsController.getSensorStats);
router.get('/orders/stats', dashboardStatsController.getOrderStats);
router.get('/users/recent', dashboardStatsController.getRecentUsers);
router.get('/orders/recent', dashboardStatsController.getRecentOrders);
router.get('/system/health', dashboardStatsController.getSystemHealth);
router.get('/verification/pending', dashboardStatsController.getPendingVerifications);

module.exports = router;
