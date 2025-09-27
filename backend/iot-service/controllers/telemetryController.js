const { validationResult } = require('express-validator');
const Telemetry = require('../models/Telemetry');
const Device = require('../models/Device');
const telemetryService = require('../services/telemetryService');
const deviceService = require('../services/deviceService');
const alertService = require('../services/alertService');
const responseHandler = require('../utils/responseHandler');

// @desc    Get telemetry data for a device
// @route   GET /api/telemetry/device/:deviceId
// @access  Private
exports.getDeviceTelemetry = async (req, res) => {
  try {
    // Check if device exists and user has access
    const device = await deviceService.getDeviceById(req.params.deviceId);
    
    if (!device) {
      return responseHandler.notFound(res, 'Device not found');
    }

    // Check if user owns the device or is admin
    if (device.owner !== req.user.id && req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to access telemetry for this device');
    }

    // Get query parameters for filtering
    const { startDate, endDate, limit = 100, page = 1 } = req.query;
    
    const telemetryData = await telemetryService.getDeviceTelemetry(
      req.params.deviceId,
      startDate,
      endDate,
      parseInt(limit),
      parseInt(page)
    );
    
    return responseHandler.success(res, 200, telemetryData, 'Telemetry data retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving telemetry data', error);
  }
};

// @desc    Get latest telemetry for a device
// @route   GET /api/telemetry/device/:deviceId/latest
// @access  Private
exports.getLatestTelemetry = async (req, res) => {
  try {
    // Check if device exists and user has access
    const device = await deviceService.getDeviceById(req.params.deviceId);
    
    if (!device) {
      return responseHandler.notFound(res, 'Device not found');
    }

    // Check if user owns the device or is admin
    if (device.owner !== req.user.id && req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to access telemetry for this device');
    }

    const latestTelemetry = await telemetryService.getLatestTelemetry(req.params.deviceId);
    
    if (!latestTelemetry) {
      return responseHandler.notFound(res, 'No telemetry data found for this device');
    }
    
    return responseHandler.success(res, 200, latestTelemetry, 'Latest telemetry data retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving latest telemetry data', error);
  }
};

// @desc    Submit telemetry data
// @route   POST /api/telemetry
// @access  Private (API Key)
exports.submitTelemetry = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseHandler.badRequest(res, 'Validation error', errors.array());
  }

  try {
    // Device is attached to request by apiKeyAuth middleware
    const device = req.device;
    
    // Prepare telemetry data
    const telemetryData = {
      device: device._id,
      readings: req.body.readings,
      location: req.body.location || device.location,
      battery: req.body.battery,
      signalStrength: req.body.signalStrength,
      metadata: req.body.metadata
    };
    
    // Save telemetry data
    const telemetry = await telemetryService.createTelemetry(telemetryData);
    
    // Process telemetry for alerts
    await alertService.processTelemetryForAlerts(telemetry);
    
    return responseHandler.success(res, 201, { id: telemetry._id }, 'Telemetry data submitted successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error submitting telemetry data', error);
  }
};

// @desc    Get aggregated telemetry data
// @route   GET /api/telemetry/device/:deviceId/aggregate
// @access  Private
exports.getAggregatedTelemetry = async (req, res) => {
  try {
    // Check if device exists and user has access
    const device = await deviceService.getDeviceById(req.params.deviceId);
    
    if (!device) {
      return responseHandler.notFound(res, 'Device not found');
    }

    // Check if user owns the device or is admin
    if (device.owner !== req.user.id && req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to access telemetry for this device');
    }

    // Get query parameters for aggregation
    const { 
      startDate, 
      endDate, 
      interval = 'day', // hour, day, week, month
      metrics = 'all' // comma-separated list of metrics to aggregate
    } = req.query;
    
    const aggregatedData = await telemetryService.getAggregatedTelemetry(
      req.params.deviceId,
      startDate,
      endDate,
      interval,
      metrics
    );
    
    return responseHandler.success(res, 200, aggregatedData, 'Aggregated telemetry data retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving aggregated telemetry data', error);
  }
};

// @desc    Delete telemetry data
// @route   DELETE /api/telemetry/:id
// @access  Private/Admin
exports.deleteTelemetry = async (req, res) => {
  try {
    // Only admin can delete telemetry data
    if (req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to delete telemetry data');
    }
    
    const telemetry = await telemetryService.getTelemetryById(req.params.id);
    
    if (!telemetry) {
      return responseHandler.notFound(res, 'Telemetry data not found');
    }

    await telemetryService.deleteTelemetry(req.params.id);
    
    return responseHandler.success(res, 200, {}, 'Telemetry data deleted successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error deleting telemetry data', error);
  }
};

// @desc    Get telemetry data for a field
// @route   GET /api/telemetry/field/:fieldId
// @access  Private
exports.getFieldTelemetry = async (req, res) => {
  try {
    // Get devices in the field
    const devices = await deviceService.getDevicesByField({
      field: req.params.fieldId,
      ...(req.user.role !== 'admin' ? { owner: req.user.id } : {})
    });
    
    if (devices.length === 0) {
      return responseHandler.success(res, 200, [], 'No devices found in this field');
    }
    
    // Get query parameters for filtering
    const { startDate, endDate, limit = 100, page = 1 } = req.query;
    
    // Get device IDs
    const deviceIds = devices.map(device => device._id);
    
    // Get telemetry data for all devices in the field
    const telemetryData = await telemetryService.getFieldTelemetry(
      deviceIds,
      startDate,
      endDate,
      parseInt(limit),
      parseInt(page)
    );
    
    return responseHandler.success(res, 200, telemetryData, 'Field telemetry data retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving field telemetry data', error);
  }
};