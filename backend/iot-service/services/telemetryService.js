const Telemetry = require('../models/Telemetry');
const Device = require('../models/Device');
const mongoose = require('mongoose');

/**
 * Get telemetry data for a device
 * @param {string} deviceId - Device ID
 * @param {string} startDate - Start date (ISO string)
 * @param {string} endDate - End date (ISO string)
 * @param {number} limit - Maximum number of records to return
 * @param {number} page - Page number for pagination
 * @returns {Promise<Object>} Telemetry data with pagination info
 */
exports.getDeviceTelemetry = async (deviceId, startDate, endDate, limit = 100, page = 1) => {
  const query = { device: deviceId };
  
  // Add date range filter if provided
  if (startDate || endDate) {
    query.timestamp = {};
    
    if (startDate) {
      query.timestamp.$gte = new Date(startDate);
    }
    
    if (endDate) {
      query.timestamp.$lte = new Date(endDate);
    }
  }
  
  // Calculate pagination
  const skip = (page - 1) * limit;
  
  // Get total count
  const total = await Telemetry.countDocuments(query);
  
  // Get telemetry data
  const telemetry = await Telemetry.find(query)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit);
  
  return {
    data: telemetry,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get latest telemetry for a device
 * @param {string} deviceId - Device ID
 * @returns {Promise<Object>} Latest telemetry data
 */
exports.getLatestTelemetry = async (deviceId) => {
  return await Telemetry.findOne({ device: deviceId })
    .sort({ timestamp: -1 })
    .limit(1);
};

/**
 * Create telemetry record
 * @param {Object} telemetryData - Telemetry data
 * @returns {Promise<Object>} Created telemetry record
 */
exports.createTelemetry = async (telemetryData) => {
  return await Telemetry.create(telemetryData);
};

/**
 * Get telemetry by ID
 * @param {string} id - Telemetry ID
 * @returns {Promise<Object>} Telemetry record
 */
exports.getTelemetryById = async (id) => {
  return await Telemetry.findById(id);
};

/**
 * Delete telemetry record
 * @param {string} id - Telemetry ID
 * @returns {Promise<boolean>} True if deleted
 */
exports.deleteTelemetry = async (id) => {
  const telemetry = await Telemetry.findById(id);
  if (!telemetry) {
    return false;
  }
  
  await telemetry.remove();
  return true;
};

/**
 * Get aggregated telemetry data
 * @param {string} deviceId - Device ID
 * @param {string} startDate - Start date (ISO string)
 * @param {string} endDate - End date (ISO string)
 * @param {string} interval - Aggregation interval (hour, day, week, month)
 * @param {string} metrics - Comma-separated list of metrics to aggregate
 * @returns {Promise<Array>} Aggregated telemetry data
 */
exports.getAggregatedTelemetry = async (deviceId, startDate, endDate, interval = 'day', metrics = 'all') => {
  const query = { device: mongoose.Types.ObjectId(deviceId) };
  
  // Add date range filter if provided
  if (startDate || endDate) {
    query.timestamp = {};
    
    if (startDate) {
      query.timestamp.$gte = new Date(startDate);
    }
    
    if (endDate) {
      query.timestamp.$lte = new Date(endDate);
    }
  }
  
  // Determine time grouping format based on interval
  let dateFormat;
  switch (interval) {
    case 'hour':
      dateFormat = { $dateToString: { format: '%Y-%m-%d %H:00', date: '$timestamp' } };
      break;
    case 'day':
      dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } };
      break;
    case 'week':
      // Group by ISO week
      dateFormat = {
        $concat: [
          { $dateToString: { format: '%Y-W%V', date: '$timestamp' } }
        ]
      };
      break;
    case 'month':
      dateFormat = { $dateToString: { format: '%Y-%m', date: '$timestamp' } };
      break;
    default:
      dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } };
  }
  
  // Determine which metrics to aggregate
  let metricsToAggregate = {};
  
  // Get device to determine device type and available metrics
  const device = await Device.findById(deviceId);
  if (!device) {
    throw new Error('Device not found');
  }
  
  // Define aggregation operations based on device type
  switch (device.deviceType) {
    case 'soil_sensor':
      if (metrics === 'all' || metrics.includes('moisture')) {
        metricsToAggregate['moisture'] = {
          avg: { $avg: '$readings.moisture' },
          min: { $min: '$readings.moisture' },
          max: { $max: '$readings.moisture' }
        };
      }
      if (metrics === 'all' || metrics.includes('temperature')) {
        metricsToAggregate['temperature'] = {
          avg: { $avg: '$readings.temperature' },
          min: { $min: '$readings.temperature' },
          max: { $max: '$readings.temperature' }
        };
      }
      break;
    case 'weather_station':
      if (metrics === 'all' || metrics.includes('temperature')) {
        metricsToAggregate['temperature'] = {
          avg: { $avg: '$readings.temperature' },
          min: { $min: '$readings.temperature' },
          max: { $max: '$readings.temperature' }
        };
      }
      if (metrics === 'all' || metrics.includes('humidity')) {
        metricsToAggregate['humidity'] = {
          avg: { $avg: '$readings.humidity' },
          min: { $min: '$readings.humidity' },
          max: { $max: '$readings.humidity' }
        };
      }
      if (metrics === 'all' || metrics.includes('rainfall')) {
        metricsToAggregate['rainfall'] = {
          sum: { $sum: '$readings.rainfall' },
          max: { $max: '$readings.rainfall' }
        };
      }
      break;
    // Add more device types as needed
  }
  
  // Always include battery level if available
  if (metrics === 'all' || metrics.includes('battery')) {
    metricsToAggregate['battery'] = {
      avg: { $avg: '$battery.level' },
      min: { $min: '$battery.level' },
      max: { $max: '$battery.level' }
    };
  }
  
  // Always include signal strength if available
  if (metrics === 'all' || metrics.includes('signal')) {
    metricsToAggregate['signal'] = {
      avg: { $avg: '$signalStrength' },
      min: { $min: '$signalStrength' },
      max: { $max: '$signalStrength' }
    };
  }
  
  // Build the aggregation pipeline
  const pipeline = [
    { $match: query },
    {
      $group: {
        _id: dateFormat,
        count: { $sum: 1 },
        firstTimestamp: { $min: '$timestamp' },
        lastTimestamp: { $max: '$timestamp' },
        ...metricsToAggregate
      }
    },
    { $sort: { firstTimestamp: 1 } }
  ];
  
  return await Telemetry.aggregate(pipeline);
};

