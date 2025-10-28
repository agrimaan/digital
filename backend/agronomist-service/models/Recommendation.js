const mongoose = require('mongoose');

const RecommendationSchema = new mongoose.Schema({
  farmerId: {
    type: String,
    required: [true, 'Farmer ID is required']
  },
  fieldId: {
    type: String,
    required: [true, 'Field ID is required']
  },
  cropId: {
    type: String,
    required: [true, 'Crop ID is required']
  },
  title: {
    type: String,
    required: [true, 'Recommendation title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Recommendation description is required'],
    trim: true
  },
  recommendationType: {
    type: String,
    required: [true, 'Recommendation type is required'],
    enum: ['fertilizer', 'pesticide', 'irrigation', 'planting', 'harvesting', 'soil-health', 'weather']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  suggestedActions: [{
    action: {
      type: String,
      trim: true
    },
    timeline: {
      type: String,
      trim: true
    },
    resourcesNeeded: [{
      name: String,
      quantity: Number,
      unit: String
    }]
  }],
  expectedOutcome: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'dismissed'],
    default: 'pending'
  },
  agronomistId: {
    type: String,
    required: [true, 'Agronomist ID is required']
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
RecommendationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Recommendation', RecommendationSchema);