
const express = require('express');
const statsController = require('../controllers/statsController');
//const { protect, authorize, logAction } = require('@agrimaan/shared').middleware;
const { protect, logAction, authorize } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Admin/SuperAdmin only routes
router.use(authorize('admin','super-admin'));

console.log('Dashboard Stats Routes Loaded');
// Dashboard statistics routes
router.get('/', statsController.getDashboardStats);
router.get('/users', statsController.getUserStats);
router.get('/fields',statsController.getFieldStats);
router.get('/crops',statsController.getCropStats);
router.get('/sensors',statsController.getSensorStats);
router.get('/orders',statsController.getOrderStats);
router.get('/users/recent',statsController.getRecentUsers);
router.get('/orders/recent',statsController.getRecentOrders);
router.get('/system/health',statsController.getSystemHealth);
router.get('/bulk-uploads/stats',statsController.getBulkUploadStats);
router.get('/verification/pending',statsController.getPendingVerifications);

module.exports = router;
