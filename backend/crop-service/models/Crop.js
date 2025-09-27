const mongoose = require('mongoose');

const CropSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Crop name is required'],
    trim: true
  },
  scientificName: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['cereal', 'pulse', 'oilseed', 'vegetable', 'fruit', 'cash_crop', 'fodder', 'other'],
    required: [true, 'Crop category is required']
  },
  growthDuration: {
    min: {
      type: Number, // in days
      required: [true, 'Minimum growth duration is required']
    },
    max: {
      type: Number, // in days
      required: [true, 'Maximum growth duration is required']
    }
  },
  waterRequirement: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  idealTemperature: {
    min: {
      type: Number, // in Celsius
      required: [true, 'Minimum ideal temperature is required']
    },
    max: {
      type: Number, // in Celsius
      required: [true, 'Maximum ideal temperature is required']
    }
  },
  idealSoilTypes: [{
    type: String,
    enum: [
      'clay', 
      'silty clay', 
      'sandy clay', 
      'clay loam', 
      'silty clay loam', 
      'sandy clay loam', 
      'loam', 
      'silt loam', 
      'silt', 
      'sandy loam', 
      'loamy sand', 
      'sand'
    ]
  }],
  idealSoilPh: {
    min: {
      type: Number,
      default: 5.5
    },
    max: {
      type: Number,
      default: 7.5
    }
  },
  plantingSeasons: [{
    name: {
      type: String,
      required: true
    },
    startMonth: {
      type: Number, // 1-12
      required: true
    },
    endMonth: {
      type: Number, // 1-12
      required: true
    }
  }],
  yieldEstimate: {
    min: {
      type: Number, // in kg/hectare
      required: [true, 'Minimum yield estimate is required']
    },
    max: {
      type: Number, // in kg/hectare
      required: [true, 'Maximum yield estimate is required']
    }
  },
  fertilizers: [{
    name: {
      type: String,
      required: true
    },
    applicationRate: {
      type: String,
      required: true
    },
    applicationTime: {
      type: String,
      required: true
    }
  }],
  pesticides: [{
    name: {
      type: String,
      required: true
    },
    targetPests: [String],
    applicationRate: {
      type: String,
      required: true
    },
    safetyPeriod: {
      type: Number, // in days
      required: true
    }
  }],
  commonDiseases: [{
    name: {
      type: String,
      required: true
    },
    symptoms: [String],
    preventiveMeasures: [String],
    treatments: [String]
  }],
  harvestingIndicators: [String],
  storageConditions: {
    temperature: {
      min: Number, // in Celsius
      max: Number // in Celsius
    },
    humidity: {
      min: Number, // percentage
      max: Number // percentage
    },
    notes: String
  },
  marketValue: {
    min: {
      type: Number, // in currency/kg
      default: 0
    },
    max: {
      type: Number, // in currency/kg
      default: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  nutritionalValue: {
    calories: Number, // per 100g
    protein: Number, // g per 100g
    carbohydrates: Number, // g per 100g
    fat: Number, // g per 100g
    fiber: Number, // g per 100g
    vitamins: [String],
    minerals: [String]
  },
  imageUrl: {
    type: String
  },
  createdBy: {
    type: String, // User ID from user-service
    required: [true, 'Created by is required']
  },
  isActive: {
    type: Boolean,
    default: true
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
CropSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Crop', CropSchema);