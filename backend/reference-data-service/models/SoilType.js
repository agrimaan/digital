const mongoose = require('mongoose');

const SoilTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Soil type name is required'],
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Soil type code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  characteristics: {
    drainage: {
      type: String,
      enum: ['poor', 'moderate', 'good', 'excellent'],
      required: true
    },
    fertility: {
      type: String,
      enum: ['low', 'moderate', 'high', 'very_high'],
      required: true
    },
    phRange: {
      min: { type: Number, required: true },
      max: { type: Number, required: true }
    },
    organicMatter: {
      type: String,
      enum: ['low', 'moderate', 'high'],
      required: true
    }
  },
  suitableCrops: [{
    type: String,
    trim: true
  }],
  recommendedPractices: [{
    practice: { type: String, required: true },
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
SoilTypeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
//SoilTypeSchema.index({ name: 1 });
//SoilTypeSchema.index({ code: 1 });
//SoilTypeSchema.index({ isActive: 1, displayOrder: 1 });

module.exports = mongoose.model('SoilType', SoilTypeSchema);