const mongoose = require('mongoose');

const MaintenanceSchema = new mongoose.Schema({
  device: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true
  },
  maintenanceType: {
    type: String,
    enum: [
      'routine',
      'repair',
      'calibration',
      'battery_replacement',
      'firmware_update',
      'cleaning',
      'inspection',
      'other'
    ],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scheduledDate: {
    type: Date
  },
  completedDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  cost: {
    type: Number,
    min: 0
  },
  partsReplaced: [{
    partName: String,
    partNumber: String,
    quantity: Number,
    cost: Number
  }],
  notes: {
    type: String
  },
  nextMaintenanceDate: {
    type: Date
  },
  attachments: [{
    filename: String,
    url: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  duration: {
    type: Number, // in minutes
    min: 0
  },
  technician: {
    name: String,
    contact: String,
    company: String
  }
}, {
  timestamps: true
});

// Indexes
MaintenanceSchema.index({ device: 1, scheduledDate: -1 });
MaintenanceSchema.index({ status: 1 });
MaintenanceSchema.index({ performedBy: 1 });

module.exports = mongoose.model('Maintenance', MaintenanceSchema);