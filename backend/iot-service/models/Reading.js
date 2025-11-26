const mongoose = require('mongoose');

const ReadingSchema = new mongoose.Schema({
  device: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true,
    index: true
  },
  readingType: {
    type: String,
    required: true,
    enum: [
      'temperature',
      'humidity',
      'soil_moisture',
      'soil_temperature',
      'soil_ph',
      'soil_ec',
      'soil_nitrogen',
      'soil_phosphorus',
      'soil_potassium',
      'light_intensity',
      'rainfall',
      'wind_speed',
      'wind_direction',
      'atmospheric_pressure',
      'water_level',
      'battery_level',
      'signal_strength',
      'other'
    ]
  },
  value: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number] // [longitude, latitude]
    }
  },
  quality: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor', 'diseased'],
    default: 'good'
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  isAnomaly: {
    type: Boolean,
    default: false
  },
  anomalyScore: {
    type: Number,
    min: 0,
    max: 1
  },
  processed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
ReadingSchema.index({ device: 1, timestamp: -1 });
ReadingSchema.index({ device: 1, readingType: 1, timestamp: -1 });
ReadingSchema.index({ timestamp: -1 });
ReadingSchema.index({ isAnomaly: 1, timestamp: -1 });

// TTL index to automatically delete old readings after 1 year
ReadingSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 });

module.exports = mongoose.model('Reading', ReadingSchema);