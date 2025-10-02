const Reading = require('../models/Reading');
const Device = require('../models/Device');
const Maintenance = require('../models/Maintenance');
const mongoose = require('mongoose');

// @desc    Get field IoT analytics
// @route   GET /api/iot/analytics/fields/:fieldId
// @access  Private
exports.getFieldAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Get all devices for the field
    const devices = await Device.find({ field: req.params.fieldId });
    const deviceIds = devices.map(d => d._id);
    
    if (deviceIds.length === 0) {
      return res.json({
        success: true,
        data: {
          totalDevices: 0,
          activeDevices: 0,
          totalReadings: 0,
          averageReadings: {}
        }
      });
    }
    
    const matchQuery = { device: { $in: deviceIds } };
    
    if (startDate || endDate) {
      matchQuery.timestamp = {};
      if (startDate) matchQuery.timestamp.$gte = new Date(startDate);
      if (endDate) matchQuery.timestamp.$lte = new Date(endDate);
    }
    
    // Get reading statistics
    const readingStats = await Reading.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$readingType',
          count: { $sum: 1 },
          avg: { $avg: '$value' },
          min: { $min: '$value' },
          max: { $max: '$value' }
        }
      }
    ]);
    
    // Get device status counts
    const deviceStatusCounts = devices.reduce((acc, device) => {
      acc[device.status] = (acc[device.status] || 0) + 1;
      return acc;
    }, {});
    
    // Get total readings count
    const totalReadings = await Reading.countDocuments(matchQuery);
    
    res.json({
      success: true,
      data: {
        totalDevices: devices.length,
        deviceStatusCounts,
        totalReadings,
        readingStats,
        devices: devices.map(d => ({
          id: d._id,
          name: d.name,
          type: d.deviceType,
          status: d.status,
          batteryLevel: d.batteryLevel
        }))
      }
    });
  } catch (error) {
    console.error('Get field analytics error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get device analytics
// @route   GET /api/iot/analytics/devices/:deviceId
// @access  Private
exports.getDeviceAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const device = await Device.findById(req.params.deviceId);
    if (!device) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }
    
    const matchQuery = { device: mongoose.Types.ObjectId(req.params.deviceId) };
    
    if (startDate || endDate) {
      matchQuery.timestamp = {};
      if (startDate) matchQuery.timestamp.$gte = new Date(startDate);
      if (endDate) matchQuery.timestamp.$lte = new Date(endDate);
    }
    
    // Get reading statistics by type
    const readingStats = await Reading.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$readingType',
          count: { $sum: 1 },
          avg: { $avg: '$value' },
          min: { $min: '$value' },
          max: { $max: '$value' },
          latest: { $last: '$value' },
          latestTimestamp: { $last: '$timestamp' }
        }
      }
    ]);
    
    // Get anomaly count
    const anomalyCount = await Reading.countDocuments({
      ...matchQuery,
      isAnomaly: true
    });
    
    // Get maintenance history
    const maintenanceHistory = await Maintenance.find({ device: req.params.deviceId })
      .sort({ scheduledDate: -1 })
      .limit(5);
    
    // Calculate uptime
    const totalReadings = await Reading.countDocuments(matchQuery);
    const expectedReadings = device.readingInterval 
      ? Math.floor((Date.now() - device.installationDate) / (device.readingInterval * 1000))
      : totalReadings;
    const uptime = expectedReadings > 0 ? (totalReadings / expectedReadings) * 100 : 100;
    
    res.json({
      success: true,
      data: {
        device: {
          id: device._id,
          name: device.name,
          type: device.deviceType,
          status: device.status,
          batteryLevel: device.batteryLevel,
          lastReading: device.lastReading,
          installationDate: device.installationDate
        },
        readingStats,
        anomalyCount,
        uptime: uptime.toFixed(2),
        maintenanceHistory
      }
    });
  } catch (error) {
    console.error('Get device analytics error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get device health score
// @route   GET /api/iot/analytics/devices/:deviceId/health
// @access  Private
exports.getDeviceHealthScore = async (req, res) => {
  try {
    const device = await Device.findById(req.params.deviceId);
    if (!device) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }
    
    let healthScore = 100;
    const issues = [];
    
    // Check battery level
    if (device.batteryLevel !== undefined) {
      if (device.batteryLevel < 20) {
        healthScore -= 30;
        issues.push({ type: 'battery', severity: 'high', message: 'Battery level critically low' });
      } else if (device.batteryLevel < 50) {
        healthScore -= 15;
        issues.push({ type: 'battery', severity: 'medium', message: 'Battery level low' });
      }
    }
    
    // Check last reading time
    if (device.lastReading) {
      const hoursSinceLastReading = (Date.now() - device.lastReading) / (1000 * 60 * 60);
      if (hoursSinceLastReading > 24) {
        healthScore -= 25;
        issues.push({ type: 'connectivity', severity: 'high', message: 'No readings in 24+ hours' });
      } else if (hoursSinceLastReading > 12) {
        healthScore -= 10;
        issues.push({ type: 'connectivity', severity: 'medium', message: 'No readings in 12+ hours' });
      }
    }
    
    // Check maintenance schedule
    if (device.nextMaintenance && device.nextMaintenance < Date.now()) {
      healthScore -= 15;
      issues.push({ type: 'maintenance', severity: 'medium', message: 'Maintenance overdue' });
    }
    
    // Check for recent anomalies
    const recentAnomalies = await Reading.countDocuments({
      device: req.params.deviceId,
      isAnomaly: true,
      timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });
    
    if (recentAnomalies > 10) {
      healthScore -= 20;
      issues.push({ type: 'data_quality', severity: 'high', message: 'High number of anomalous readings' });
    } else if (recentAnomalies > 5) {
      healthScore -= 10;
      issues.push({ type: 'data_quality', severity: 'medium', message: 'Elevated anomalous readings' });
    }
    
    // Ensure score doesn't go below 0
    healthScore = Math.max(0, healthScore);
    
    // Determine health status
    let healthStatus = 'excellent';
    if (healthScore < 50) healthStatus = 'poor';
    else if (healthScore < 70) healthStatus = 'fair';
    else if (healthScore < 90) healthStatus = 'good';
    
    res.json({
      success: true,
      data: {
        deviceId: device._id,
        deviceName: device.name,
        healthScore,
        healthStatus,
        issues,
        lastChecked: new Date()
      }
    });
  } catch (error) {
    console.error('Get device health score error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get field IoT summary
// @route   GET /api/iot/analytics/fields/:fieldId/summary
// @access  Private
exports.getFieldIoTSummary = async (req, res) => {
  try {
    const devices = await Device.find({ field: req.params.fieldId });
    
    const summary = {
      totalDevices: devices.length,
      devicesByType: {},
      devicesByStatus: {},
      averageBatteryLevel: 0,
      devicesNeedingMaintenance: 0,
      offlineDevices: 0
    };
    
    let totalBattery = 0;
    let batteryCount = 0;
    
    devices.forEach(device => {
      // Count by type
      summary.devicesByType[device.deviceType] = (summary.devicesByType[device.deviceType] || 0) + 1;
      
      // Count by status
      summary.devicesByStatus[device.status] = (summary.devicesByStatus[device.status] || 0) + 1;
      
      // Calculate average battery
      if (device.batteryLevel !== undefined) {
        totalBattery += device.batteryLevel;
        batteryCount++;
      }
      
      // Count devices needing maintenance
      if (device.nextMaintenance && device.nextMaintenance < Date.now()) {
        summary.devicesNeedingMaintenance++;
      }
      
      // Count offline devices
      if (device.status === 'offline' || device.status === 'error') {
        summary.offlineDevices++;
      }
    });
    
    summary.averageBatteryLevel = batteryCount > 0 ? (totalBattery / batteryCount).toFixed(2) : 0;
    
    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Get field IoT summary error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get anomaly detection results
// @route   GET /api/iot/analytics/devices/:deviceId/anomalies
// @access  Private
exports.getAnomalyDetection = async (req, res) => {
  try {
    const { startDate, endDate, limit = 50 } = req.query;
    
    const query = {
      device: req.params.deviceId,
      isAnomaly: true
    };
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    const anomalies = await Reading.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    
    // Group anomalies by type
    const anomaliesByType = anomalies.reduce((acc, anomaly) => {
      if (!acc[anomaly.readingType]) {
        acc[anomaly.readingType] = [];
      }
      acc[anomaly.readingType].push(anomaly);
      return acc;
    }, {});
    
    res.json({
      success: true,
      data: {
        totalAnomalies: anomalies.length,
        anomalies,
        anomaliesByType
      }
    });
  } catch (error) {
    console.error('Get anomaly detection error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get predictive analytics
// @route   GET /api/iot/analytics/fields/:fieldId/predictions
// @access  Private
exports.getPredictiveAnalytics = async (req, res) => {
  try {
    const devices = await Device.find({ field: req.params.fieldId });
    const deviceIds = devices.map(d => d._id);
    
    // Get recent readings for trend analysis
    const recentReadings = await Reading.find({
      device: { $in: deviceIds },
      timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }).sort({ timestamp: 1 });
    
    // Simple trend analysis
    const trends = {};
    const readingsByType = recentReadings.reduce((acc, reading) => {
      if (!acc[reading.readingType]) {
        acc[reading.readingType] = [];
      }
      acc[reading.readingType].push(reading.value);
      return acc;
    }, {});
    
    Object.keys(readingsByType).forEach(type => {
      const values = readingsByType[type];
      if (values.length > 1) {
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));
        
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        
        const change = ((secondAvg - firstAvg) / firstAvg) * 100;
        
        trends[type] = {
          trend: change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable',
          changePercent: change.toFixed(2),
          prediction: secondAvg + (secondAvg - firstAvg)
        };
      }
    });
    
    // Predict maintenance needs
    const maintenancePredictions = devices
      .filter(d => d.nextMaintenance)
      .map(d => ({
        deviceId: d._id,
        deviceName: d.name,
        nextMaintenance: d.nextMaintenance,
        daysUntilMaintenance: Math.ceil((d.nextMaintenance - Date.now()) / (1000 * 60 * 60 * 24))
      }))
      .filter(p => p.daysUntilMaintenance <= 30);
    
    res.json({
      success: true,
      data: {
        trends,
        maintenancePredictions,
        generatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Get predictive analytics error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};