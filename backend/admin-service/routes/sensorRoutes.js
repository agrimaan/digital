const express = require('express');
const { check } = require('express-validator');
const sensorController = require('../controllers/sensorController');
const { protect, authorize } =  require('@agrimaan/shared').middleware;

const router = express.Router();

// All routes require admin authentication
router.use(protect, authorize('admin', 'super-admin'));

// Sensor management routes
router.get('/', sensorController.getAllSensors);
router.get('/:id', sensorController.getSensorById);
router.post('/', [
  check('name', 'Sensor name is required').not().isEmpty(),
  check('type', 'Sensor type is required').not().isEmpty(),
  check('fieldId', 'Field ID is required').not().isEmpty()
], sensorController.createSensor);
router.put('/:id', sensorController.updateSensor);
router.delete('/:id', sensorController.deleteSensor);

// Sensor data and analytics
router.get('/:id/telemetry', sensorController.getSensorTelemetry);
router.get('/:id/alerts', sensorController.getSensorAlerts);
router.get('/analytics/overview', sensorController.getSensorAnalytics);

module.exports = router;
