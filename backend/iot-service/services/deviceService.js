const Device = require('../models/Device');
const Telemetry = require('../models/Telemetry');
const crypto = require('crypto');

/**
 * Get all devices
 * @param {Object} filter - Filter criteria
 * @returns {Promise<Array>} Array of devices
 */
exports.getAllDevices = async (filter = {}) => {
  return await Device.find(filter);
};

/**
 * Get device by ID
 * @param {string} id - Device ID
 * @returns {Promise<Object>} Device object
 */
exports.getDeviceById = async (id) => {
  return await Device.findById(id);
};

/**
 * Get device by API key
 * @param {string} apiKey - Device API key
 * @returns {Promise<Object>} Device object
 */
exports.getDeviceByApiKey = async (apiKey) => {
  return await Device.findOne({ apiKey });
};

/**
 * Create a new device
 * @param {Object} deviceData - Device data
 * @returns {Promise<Object>} Created device
 */
exports.createDevice = async (deviceData) => {
  // Generate API key if not provided
  if (!deviceData.apiKey) {
    deviceData.apiKey = crypto.randomBytes(32).toString('hex');
  }
  
  // Generate MQTT topic if not provided
  if (!deviceData.mqttTopic) {
    const deviceId = crypto.randomBytes(8).toString('hex');
    deviceData.mqttTopic = `agrimaan/iot/${deviceData.deviceType}/${deviceId}`;
  }
  
  return await Device.create(deviceData);
};

/**
 * Update device
 * @param {string} id - Device ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated device
 */
exports.updateDevice = async (id, updateData) => {
  return await Device.findByIdAndUpdate(
    id,
    { ...updateData, updatedAt: Date.now() },
    { new: true, runValidators: true }
  );
};

/**
 * Delete device
 * @param {string} id - Device ID
 * @returns {Promise<boolean>} True if deleted
 */
exports.deleteDevice = async (id) => {
  const device = await Device.findById(id);
  if (!device) {
    return false;
  }
  
  // Delete associated telemetry data
  await Telemetry.deleteMany({ device: id });
  
  // Delete the device
  await device.remove();
  return true;
};

/**
 * Get devices by field
 * @param {Object} filter - Filter criteria including field ID
 * @returns {Promise<Array>} Array of devices
 */
exports.getDevicesByField = async (filter) => {
  return await Device.find(filter);
};

/**
 * Get device status
 * @param {string} id - Device ID
 * @returns {Promise<Object>} Device status
 */
exports.getDeviceStatus = async (id) => {
  const device = await Device.findById(id);
  if (!device) {
    throw new Error('Device not found');
  }
  
  // Get latest telemetry
  const latestTelemetry = await Telemetry.findOne({ device: id })
    .sort({ timestamp: -1 })
    .limit(1);
  
  // Calculate if device is online based on last communication
  const isOnline = device.lastCommunication && 
    (new Date() - new Date(device.lastCommunication)) / 1000 < 600; // 10 minutes
  
  return {
    id: device._id,
    name: device.name,
    status: device.status,
    battery: device.battery,
    lastCommunication: device.lastCommunication,
    isOnline,
    latestTelemetry: latestTelemetry || null
  };
};

/**
 * Regenerate API key for a device
 * @param {string} id - Device ID
 * @returns {Promise<Object>} Updated device
 */
exports.regenerateApiKey = async (id) => {
  const newApiKey = crypto.randomBytes(32).toString('hex');
  
  return await Device.findByIdAndUpdate(
    id,
    { 
      apiKey: newApiKey,
      updatedAt: Date.now()
    },
    { new: true }
  );
};

/**
 * Get devices by type
 * @param {string} deviceType - Device type
 * @param {string} owner - Owner ID (optional)
 * @returns {Promise<Array>} Array of devices
 */
exports.getDevicesByType = async (deviceType, owner = null) => {
  const query = { deviceType };
  
  if (owner) {
    query.owner = owner;
  }
  
  return await Device.find(query);
};

/**
 * Get devices by status
 * @param {string} status - Device status
 * @param {string} owner - Owner ID (optional)
 * @returns {Promise<Array>} Array of devices
 */
exports.getDevicesByStatus = async (status, owner = null) => {
  const query = { status };
  
  if (owner) {
    query.owner = owner;
  }
  
  return await Device.find(query);
};

/**
 * Get nearby devices
 * @param {number} longitude - Longitude
 * @param {number} latitude - Latitude
 * @param {number} distance - Distance in meters
 * @param {string} owner - Owner ID (optional)
 * @returns {Promise<Array>} Array of devices
 */
exports.getNearbyDevices = async (longitude, latitude, distance, owner = null) => {
  const query = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: distance
      }
    }
  };
  
  if (owner) {
    query.owner = owner;
  }
  
  return await Device.find(query);
};

/**
 * Update device firmware
 * @param {string} id - Device ID
 * @param {string} version - Firmware version
 * @returns {Promise<Object>} Updated device
 */
exports.updateDeviceFirmware = async (id, version) => {
  return await Device.findByIdAndUpdate(
    id,
    { 
      'firmware.version': version,
      'firmware.lastUpdated': Date.now(),
      updatedAt: Date.now()
    },
    { new: true }
  );
};

/**
 * Update device battery status
 * @param {string} id - Device ID
 * @param {Object} batteryData - Battery data
 * @returns {Promise<Object>} Updated device
 */
exports.updateDeviceBattery = async (id, batteryData) => {
  return await Device.findByIdAndUpdate(
    id,
    { 
      'battery.level': batteryData.level,
      'battery.charging': batteryData.charging,
      updatedAt: Date.now()
    },
    { new: true }
  );
};