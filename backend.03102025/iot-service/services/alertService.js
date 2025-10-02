const Alert = require('../models/Alert');
const Device = require('../models/Device');
const mongoose = require('mongoose');

/**
 * Get alerts with filtering
 * @param {Object} deviceFilter - Device filter criteria
 * @param {string} resolved - Filter by resolved status (all, true, false)
 * @param {string} severity - Filter by severity
 * @param {string} type - Filter by alert type
 * @param {string} startDate - Start date (ISO string)
 * @param {string} endDate - End date (ISO string)
 * @param {number} limit - Maximum number of records to return
 * @param {number} page - Page number for pagination
 * @returns {Promise<Object>} Alerts with pagination info
 */
exports.getAlerts = async (deviceFilter = {}, resolved = 'all', severity, type, startDate, endDate, limit = 100, page = 1) => {
  const query = { ...deviceFilter };
  
  // Add resolved filter
  if (resolved !== 'all') {
    query.resolved = resolved === 'true';
  }
  
  // Add severity filter if provided
  if (severity) {
    query.severity = severity;
  }
  
  // Add type filter if provided
  if (type) {
    query.type = type;
  }
  
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
  const total = await Alert.countDocuments(query);
  
  // Get alerts
  const alerts = await Alert.find(query)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)
    .populate('device', 'name deviceType');
  
  return {
    data: alerts,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get alert by ID
 * @param {string} id - Alert ID
 * @returns {Promise<Object>} Alert object
 */
exports.getAlertById = async (id) => {
  return await Alert.findById(id);
};

/**
 * Create alert
 * @param {Object} alertData - Alert data
 * @returns {Promise<Object>} Created alert
 */
exports.createAlert = async (alertData) => {
  return await Alert.create(alertData);
};

/**
 * Resolve alert
 * @param {string} id - Alert ID
 * @param {string} userId - User ID resolving the alert
 * @param {string} notes - Resolution notes
 * @returns {Promise<Object>} Resolved alert
 */
exports.resolveAlert = async (id, userId, notes = '') => {
  const alert = await Alert.findById(id);
  
  if (!alert) {
    throw new Error('Alert not found');
  }
  
  alert.resolved = true;
  alert.resolvedAt = Date.now();
  alert.resolvedBy = userId;
  alert.resolutionNotes = notes;
  
  return await alert.save();
};

/**
 * Delete alert
 * @param {string} id - Alert ID
 * @returns {Promise<boolean>} True if deleted
 */
exports.deleteAlert = async (id) => {
  const alert = await Alert.findById(id);
  
  if (!alert) {
    return false;
  }
  
  await alert.remove();
  return true;
};

/**
 * Get alerts by device
 * @param {string} deviceId - Device ID
 * @param {string} resolved - Filter by resolved status (all, true, false)
 * @param {string} severity - Filter by severity
 * @param {string} type - Filter by alert type
 * @param {string} startDate - Start date (ISO string)
 * @param {string} endDate - End date (ISO string)
 * @param {number} limit - Maximum number of records to return
 * @param {number} page - Page number for pagination
 * @returns {Promise<Object>} Alerts with pagination info
 */
exports.getAlertsByDevice = async (deviceId, resolved = 'all', severity, type, startDate, endDate, limit = 100, page = 1) => {
  return await this.getAlerts(
    { device: deviceId },
    resolved,
    severity,
    type,
    startDate,
    endDate,
    limit,
    page
  );
};

/**
 * Get alerts summary
 * @param {Object} deviceFilter - Device filter criteria
 * @returns {Promise<Object>} Alerts summary
 */
exports.getAlertsSummary = async (deviceFilter = {}) => {
  // Get counts by status
  const [totalCount, unresolvedCount, criticalCount] = await Promise.all([
    Alert.countDocuments(deviceFilter),
    Alert.countDocuments({ ...deviceFilter, resolved: false }),
    Alert.countDocuments({ ...deviceFilter, resolved: false, severity: 'critical' })
  ]);
  
  // Get counts by type for unresolved alerts
  const typeAggregation = await Alert.aggregate([
    { $match: { ...deviceFilter, resolved: false } },
    { $group: { _id: '$type', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  // Get counts by device for unresolved alerts
  const deviceAggregation = await Alert.aggregate([
    { $match: { ...deviceFilter, resolved: false } },
    { $group: { _id: '$device', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);
  
  // Get device details for the top devices
  const deviceIds = deviceAggregation.map(item => item._id);
  const devices = await Device.find({ _id: { $in: deviceIds } }, 'name deviceType');
  
  // Map device details to the aggregation results
  const deviceMap = {};
  devices.forEach(device => {
    deviceMap[device._id] = {
      name: device.name,
      deviceType: device.deviceType
    };
  });
  
  const topDevices = deviceAggregation.map(item => ({
    device: item._id,
    name: deviceMap[item._id]?.name || 'Unknown Device',
    deviceType: deviceMap[item._id]?.deviceType || 'unknown',
    count: item.count
  }));
  
  return {
    total: totalCount,
    unresolved: unresolvedCount,
    critical: criticalCount,
    byType: typeAggregation.map(item => ({
      type: item._id,
      count: item.count
    })),
    topDevices
  };
};

/**
 * Process telemetry data for alerts
 * @param {Object} telemetry - Telemetry data
 * @returns {Promise<Array>} Created alerts
 */
exports.processTelemetryForAlerts = async (telemetry) => {
  const alerts = [];
  const device = await Device.findById(telemetry.device);
  
  if (!device) {
    throw new Error('Device not found');
  }
  
  // Check battery level
  if (telemetry.battery && telemetry.battery.level !== undefined) {
    if (telemetry.battery.level < 20 && !telemetry.battery.charging) {
      const existingAlert = await Alert.findOne({
        device: device._id,
        type: 'low_battery',
        resolved: false
      });
      
      if (!existingAlert) {
        const alert = await Alert.create({
          device: device._id,
          type: 'low_battery',
          severity: telemetry.battery.level < 10 ? 'critical' : 'warning',
          message: `Low battery (${telemetry.battery.level}%) on device ${device.name}`,
          telemetryData: {
            batteryLevel: telemetry.battery.level,
            charging: telemetry.battery.charging
          }
        });
        
        alerts.push(alert);
      }
    }
  }
  
  // Check device-specific thresholds based on device type
  switch (device.deviceType) {
    case 'soil_sensor':
      // Check soil moisture
      if (telemetry.readings.moisture !== undefined) {
        // Example threshold: moisture below 20% is critical
        if (telemetry.readings.moisture < 20) {
          const existingAlert = await Alert.findOne({
            device: device._id,
            type: 'threshold_below',
            resolved: false,
            'telemetryData.parameter': 'moisture'
          });
          
          if (!existingAlert) {
            const alert = await Alert.create({
              device: device._id,
              type: 'threshold_below',
              severity: 'critical',
              message: `Low soil moisture (${telemetry.readings.moisture}%) detected by ${device.name}`,
              telemetryData: {
                parameter: 'moisture',
                value: telemetry.readings.moisture,
                threshold: 20
              }
            });
            
            alerts.push(alert);
          }
        }
      }
      break;
      
    case 'weather_station':
      // Check temperature
      if (telemetry.readings.temperature !== undefined) {
        // Example threshold: temperature above 40°C is critical
        if (telemetry.readings.temperature > 40) {
          const existingAlert = await Alert.findOne({
            device: device._id,
            type: 'threshold_exceeded',
            resolved: false,
            'telemetryData.parameter': 'temperature'
          });
          
          if (!existingAlert) {
            const alert = await Alert.create({
              device: device._id,
              type: 'threshold_exceeded',
              severity: 'critical',
              message: `High temperature (${telemetry.readings.temperature}°C) detected by ${device.name}`,
              telemetryData: {
                parameter: 'temperature',
                value: telemetry.readings.temperature,
                threshold: 40
              }
            });
            
            alerts.push(alert);
          }
        }
      }
      break;
      
    // Add more device types as needed
  }
  
  return alerts;
};

/**
 * Auto-resolve alerts based on telemetry
 * @param {Object} telemetry - Telemetry data
 * @returns {Promise<number>} Number of resolved alerts
 */
exports.autoResolveAlerts = async (telemetry) => {
  const device = await Device.findById(telemetry.device);
  
  if (!device) {
    throw new Error('Device not found');
  }
  
  const resolutions = [];
  
  // Auto-resolve low battery alerts if battery level is now good
  if (telemetry.battery && telemetry.battery.level > 30) {
    const lowBatteryAlerts = await Alert.find({
      device: device._id,
      type: 'low_battery',
      resolved: false
    });
    
    for (const alert of lowBatteryAlerts) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
      alert.resolvedBy = 'system';
      alert.resolutionNotes = `Auto-resolved: Battery level improved to ${telemetry.battery.level}%`;
      await alert.save();
      resolutions.push(alert._id);
    }
  }
  
  // Auto-resolve threshold alerts based on device type
  switch (device.deviceType) {
    case 'soil_sensor':
      // Auto-resolve low moisture alerts if moisture is now good
      if (telemetry.readings.moisture !== undefined && telemetry.readings.moisture >= 25) {
        const moistureAlerts = await Alert.find({
          device: device._id,
          type: 'threshold_below',
          resolved: false,
          'telemetryData.parameter': 'moisture'
        });
        
        for (const alert of moistureAlerts) {
          alert.resolved = true;
          alert.resolvedAt = Date.now();
          alert.resolvedBy = 'system';
          alert.resolutionNotes = `Auto-resolved: Soil moisture improved to ${telemetry.readings.moisture}%`;
          await alert.save();
          resolutions.push(alert._id);
        }
      }
      break;
      
    case 'weather_station':
      // Auto-resolve high temperature alerts if temperature is now acceptable
      if (telemetry.readings.temperature !== undefined && telemetry.readings.temperature <= 35) {
        const temperatureAlerts = await Alert.find({
          device: device._id,
          type: 'threshold_exceeded',
          resolved: false,
          'telemetryData.parameter': 'temperature'
        });
        
        for (const alert of temperatureAlerts) {
          alert.resolved = true;
          alert.resolvedAt = Date.now();
          alert.resolvedBy = 'system';
          alert.resolutionNotes = `Auto-resolved: Temperature decreased to ${telemetry.readings.temperature}°C`;
          await alert.save();
          resolutions.push(alert._id);
        }
      }
      break;
      
    // Add more device types as needed
  }
  
  return resolutions.length;
};