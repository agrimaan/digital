const { validationResult } = require('express-validator');
const Device = require('../models/Device');
const deviceService = require('../services/deviceService');
const responseHandler = require('../utils/responseHandler');

// @desc    Get all devices
// @route   GET /api/devices
// @access  Private
exports.getDevices = async (req, res) => {
  try {
    // Filter devices by owner if not admin
    const filter = req.user.role === 'admin' ? {} : { owner: req.user.id };
    
    const devices = await deviceService.getAllDevices(filter);
    
    return responseHandler.success(res, 200, devices, 'Devices retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving devices', error);
  }
};

// @desc    Get single device
// @route   GET /api/devices/:id
// @access  Private
exports.getDevice = async (req, res) => {
  try {
    const device = await deviceService.getDeviceById(req.params.id);
    
    if (!device) {
      return responseHandler.notFound(res, 'Device not found');
    }

    // Check if user owns the device or is admin
    if (device.owner !== req.user.id && req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to access this device');
    }

    return responseHandler.success(res, 200, device, 'Device retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving device', error);
  }
};

// @desc    Create device
// @route   POST /api/devices
// @access  Private
exports.createDevice = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseHandler.badRequest(res, 'Validation error', errors.array());
  }

  try {
    // Set owner to current user
    const deviceData = {
      ...req.body,
      owner: req.user.id
    };
    
    const device = await deviceService.createDevice(deviceData);
    
    return responseHandler.success(res, 201, device, 'Device created successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error creating device', error);
  }
};

// @desc    Update device
// @route   PUT /api/devices/:id
// @access  Private
exports.updateDevice = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseHandler.badRequest(res, 'Validation error', errors.array());
  }

  try {
    let device = await deviceService.getDeviceById(req.params.id);
    
    if (!device) {
      return responseHandler.notFound(res, 'Device not found');
    }

    // Check if user owns the device or is admin
    if (device.owner !== req.user.id && req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to update this device');
    }

    // Prevent owner change
    if (req.body.owner && req.body.owner !== device.owner) {
      return responseHandler.badRequest(res, 'Cannot change device owner');
    }

    // Update device
    device = await deviceService.updateDevice(req.params.id, req.body);
    
    return responseHandler.success(res, 200, device, 'Device updated successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error updating device', error);
  }
};

// @desc    Delete device
// @route   DELETE /api/devices/:id
// @access  Private
exports.deleteDevice = async (req, res) => {
  try {
    const device = await deviceService.getDeviceById(req.params.id);
    
    if (!device) {
      return responseHandler.notFound(res, 'Device not found');
    }

    // Check if user owns the device or is admin
    if (device.owner !== req.user.id && req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to delete this device');
    }

    await deviceService.deleteDevice(req.params.id);
    
    return responseHandler.success(res, 200, {}, 'Device deleted successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error deleting device', error);
  }
};

// @desc    Get devices by field
// @route   GET /api/devices/field/:fieldId
// @access  Private
exports.getDevicesByField = async (req, res) => {
  try {
    // Check if user has access to the field (would need to call field service)
    // For simplicity, we'll just check if the devices belong to the user
    const filter = {
      field: req.params.fieldId,
      ...(req.user.role !== 'admin' ? { owner: req.user.id } : {})
    };
    
    const devices = await deviceService.getDevicesByField(filter);
    
    return responseHandler.success(res, 200, devices, 'Devices retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving devices', error);
  }
};

// @desc    Get device status
// @route   GET /api/devices/:id/status
// @access  Private
exports.getDeviceStatus = async (req, res) => {
  try {
    const device = await deviceService.getDeviceById(req.params.id);
    
    if (!device) {
      return responseHandler.notFound(res, 'Device not found');
    }

    // Check if user owns the device or is admin
    if (device.owner !== req.user.id && req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to access this device');
    }

    const status = await deviceService.getDeviceStatus(req.params.id);
    
    return responseHandler.success(res, 200, status, 'Device status retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving device status', error);
  }
};

// @desc    Regenerate device API key
// @route   POST /api/devices/:id/regenerate-api-key
// @access  Private
exports.regenerateApiKey = async (req, res) => {
  try {
    const device = await deviceService.getDeviceById(req.params.id);
    
    if (!device) {
      return responseHandler.notFound(res, 'Device not found');
    }

    // Check if user owns the device or is admin
    if (device.owner !== req.user.id && req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to regenerate API key for this device');
    }

    const updatedDevice = await deviceService.regenerateApiKey(req.params.id);
    
    return responseHandler.success(res, 200, { apiKey: updatedDevice.apiKey }, 'API key regenerated successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error regenerating API key', error);
  }
};