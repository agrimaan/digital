const express = require('express');
const { protect, authorize } = require('@agrimaan/shared').middleware;
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

const {
  getDashboard,
  getDashboardStats,
  getRecentUsers,
  getRecentOrders,
  getPendingVerifications,
  getSystemHealth,
  getResources,
  getLandTokens,
  getBulkUploads,
} = dashboardController;


router.get('/', protect, authorize('superadmin', 'admin'), getDashboard);

router.get('/stats', protect, authorize('superadmin', 'admin'), getDashboardStats);

router.get('/users/recent', protect, authorize('superadmin', 'admin'), getRecentUsers);

router.get('/orders/recent', protect, authorize('superadmin', 'admin'), getRecentOrders);

router.get('/verification/pending', protect, authorize('superadmin', 'admin'), getPendingVerifications);

router.get('/system/health', protect, authorize('superadmin', 'admin'), getSystemHealth);

router.get('/resources', protect, authorize('superadmin', 'admin'), getResources);

router.get('/land-tokens', protect, authorize('superadmin', 'admin'), getLandTokens);

router.get('/bulk-uploads', protect, authorize('superadmin', 'admin'), getBulkUploads);

module.exports = router;