/**
 * Get telemetry data for a field (multiple devices)
 * @param {Array} deviceIds - Array of device IDs
 * @param {string} startDate - Start date (ISO string)
 * @param {string} endDate - End date (ISO string)
 * @param {number} limit - Maximum number of records to return
 * @param {number} page - Page number for pagination
 * @returns {Promise<Object>} Telemetry data with pagination info
 */
exports.getFieldTelemetry = async (deviceIds, startDate, endDate, limit = 100, page = 1) => {
  const query = { device: { $in: deviceIds } };
  
  // Add date range filter if provided
  if (startDate || endDate) {
    query.timestamp = {};
    
    if (startDate) {
      query.timestamp.$gte = new Date(startDate);
    }
    
    if (endDate) {
      query.timestamp.$lte = new Date(endDate);
    }
  }
  
  // Calculate pagination
  const skip = (page - 1) * limit;
  
  // Get total count
  const total = await Telemetry.countDocuments(query);
  
  // Get telemetry data
  const telemetry = await Telemetry.find(query)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)
    .populate('device', 'name deviceType');
  
  return {
    data: telemetry,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Delete old telemetry data
 * @param {number} days - Number of days to keep
 * @returns {Promise<number>} Number of deleted records
 */
exports.deleteOldTelemetry = async (days = 90) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const result = await Telemetry.deleteMany({
    timestamp: { $lt: cutoffDate }
  });
  
  return result.deletedCount;
};