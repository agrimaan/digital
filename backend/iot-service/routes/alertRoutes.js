const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const { 
  getAlerts, 
  getAlert, 
  createAlert, 
  resolveAlert, 
  deleteAlert,
  getAlertsByDevice,
  getAlertsSummary
} = require('../controllers/alertController');
const { protect, authorize } = require('@agrimaan/shared').middleware;

// Validation middleware
const validateAlertCreation = [
  check('device', 'Device ID is required').isMongoId(),
  check('type', 'Alert type is required').isIn([
    'low_battery', 
    'offline', 
    'threshold_exceeded', 
    'threshold_below', 
    'maintenance_required',
    'tamper_detected',
    'connectivity_issue',
    'system_error',
    'other'
  ]),
  check('severity', 'Severity is required')
    .isIn(['info', 'warning', 'critical']),
  check('message', 'Message is required').not().isEmpty()
];

const validateAlertResolution = [
  check('resolutionNotes', 'Resolution notes must not be empty if provided')
    .optional()
    .not().isEmpty()
];

// Routes
router
  .route('/')
  .get(protect, getAlerts)
  .post(protect, validateAlertCreation, createAlert);

router
  .route('/:id')
  .get(protect, getAlert)
  .delete(protect, authorize('admin'), deleteAlert);

router.put('/:id/resolve', protect, validateAlertResolution, resolveAlert);
router.get('/device/:deviceId', protect, getAlertsByDevice);
router.get('/summary', protect, getAlertsSummary);

module.exports = router;