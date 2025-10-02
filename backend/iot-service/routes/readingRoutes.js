const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const { 
  getReadings, 
  getReading, 
  createReading, 
  deleteReading,
  getDeviceReadings,
  getFieldReadings,
  getReadingsByDateRange,
  getLatestReadings,
  getReadingStats
} = require('../controllers/readingController');
const { protect } = require('../middleware/auth');

// Validation middleware
const validateReadingCreation = [
  check('device', 'Device ID is required').not().isEmpty(),
  check('readingType', 'Reading type is required').not().isEmpty(),
  check('value', 'Value is required').isNumeric(),
  check('unit', 'Unit is required').not().isEmpty()
];

// Routes
router
  .route('/')
  .get(protect, getReadings)
  .post(protect, validateReadingCreation, createReading);

router
  .route('/:id')
  .get(protect, getReading)
  .delete(protect, deleteReading);

router.get('/device/:deviceId', protect, getDeviceReadings);
router.get('/field/:fieldId', protect, getFieldReadings);
router.get('/device/:deviceId/latest', protect, getLatestReadings);
router.get('/device/:deviceId/stats', protect, getReadingStats);
router.post('/date-range', protect, getReadingsByDateRange);

module.exports = router;