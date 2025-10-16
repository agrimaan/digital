const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const { 
  getDeviceTelemetry, 
  getLatestTelemetry, 
  submitTelemetry, 
  getAggregatedTelemetry,
  deleteTelemetry,
  getFieldTelemetry
} = require('../controllers/telemetryController');
const { protect, authorize, apiKeyAuth } = require('@agrimaan/shared').middleware;
//const { validateTelemetrySubmission } = require('../middleware/validateTelemetry');

// Validation middleware
const validateTelemetrySubmission = [
  check('readings', 'Readings are required').isObject(),
  check('battery', 'Battery must be an object if provided')
    .optional()
    .isObject(),
  check('battery.level', 'Battery level must be a number between 0 and 100')
    .optional()
    .isFloat({ min: 0, max: 100 }),
  check('battery.charging', 'Battery charging must be a boolean')
    .optional()
    .isBoolean(),
  check('signalStrength', 'Signal strength must be a number if provided')
    .optional()
    .isNumeric(),
  check('location', 'Location must be an object if provided')
    .optional()
    .isObject(),
  check('location.coordinates', 'Location coordinates must be an array of [longitude, latitude]')
    .optional()
    .isArray()
];

// Routes
router.get('/device/:deviceId', protect, getDeviceTelemetry);
router.get('/device/:deviceId/latest', protect, getLatestTelemetry);
router.get('/device/:deviceId/aggregate', protect, getAggregatedTelemetry);
router.get('/field/:fieldId', protect, getFieldTelemetry);

// API key authenticated routes for device data submission
//router.post('/', apiKeyAuth, validateTelemetrySubmission, submitTelemetry);


// Admin only routes
router.delete('/:id', protect, authorize('admin'), deleteTelemetry);

module.exports = router;