const express = require('express');
const router = express.Router();
const { 
  getFieldAnalytics,
  getDeviceAnalytics,
  getDeviceHealthScore,
  getFieldIoTSummary,
  getAnomalyDetection,
  getPredictiveAnalytics
} = require('../controllers/analyticsController');
const { protect, authorize } = require('@agrimaan/shared').middleware;

// Routes
router.get('/fields/:fieldId', protect, getFieldAnalytics);
router.get('/devices/:deviceId', protect, getDeviceAnalytics);
router.get('/devices/:deviceId/health', protect, getDeviceHealthScore);
router.get('/fields/:fieldId/summary', protect, getFieldIoTSummary);
router.get('/devices/:deviceId/anomalies', protect, getAnomalyDetection);
router.get('/fields/:fieldId/predictions', protect, getPredictiveAnalytics);

module.exports = router;