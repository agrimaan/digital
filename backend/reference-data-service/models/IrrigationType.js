const mongoose = require('mongoose');

const IrrigationTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Irrigation type name is required'],
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Irrigation type code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  characteristics: {
    efficiency: {
      type: String,
      enum: ['low', 'moderate', 'high', 'very_high'],
      required: true
    },
    waterUsage: {
      type: String,
      enum: ['low', 'moderate', 'high'],
      required: true
    },
    costLevel: {
      type: String,
      enum: ['low', 'moderate', 'high', 'very_high'],
      required: true
    },
    maintenanceLevel: {
      type: String,
      enum: ['low', 'moderate', 'high'],
      required: true
    }
  },
  suitableFor: {
    soilTypes: [{
      type: String,
      trim: true
    }],
    cropTypes: [{
      type: String,
      trim: true
    }],
    fieldSizes: [{
      type: String,
      enum: ['small', 'medium', 'large', 'very_large']
    }]
  },
  advantages: [{
    type: String,
    required: true
  }],
  disadvantages: [{
    type: String,
    required: true
  }],
  installationRequirements: [{
    requirement: { type: String, required: true },
    description: { type: String, required: true }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
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

// Update the updatedAt field on save
IrrigationTypeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
//IrrigationTypeSchema.index({ name: 1 });
//IrrigationTypeSchema.index({ code: 1 });
//IrrigationTypeSchema.index({ isActive: 1, displayOrder: 1 });

module.exports = mongoose.model('IrrigationType', IrrigationTypeSchema);