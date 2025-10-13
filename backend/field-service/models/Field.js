const mongoose = require('mongoose');

const FieldSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Field name is required'],
    trim: true
  },
  owner: {
    type: String, // User ID from user-service
    required: [true, 'Field owner is required']
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Field coordinates are required']
    }
  },
    locationName: {
    type: String,
    trim: true,
    default: ''
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  unit: {
    type: String,
    enum: ['acre', 'hectare'],
    default: 'acre'
  },
  area: {
    type: Number, // in hectares
    required: [true, 'Field area is required']
  },
  boundary: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Boundary'
  },
  soilType: {
    type: String,
    enum: ['clay', 'sandy', 'loamy', 'silty', 'peaty', 'chalky'],
    default: 'none'
  },
  crops: [{
    type: String, // Crop IDs from crop-service
    default: []
  }],
  status: {
    type: String,
    enum: ['active', 'fallow', 'preparation', 'harvested'],
    default: 'active'
  },
  irrigationSystem: {
    type: String,
    enum: ['flood', 'drip', 'sprinkler', 'none', 'other'],
    default: 'none'
  },
  soilHealth: {
    ph: {
      type: Number,
      min: 0,
      max: 14
    },
    organicMatter: {
      type: Number,
      min: 0
    },
    nitrogen: {
      type: Number,
      min: 0
    },
    phosphorus: {
      type: Number,
      min: 0
    },
    potassium: {
      type: Number,
      min: 0
    }
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
FieldSchema.index({ location: '2dsphere' });

// Update the updatedAt field on save
FieldSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Field', FieldSchema);