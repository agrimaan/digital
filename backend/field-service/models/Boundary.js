const mongoose = require('mongoose');

const BoundarySchema = new mongoose.Schema({
  field: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Field',
    required: [true, 'Field reference is required']
  },
  geometry: {
    type: {
      type: String,
      enum: ['Polygon', 'MultiPolygon'],
      required: [true, 'Geometry type is required']
    },
    coordinates: {
      type: [[[Number]]], // GeoJSON format for polygons
      required: [true, 'Boundary coordinates are required']
    }
  },
  area: {
    type: Number, // in hectares
    required: [true, 'Boundary area is required']
  },
  perimeter: {
    type: Number, // in meters
    required: [true, 'Boundary perimeter is required']
  },
  source: {
    type: String,
    enum: ['gps', 'satellite', 'manual', 'drone'],
    default: 'manual'
  },
  accuracy: {
    type: Number, // in meters
    default: 5
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

// Create geospatial index for geometry field
BoundarySchema.index({ geometry: '2dsphere' });

// Update the updatedAt field on save
BoundarySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate area and perimeter before saving
BoundarySchema.pre('save', function(next) {
  // Note: In a real implementation, you would calculate these values
  // based on the geometry coordinates. For simplicity, we're assuming
  // they are provided correctly.
  next();
});

module.exports = mongoose.model('Boundary', BoundarySchema);