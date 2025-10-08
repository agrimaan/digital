const mongoose = require('mongoose');

const CropTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Crop type name is required'],
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Crop type code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  scientificName: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['cereal', 'pulse', 'oilseed', 'vegetable', 'fruit', 'cash_crop', 'fodder', 'spice', 'other'],
    required: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  growthCharacteristics: {
    duration: {
      min: { type: Number, required: true }, // days
      max: { type: Number, required: true }
    },
    seasons: [{
      type: String,
      enum: ['spring', 'summer', 'monsoon', 'autumn', 'winter', 'year_round']
    }],
    temperatureRange: {
      min: { type: Number, required: true }, // Celsius
      max: { type: Number, required: true }
    },
    rainfallRequirement: {
      min: { type: Number, required: true }, // mm
      max: { type: Number, required: true }
    },
    soilPh: {
      min: { type: Number, required: true },
      max: { type: Number, required: true }
    }
  },
  suitableSoilTypes: [{
    type: String,
    trim: true
  }],
  irrigationRequirements: [{
    type: String,
    trim: true
  }],
  yieldEstimate: {
    min: { type: Number, required: true }, // kg per hectare
    max: { type: Number, required: true },
    unit: { type: String, default: 'kg/hectare' }
  },
  nutritionalValue: {
    protein: { type: Number }, // percentage
    carbohydrates: { type: Number },
    fat: { type: Number },
    fiber: { type: Number },
    vitamins: [{ 
      name: String, 
      amount: Number, 
      unit: String 
    }],
    minerals: [{ 
      name: String, 
      amount: Number, 
      unit: String 
    }]
  },
  marketInfo: {
    averagePrice: { type: Number }, // per kg
    priceUnit: { type: String, default: 'INR/kg' },
    marketDemand: {
      type: String,
      enum: ['low', 'moderate', 'high', 'very_high']
    },
    exportPotential: {
      type: String,
      enum: ['none', 'low', 'moderate', 'high']
    }
  },
  commonDiseases: [{
    name: { type: String, required: true },
    symptoms: { type: String, required: true },
    prevention: { type: String, required: true }
  }],
  commonPests: [{
    name: { type: String, required: true },
    damage: { type: String, required: true },
    control: { type: String, required: true }
  }],
  cultivationPractices: [{
    stage: { type: String, required: true },
    practice: { type: String, required: true },
    timing: { type: String, required: true },
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
CropTypeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for efficient queries
CropTypeSchema.index({ name: 1 });
CropTypeSchema.index({ code: 1 });
CropTypeSchema.index({ category: 1 });
CropTypeSchema.index({ isActive: 1, displayOrder: 1 });
CropTypeSchema.index({ 'growthCharacteristics.seasons': 1 });

module.exports = mongoose.model('CropType', CropTypeSchema);