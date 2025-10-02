const mongoose = require('mongoose');

const SoilSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Soil type name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Soil type description is required']
  },
  texture: {
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
    ],
    required: [true, 'Soil texture is required']
  },
  color: {
    type: String,
    required: [true, 'Soil color is required']
  },
  drainageCapacity: {
    type: String,
    enum: ['poor', 'moderate', 'good', 'excellent'],
    default: 'moderate'
  },
  waterHoldingCapacity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  organicMatterContent: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  fertilityCriteria: {
    nitrogen: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    phosphorus: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    potassium: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    ph: {
      min: {
        type: Number,
        default: 5.5
      },
      max: {
        type: Number,
        default: 7.5
      }
    }
  },
  suitableCrops: [{
    type: String,
    default: []
  }],
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
SoilSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Soil', SoilSchema);