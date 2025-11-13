const express = require('express');
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
  getBulkUploads
} = require('../controllers/dashboardController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

// Apply authentication and authorization to all routes
router.use(authenticate);
router.use(authorizeAdmin);

// Dashboard routes
router.get('/', getDashboard);
router.get('/stats', getDashboardStats);
router.get('/users/recent', getRecentUsers);
router.get('/orders/recent', getRecentOrders);
router.get('/verification/pending', getPendingVerifications);
router.get('/system/health', getSystemHealth);
router.get('/resources', getResources);
router.get('/land-tokens', getLandTokens);
router.get('/bulk-uploads', getBulkUploads);

module.exports = router;