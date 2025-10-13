
const express = require('express');
const dashboardStatsController = require('../controllers/dashboardStatsController');
//const { protect, authorize, logAction } = require('@agrimaan/shared').middleware;
const { protect, logAction, authorize } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Admin/SuperAdmin only routes
router.use(authorize('admin'));

console.log('Dashboard Stats Routes Loaded');
// Dashboard statistics routes
router.get('/stats', protect, authorize('superadmin', 'admin'), dashboardStatsController.getDashboardStats);
router.get('/users/stats', protect, authorize('superadmin', 'admin'),dashboardStatsController.getUserStats);
router.get('/fields/stats',protect, authorize('superadmin', 'admin'),dashboardStatsController.getFieldStats);
router.get('/crops/stats',protect, authorize('superadmin', 'admin'),dashboardStatsController.getCropStats);
router.get('/sensors/stats',protect, authorize('superadmin', 'admin'),dashboardStatsController.getSensorStats);
router.get('/orders/stats',protect, authorize('superadmin', 'admin'),dashboardStatsController.getOrderStats);
router.get('/users/recent',protect, authorize('superadmin', 'admin'),dashboardStatsController.getRecentUsers);
router.get('/orders/recent',protect, authorize('superadmin', 'admin'),dashboardStatsController.getRecentOrders);
router.get('/admin/dashboard/system/health',protect, authorize('superadmin', 'admin'),dashboardStatsController.getSystemHealth);
router.get('/verification/pending',protect, authorize('superadmin', 'admin'),dashboardStatsController.getPendingVerifications);
router.get('/users/recent',protect, authorize('superadmin', 'admin'),dashboardStatsController.getRecentUsers);
router.get('/orders/recent',protect, authorize('superadmin', 'admin'),dashboardStatsController.getRecentOrders);
router.get('/verification/pending',protect, authorize('superadmin', 'admin'),dashboardStatsController.getPendingVerifications);
router.get('/users/recent',protect, authorize('admin'),dashboardStatsController.getRecentUsers);

module.exports = router;
