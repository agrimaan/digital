const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  area: {
    type: Number,
    required: true,
    min: 0
  },
  coordinates: [{
    lat: Number,
    lng: Number
  }],
  soilType: {
    type: String,
    default: 'unknown'
  },
  fieldType: {
    type: String,
    default: 'agricultural'
  },
  irrigationType: {
    type: String,
    default: 'rainfed'
  },
  ownershipType: {
    type: String,
    default: 'owned'
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
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

module.exports = mongoose.model('Field', fieldSchema);
