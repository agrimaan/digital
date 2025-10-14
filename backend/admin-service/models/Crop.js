const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  field: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Field',
    required: true
  },
  variety: {
    type: String,
    default: 'unknown'
  },
  plantingDate: {
    type: Date,
    required: true
  },
  expectedHarvestDate: {
    type: Date
  },
  area: {
    type: Number,
    min: 0
  },
  status: {
    type: String,
    enum: ['planted', 'growing', 'ready_for_harvest', 'harvested', 'failed'],
    default: 'planted'
  },
  notes: {
    type: String,
    default: ''
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

module.exports = mongoose.model('Crop', cropSchema);
