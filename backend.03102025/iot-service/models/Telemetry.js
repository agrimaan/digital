const mongoose = require('mongoose');

const TelemetrySchema = new mongoose.Schema({
  device: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: [true, 'Device reference is required']
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  readings: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Telemetry readings are required']
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: null
    }
  },
  battery: {
    level: {
      type: Number, // Percentage
      min: 0,
      max: 100
    },
    charging: {
      type: Boolean
    }
  },
  signalStrength: {
    type: Number, // dBm
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

// Create compound index for device and timestamp
TelemetrySchema.index({ device: 1, timestamp: -1 });

// Create geospatial index for location field
TelemetrySchema.index({ location: '2dsphere' });

// Validate readings based on device type
TelemetrySchema.pre('save', async function(next) {
  try {
    const Device = mongoose.model('Device');
    const device = await Device.findById(this.device);
    
    if (!device) {
      throw new Error('Device not found');
    }
    
    // Validate readings based on device type
    switch (device.deviceType) {
      case 'soil_sensor':
        // Ensure soil sensor readings have required fields
        if (!this.readings.moisture && !this.readings.temperature) {
          throw new Error('Soil sensor readings must include moisture or temperature');
        }
        break;
      case 'weather_station':
        // Ensure weather station readings have required fields
        if (!this.readings.temperature && !this.readings.humidity) {
          throw new Error('Weather station readings must include temperature or humidity');
        }
        break;
      // Add more device type validations as needed
    }
    
    // Update device's last communication timestamp
    await Device.findByIdAndUpdate(this.device, {
      lastCommunication: Date.now(),
      'battery.level': this.battery?.level || device.battery.level,
      'battery.charging': this.battery?.charging !== undefined ? this.battery.charging : device.battery.charging
    });
    
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Telemetry', TelemetrySchema);