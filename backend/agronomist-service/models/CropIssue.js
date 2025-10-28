const mongoose = require('mongoose');

const CropIssueSchema = new mongoose.Schema({
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
    required: [true, 'Issue title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Issue description is required'],
    trim: true
  },
  issueType: {
    type: String,
    required: [true, 'Issue type is required'],
    enum: ['pest', 'disease', 'nutrient-deficiency', 'weather-damage', 'equipment-issue', 'other']
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    caption: {
      type: String,
      trim: true
    }
  }],
  suggestedSolutions: [{
    solution: {
      type: String,
      trim: true
    },
    productType: {
      type: String,
      enum: ['fertilizer', 'pesticide', 'equipment', 'other']
    },
    products: [{
      name: String,
      description: String,
      quantity: Number,
      unit: String
    }]
  }],
  status: {
    type: String,
    enum: ['reported', 'under-review', 'in-progress', 'resolved', 'dismissed'],
    default: 'reported'
  },
  reportedBy: {
    type: String,
    required: [true, 'Reporter ID is required']
  },
  assignedTo: {
    type: String
  },
  resolvedAt: {
    type: Date
  },
  resolutionNotes: {
    type: String,
    trim: true
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
CropIssueSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('CropIssue', CropIssueSchema);