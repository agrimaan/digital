const Reading = require('../models/Reading');
const Device = require('../models/Device');
const { validationResult } = require('express-validator');

// @desc    Get all readings
// @route   GET /api/iot/readings
// @access  Private
exports.getReadings = async (req, res) => {
  try {
    const { deviceId, readingType, startDate, endDate, page = 1, limit = 100 } = req.query;
    
    const query = {};
    
    if (deviceId) query.device = deviceId;
    if (readingType) query.readingType = readingType;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    const readings = await Reading.find(query)
      .populate('device', 'name deviceType')
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await Reading.countDocuments(query);
    
    res.json({
      success: true,
      data: readings,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get readings error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get single reading
// @route   GET /api/iot/readings/:id
// @access  Private
exports.getReading = async (req, res) => {
  try {
    const reading = await Reading.findById(req.params.id)
      .populate('device');
    
    if (!reading) {
      return res.status(404).json({ success: false, error: 'Reading not found' });
    }
    
    res.json({ success: true, data: reading });
  } catch (error) {
    console.error('Get reading error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Create reading
// @route   POST /api/iot/readings
// @access  Private
exports.createReading = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const device = await Device.findById(req.body.device);
    if (!device) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }
    
    // Check for anomalies (simple threshold-based detection)
    const isAnomaly = await detectAnomaly(req.body);
    
    const reading = await Reading.create({
      ...req.body,
      isAnomaly,
      anomalyScore: isAnomaly ? 0.8 : 0.1
    });
    
    // Update device last reading time
    device.lastReading = Date.now();
    await device.save();
    
    res.status(201).json({ success: true, data: reading });
  } catch (error) {
    console.error('Create reading error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Delete reading
// @route   DELETE /api/iot/readings/:id
// @access  Private
exports.deleteReading = async (req, res) => {
  try {
    const reading = await Reading.findById(req.params.id);
    
    if (!reading) {
      return res.status(404).json({ success: false, error: 'Reading not found' });
    }
    
    await reading.deleteOne();
    
    res.json({ success: true, data: {} });
  } catch (error) {
    console.error('Delete reading error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get readings for a device
// @route   GET /api/iot/readings/device/:deviceId
// @access  Private
exports.getDeviceReadings = async (req, res) => {
  try {
    const { readingType, startDate, endDate, limit = 100 } = req.query;
    
    const query = { device: req.params.deviceId };
    
    if (readingType) query.readingType = readingType;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    const readings = await Reading.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    
    res.json({ success: true, data: readings });
  } catch (error) {
    console.error('Get device readings error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get readings for a field
// @route   GET /api/iot/readings/field/:fieldId
// @access  Private
exports.getFieldReadings = async (req, res) => {
  try {
    const devices = await Device.find({ field: req.params.fieldId });
    const deviceIds = devices.map(d => d._id);
    
    const readings = await Reading.find({ device: { $in: deviceIds } })
      .populate('device', 'name deviceType')
      .sort({ timestamp: -1 })
      .limit(100);
    
    res.json({ success: true, data: readings });
  } catch (error) {
    console.error('Get field readings error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get readings by date range
// @route   POST /api/iot/readings/date-range
// @access  Private
exports.getReadingsByDateRange = async (req, res) => {
  try {
    const { deviceId, startDate, endDate, readingTypes } = req.body;
    
    const query = {
      device: deviceId,
      timestamp: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
    
    if (readingTypes && readingTypes.length > 0) {
      query.readingType = { $in: readingTypes };
    }
    
    const readings = await Reading.find(query).sort({ timestamp: 1 });
    
    res.json({ success: true, data: readings });
  } catch (error) {
    console.error('Get readings by date range error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get latest readings for a device
// @route   GET /api/iot/readings/device/:deviceId/latest
// @access  Private
exports.getLatestReadings = async (req, res) => {
  try {
    const readings = await Reading.aggregate([
      { $match: { device: mongoose.Types.ObjectId(req.params.deviceId) } },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$readingType',
          latestReading: { $first: '$$ROOT' }
        }
      }
    ]);
    
    res.json({ success: true, data: readings });
  } catch (error) {
    console.error('Get latest readings error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get reading statistics
// @route   GET /api/iot/readings/device/:deviceId/stats
// @access  Private
exports.getReadingStats = async (req, res) => {
  try {
    const { readingType, startDate, endDate } = req.query;
    
    const matchQuery = { device: mongoose.Types.ObjectId(req.params.deviceId) };
    
    if (readingType) matchQuery.readingType = readingType;
    if (startDate || endDate) {
      matchQuery.timestamp = {};
      if (startDate) matchQuery.timestamp.$gte = new Date(startDate);
      if (endDate) matchQuery.timestamp.$lte = new Date(endDate);
    }
    
    const stats = await Reading.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$readingType',
          count: { $sum: 1 },
          avg: { $avg: '$value' },
          min: { $min: '$value' },
          max: { $max: '$value' },
          stdDev: { $stdDevPop: '$value' }
        }
      }
    ]);
    
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get reading stats error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Helper function to detect anomalies
async function detectAnomaly(readingData) {
  try {
    // Get historical data for the same reading type
    const historicalReadings = await Reading.find({
      device: readingData.device,
      readingType: readingData.readingType
    })
      .sort({ timestamp: -1 })
      .limit(100);
    
    if (historicalReadings.length < 10) {
      return false; // Not enough data for anomaly detection
    }
    
    // Calculate mean and standard deviation
    const values = historicalReadings.map(r => r.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Check if current value is more than 3 standard deviations from mean
    const zScore = Math.abs((readingData.value - mean) / stdDev);
    
    return zScore > 3;
  } catch (error) {
    console.error('Anomaly detection error:', error);
    return false;
  }
}