const Maintenance = require('../models/Maintenance');
const Device = require('../models/Device');
const { validationResult } = require('express-validator');

// @desc    Get all maintenance logs
// @route   GET /api/iot/maintenance
// @access  Private
exports.getMaintenanceLogs = async (req, res) => {
  try {
    const { status, deviceId, startDate, endDate, page = 1, limit = 20 } = req.query;
    
    const query = {};
    
    if (status) query.status = status;
    if (deviceId) query.device = deviceId;
    if (startDate || endDate) {
      query.scheduledDate = {};
      if (startDate) query.scheduledDate.$gte = new Date(startDate);
      if (endDate) query.scheduledDate.$lte = new Date(endDate);
    }
    
    const maintenanceLogs = await Maintenance.find(query)
      .populate('device', 'name deviceType')
      .populate('performedBy', 'name email')
      .sort({ scheduledDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await Maintenance.countDocuments(query);
    
    res.json({
      success: true,
      data: maintenanceLogs,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get maintenance logs error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get single maintenance log
// @route   GET /api/iot/maintenance/:id
// @access  Private
exports.getMaintenanceLog = async (req, res) => {
  try {
    const maintenanceLog = await Maintenance.findById(req.params.id)
      .populate('device')
      .populate('performedBy', 'name email');
    
    if (!maintenanceLog) {
      return res.status(404).json({ success: false, error: 'Maintenance log not found' });
    }
    
    res.json({ success: true, data: maintenanceLog });
  } catch (error) {
    console.error('Get maintenance log error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Create maintenance log
// @route   POST /api/iot/maintenance
// @access  Private
exports.createMaintenanceLog = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const device = await Device.findById(req.body.device);
    if (!device) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }
    
    const maintenanceLog = await Maintenance.create({
      ...req.body,
      performedBy: req.user.id
    });
    
    // Update device last maintenance date if completed
    if (req.body.status === 'completed') {
      device.lastMaintenance = maintenanceLog.completedDate || Date.now();
      if (req.body.nextMaintenanceDate) {
        device.nextMaintenance = req.body.nextMaintenanceDate;
      }
      await device.save();
    }
    
    res.status(201).json({ success: true, data: maintenanceLog });
  } catch (error) {
    console.error('Create maintenance log error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Update maintenance log
// @route   PUT /api/iot/maintenance/:id
// @access  Private
exports.updateMaintenanceLog = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    let maintenanceLog = await Maintenance.findById(req.params.id);
    
    if (!maintenanceLog) {
      return res.status(404).json({ success: false, error: 'Maintenance log not found' });
    }
    
    maintenanceLog = await Maintenance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    // Update device maintenance dates if status changed to completed
    if (req.body.status === 'completed') {
      const device = await Device.findById(maintenanceLog.device);
      if (device) {
        device.lastMaintenance = maintenanceLog.completedDate || Date.now();
        if (req.body.nextMaintenanceDate) {
          device.nextMaintenance = req.body.nextMaintenanceDate;
        }
        await device.save();
      }
    }
    
    res.json({ success: true, data: maintenanceLog });
  } catch (error) {
    console.error('Update maintenance log error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Delete maintenance log
// @route   DELETE /api/iot/maintenance/:id
// @access  Private
exports.deleteMaintenanceLog = async (req, res) => {
  try {
    const maintenanceLog = await Maintenance.findById(req.params.id);
    
    if (!maintenanceLog) {
      return res.status(404).json({ success: false, error: 'Maintenance log not found' });
    }
    
    await maintenanceLog.deleteOne();
    
    res.json({ success: true, data: {} });
  } catch (error) {
    console.error('Delete maintenance log error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get maintenance logs for a device
// @route   GET /api/iot/maintenance/device/:deviceId
// @access  Private
exports.getDeviceMaintenanceLogs = async (req, res) => {
  try {
    const maintenanceLogs = await Maintenance.find({ device: req.params.deviceId })
      .populate('performedBy', 'name email')
      .sort({ scheduledDate: -1 });
    
    res.json({ success: true, data: maintenanceLogs });
  } catch (error) {
    console.error('Get device maintenance logs error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Schedule maintenance log
// @route   POST /api/iot/maintenance/schedule
// @access  Private
exports.scheduleMaintenanceLog = async (req, res) => {
  try {
    const { device, scheduledDate, maintenanceType, description } = req.body;
    
    const deviceExists = await Device.findById(device);
    if (!deviceExists) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }
    
    const maintenanceLog = await Maintenance.create({
      device,
      scheduledDate,
      maintenanceType,
      description,
      performedBy: req.user.id,
      status: 'scheduled'
    });
    
    res.status(201).json({ success: true, data: maintenanceLog });
  } catch (error) {
    console.error('Schedule maintenance log error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};