const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  device: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: [true, 'Device reference is required']
  },
  type: {
    type: String,
    enum: [
      'low_battery', 
      'offline', 
      'threshold_exceeded', 
      'threshold_below', 
      'maintenance_required',
      'tamper_detected',
      'connectivity_issue',
      'system_error',
      'other'
    ],
    required: [true, 'Alert type is required']
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    default: 'info'
  },
  message: {
    type: String,
    required: [true, 'Alert message is required']
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  resolved: {
    type: Boolean,
    default: false
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  resolvedBy: {
    type: String, // User ID from user-service
    default: null
  },
  resolutionNotes: {
    type: String,
    default: null
  },
  telemetryData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  notificationSent: {
    type: Boolean,
    default: false
  },
  notificationTimestamp: {
    type: Date,
    default: null
  }
});

// Create compound index for device and timestamp
AlertSchema.index({ device: 1, timestamp: -1 });

// Create index for unresolved alerts
AlertSchema.index({ resolved: 1 });

// Method to resolve an alert
AlertSchema.methods.resolve = function(userId, notes = '') {
  this.resolved = true;
  this.resolvedAt = Date.now();
  this.resolvedBy = userId;
  this.resolutionNotes = notes;
  return this.save();
};

module.exports = mongoose.model('Alert', AlertSchema);