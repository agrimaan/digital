const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const { 
  getDevices, 
  getDevice, 
  createDevice, 
  updateDevice, 
  deleteDevice,
  getDevicesByField,
  getDeviceStatus,
  regenerateApiKey
} = require('../controllers/deviceController');
const { protect, authorize } = require('@agrimaan/shared').middleware;


// Validation middleware
const validateDeviceCreation = [
  check('name', 'Device name is required').not().isEmpty(),
  check('deviceType', 'Device type is required').isIn([
    'soil_sensor', 
    'weather_station', 
    'irrigation_controller', 
    'camera', 
    'drone', 
    'smart_sprayer',
    'gps_tracker',
    'other'
  ]),
  check('field', 'Field ID is required').not().isEmpty(),
  check('location', 'Location is required').not().isEmpty(),
  check('location.coordinates', 'Location coordinates must be an array of [longitude, latitude]').isArray()
];

const validateDeviceUpdate = [
  check('name', 'Device name must not be empty if provided').optional().not().isEmpty(),
  check('deviceType', 'Device type must be valid if provided')
    .optional()
    .isIn([
      'soil_sensor', 
      'weather_station', 
      'irrigation_controller', 
      'camera', 
      'drone', 
      'smart_sprayer',
      'gps_tracker',
      'other'
    ]),
  check('location.coordinates', 'Location coordinates must be an array of [longitude, latitude]')
    .optional()
    .isArray(),
  check('status', 'Status must be valid if provided')
    .optional()
    .isIn(['active', 'inactive', 'maintenance', 'offline', 'error'])
];

// Routes
router
  .route('/')
  .get(protect, getDevices)
  .post(protect, validateDeviceCreation, createDevice);

router
  .route('/:id')
  .get(protect, getDevice)
  .put(protect, validateDeviceUpdate, updateDevice)
  .delete(protect, deleteDevice);

router.get('/field/:fieldId', protect, getDevicesByField);
router.get('/:id/status', protect, getDeviceStatus);
router.post('/:id/regenerate-api-key', protect, regenerateApiKey);

module.exports = router;