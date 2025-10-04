const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const { 
  getMaintenanceLogs, 
  getMaintenanceLog, 
  createMaintenanceLog, 
  updateMaintenanceLog, 
  deleteMaintenanceLog,
  getDeviceMaintenanceLogs,
  scheduleMaintenanceLog
} = require('../controllers/maintenanceController');
const { protect } = require('../middleware/auth');

// Validation middleware
const validateMaintenanceCreation = [
  check('device', 'Device ID is required').not().isEmpty(),
  check('maintenanceType', 'Maintenance type is required').isIn([
    'routine',
    'repair',
    'calibration',
    'battery_replacement',
    'firmware_update',
    'cleaning',
    'inspection',
    'other'
  ]),
  check('description', 'Description is required').not().isEmpty(),
  check('performedBy', 'Performed by is required').not().isEmpty()
];

const validateMaintenanceUpdate = [
  check('maintenanceType', 'Maintenance type must be valid if provided')
    .optional()
    .isIn([
      'routine',
      'repair',
      'calibration',
      'battery_replacement',
      'firmware_update',
      'cleaning',
      'inspection',
      'other'
    ]),
  check('status', 'Status must be valid if provided')
    .optional()
    .isIn(['scheduled', 'in_progress', 'completed', 'cancelled'])
];

// Routes
router
  .route('/')
  .get(protect, getMaintenanceLogs)
  .post(protect, validateMaintenanceCreation, createMaintenanceLog);

router
  .route('/:id')
  .get(protect, getMaintenanceLog)
  .put(protect, validateMaintenanceUpdate, updateMaintenanceLog)
  .delete(protect, deleteMaintenanceLog);

router.get('/device/:deviceId', protect, getDeviceMaintenanceLogs);
router.post('/schedule', protect, scheduleMaintenanceLog);

module.exports = router;