const { validationResult } = require('express-validator');
const Alert = require('../models/Alert');
const Device = require('../models/Device');
const alertService = require('../services/alertService');
const deviceService = require('../services/deviceService');
const responseHandler = require('../utils/responseHandler');

// @desc    Get all alerts
// @route   GET /api/alerts
// @access  Private
exports.getAlerts = async (req, res) => {
  try {
    // Get query parameters for filtering
    const { 
      resolved = 'all', // all, true, false
      severity,
      type,
      startDate,
      endDate,
      limit = 100,
      page = 1
    } = req.query;
    
    // Filter alerts by owner's devices if not admin
    let deviceFilter = {};
    if (req.user.role !== 'admin') {
      const userDevices = await deviceService.getAllDevices({ owner: req.user.id });
      const deviceIds = userDevices.map(device => device._id);
      deviceFilter = { device: { $in: deviceIds } };
    }
    
    const alerts = await alertService.getAlerts(
      deviceFilter,
      resolved,
      severity,
      type,
      startDate,
      endDate,
      parseInt(limit),
      parseInt(page)
    );
    
    return responseHandler.success(res, 200, alerts, 'Alerts retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving alerts', error);
  }
};

// @desc    Get single alert
// @route   GET /api/alerts/:id
// @access  Private
exports.getAlert = async (req, res) => {
  try {
    const alert = await alertService.getAlertById(req.params.id);
    
    if (!alert) {
      return responseHandler.notFound(res, 'Alert not found');
    }

    // Populate device details
    await alert.populate('device');

    // Check if user owns the device or is admin
    if (alert.device.owner !== req.user.id && req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to access this alert');
    }

    return responseHandler.success(res, 200, alert, 'Alert retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving alert', error);
  }
};

// @desc    Create alert
// @route   POST /api/alerts
// @access  Private
exports.createAlert = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseHandler.badRequest(res, 'Validation error', errors.array());
  }

  try {
    // Check if device exists and user has access
    const device = await deviceService.getDeviceById(req.body.device);
    
    if (!device) {
      return responseHandler.notFound(res, 'Device not found');
    }

    // Check if user owns the device or is admin
    if (device.owner !== req.user.id && req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to create alerts for this device');
    }

    const alert = await alertService.createAlert(req.body);
    
    return responseHandler.success(res, 201, alert, 'Alert created successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error creating alert', error);
  }
};

// @desc    Resolve alert
// @route   PUT /api/alerts/:id/resolve
// @access  Private
exports.resolveAlert = async (req, res) => {
  try {
    const alert = await alertService.getAlertById(req.params.id);
    
    if (!alert) {
      return responseHandler.notFound(res, 'Alert not found');
    }

    // Populate device details
    await alert.populate('device');

    // Check if user owns the device or is admin
    if (alert.device.owner !== req.user.id && req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to resolve this alert');
    }

    // Check if alert is already resolved
    if (alert.resolved) {
      return responseHandler.badRequest(res, 'Alert is already resolved');
    }

    const resolvedAlert = await alertService.resolveAlert(
      req.params.id,
      req.user.id,
      req.body.resolutionNotes
    );
    
    return responseHandler.success(res, 200, resolvedAlert, 'Alert resolved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error resolving alert', error);
  }
};

// @desc    Delete alert
// @route   DELETE /api/alerts/:id
// @access  Private/Admin
exports.deleteAlert = async (req, res) => {
  try {
    // Only admin can delete alerts
    if (req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to delete alerts');
    }
    
    const alert = await alertService.getAlertById(req.params.id);
    
    if (!alert) {
      return responseHandler.notFound(res, 'Alert not found');
    }

    await alertService.deleteAlert(req.params.id);
    
    return responseHandler.success(res, 200, {}, 'Alert deleted successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error deleting alert', error);
  }
};

// @desc    Get alerts by device
// @route   GET /api/alerts/device/:deviceId
// @access  Private
exports.getAlertsByDevice = async (req, res) => {
  try {
    // Check if device exists and user has access
    const device = await deviceService.getDeviceById(req.params.deviceId);
    
    if (!device) {
      return responseHandler.notFound(res, 'Device not found');
    }

    // Check if user owns the device or is admin
    if (device.owner !== req.user.id && req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to access alerts for this device');
    }

    // Get query parameters for filtering
    const { 
      resolved = 'all', // all, true, false
      severity,
      type,
      startDate,
      endDate,
      limit = 100,
      page = 1
    } = req.query;
    
    const alerts = await alertService.getAlertsByDevice(
      req.params.deviceId,
      resolved,
      severity,
      type,
      startDate,
      endDate,
      parseInt(limit),
      parseInt(page)
    );
    
    return responseHandler.success(res, 200, alerts, 'Device alerts retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving device alerts', error);
  }
};

// @desc    Get alerts summary
// @route   GET /api/alerts/summary
// @access  Private
exports.getAlertsSummary = async (req, res) => {
  try {
    // Filter by owner's devices if not admin
    let deviceFilter = {};
    if (req.user.role !== 'admin') {
      const userDevices = await deviceService.getAllDevices({ owner: req.user.id });
      const deviceIds = userDevices.map(device => device._id);
      deviceFilter = { device: { $in: deviceIds } };
    }
    
    const summary = await alertService.getAlertsSummary(deviceFilter);
    
    return responseHandler.success(res, 200, summary, 'Alerts summary retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving alerts summary', error);
  }
};