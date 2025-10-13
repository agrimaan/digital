const express = require('express');
const { check } = require('express-validator');
const auditLogController = require('../controllers/auditLogController');
//const { protect, authorize } = require('@agrimaan/shared').middleware;
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Admin/SuperAdmin only routes
router.use(authorize('admin', 'super-admin'));

// Create a new audit log entry
router.post(
  '/',
  [
    check('action', 'Action is required').not().isEmpty(),
    check('resourceType', 'Resource type is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty()
  ],
  auditLogController.createLog
);

// Get audit logs by admin
router.get('/admin/:adminId', auditLogController.getLogsByAdmin);

// Get audit logs by resource
router.get('/resource/:resourceType/:resourceId?', auditLogController.getLogsByResource);

// Get audit logs by action
router.get('/action/:action', auditLogController.getLogsByAction);

// Get audit logs by date range
router.get(
  '/date-range',
  [
    check('startDate', 'Start date is required').isISO8601(),
    check('endDate', 'End date is required').isISO8601()
  ],
  auditLogController.getLogsByDateRange
);

// Get all audit logs with filtering
router.get('/', auditLogController.getAllLogs);

// Get audit log statistics
router.get(
  '/statistics',
  [
    check('startDate', 'Start date is required').isISO8601(),
    check('endDate', 'End date is required').isISO8601()
  ],
  auditLogController.getLogStatistics
);

// SuperAdmin only routes
router.use(authorize('super-admin'));

// Delete old audit logs
router.delete('/old/:days', auditLogController.deleteOldLogs);

module.exports = router;