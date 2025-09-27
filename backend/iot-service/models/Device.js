const mongoose = require('mongoose');
const crypto = require('crypto');

const DeviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Device name is required'],
    trim: true
  },
  deviceType: {
    type: String,
    required: [true, 'Device type is required'],
    enum: [
      'soil_sensor', 
      'weather_station', 
      'irrigation_controller', 
      'camera', 
      'drone', 
      'smart_sprayer',
      'gps_tracker',
      'other'
    ]
  },
  owner: {
    type: String, // User ID from user-service
    required: [true, 'Device owner is required']
  },
  field: {
    type: String, // Field ID from field-service
    required: [true, 'Field ID is required']
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Device coordinates are required']
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'offline', 'error'],
    default: 'active'
  },
  firmware: {
    version: {
      type: String,
      default: '1.0.0'
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  battery: {
    level: {
      type: Number, // Percentage
      min: 0,
      max: 100,
      default: 100
    },
    charging: {
      type: Boolean,
      default: false
    }
  },
  connectivity: {
    type: String,
    enum: ['wifi', 'cellular', 'lora', 'bluetooth', 'zigbee', 'other'],
    default: 'wifi'
  },
  apiKey: {
    type: String,
    unique: true
  },
  mqttTopic: {
    type: String
  },
  telemetryInterval: {
    type: Number, // in seconds
    default: 300 // 5 minutes
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  lastCommunication: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create geospatial index for location field
DeviceSchema.index({ location: '2dsphere' });

// Generate API key before saving
DeviceSchema.pre('save', function(next) {
  if (!this.apiKey) {
    this.apiKey = crypto.randomBytes(32).toString('hex');
  }
  
  // Generate MQTT topic if not set
  if (!this.mqttTopic) {
    this.mqttTopic = `agrimaan/iot/${this.deviceType}/${this._id}`;
  }
  
  next();
});

// Update the updatedAt field on save
DeviceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Device', DeviceSchema);