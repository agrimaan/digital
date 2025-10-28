const mongoose = require('mongoose');

const ConsultationSchema = new mongoose.Schema({
  farmerId: {
    type: String,
    required: [true, 'Farmer ID is required']
  },
  agronomistId: {
    type: String,
    required: [true, 'Agronomist ID is required']
  },
  fieldId: {
    type: String,
    required: [true, 'Field ID is required']
  },
  cropId: {
    type: String
  },
  title: {
    type: String,
    required: [true, 'Consultation title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Consultation description is required'],
    trim: true
  },
  consultationType: {
    type: String,
    required: [true, 'Consultation type is required'],
    enum: ['field-analysis', 'crop-issue', 'soil-testing', 'weather-advisory', 'general-advice']
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  scheduledAt: {
    type: Date,
    required: [true, 'Scheduled time is required']
  },
  completedAt: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
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
  documents: [{
    url: {
      type: String,
      required: true
    },
    name: {
      type: String,
      trim: true
    }
  }],
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: {
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
ConsultationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Consultation', ConsultationSchema);