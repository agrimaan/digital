const express = require('express');
const { check } = require('express-validator');
const dashboardController = require('../controllers/dashboardController');
//const { protect, logAction, authorize } = require('@agrimaan/shared').middleware;
//const { protect, logAction, authorize } = require('../middleware/auth');
const { protect, authenticate, authorizeAdmin } = require('../middleware/auth');


const router = express.Router();

// Protect all routes
//router.use(protect);


// Admin/SuperAdmin only routes
//router.use(authorize('admin'));

// Apply authentication and authorization to all routes
router.use(authenticate);
router.use(authorizeAdmin);


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


// Dashboard routes
router
.route('/')
.get(protect, authorizeAdmin, getDashboard);

router
.route('/stats')
.get(protect, authorizeAdmin, getDashboardStats);
router
.route('/users/recent')
.get(protect, authorizeAdmin, getRecentUsers);

router
.route('/orders/recent')
.get(protect, authorizeAdmin, getRecentOrders);

router
.route('/verification/pending')
.get(protect, authorizeAdmin, getPendingVerifications);
router
.route('/system/health')
.get(protect, authorizeAdmin, getSystemHealth);

router
.route('/resources')
.get(protect, authorizeAdmin, getResources);
router
.route('/land-tokens')
.get(protect, authorizeAdmin, getLandTokens);

router
.route('/bulk-uploads')
.get(protect, authorizeAdmin, getBulkUploads);

module.exports = router;