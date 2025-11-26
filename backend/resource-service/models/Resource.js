const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Resource name is required'],
    trim: true,
    maxlength: [100, 'Resource name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  type: {
    type: String,
    required: [true, 'Resource type is required'],
    enum: ['Machinery', 'Equipment', 'Tool', 'Vehicle', 'Labor', 'Material', 'Service', 'Other'],
    default: 'Equipment'
  },
  category: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Available', 'In Use', 'Maintenance', 'Unavailable', 'Reserved'],
    default: 'Available'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Resource owner is required']
  },
  ownerName: {
    type: String,
    trim: true
  },
  ownerEmail: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  pricing: {
    hourlyRate: {
      type: Number,
      min: 0
    },
    dailyRate: {
      type: Number,
      min: 0
    },
    weeklyRate: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  specifications: {
    brand: String,
    model: String,
    year: Number,
    capacity: String,
    power: String,
    fuelType: String,
    condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'diseased'],
      default: 'Good'
    }
  },
  availability: {
    startDate: Date,
    endDate: Date,
    daysAvailable: [String], // ['Monday', 'Tuesday', etc.]
    hoursAvailable: {
      start: String, // '09:00'
      end: String    // '17:00'
    }
  },
  images: [{
    url: String,
    caption: String,
    isPrimary: Boolean
  }],
  documents: [{
    name: String,
    url: String,
    type: String
  }],
  bookings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  }],
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  metadata: {
    views: {
      type: Number,
      default: 0
    },
    bookingsCount: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    }
  },
  blockchain: {
    registered: {
      type: Boolean,
      default: false
    },
    transactionHash: String,
    blockNumber: Number,
    registeredAt: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
resourceSchema.index({ owner: 1, status: 1 });
resourceSchema.index({ type: 1, status: 1 });
resourceSchema.index({ location: 1 });
resourceSchema.index({ 'pricing.hourlyRate': 1 });
resourceSchema.index({ 'ratings.average': -1 });
resourceSchema.index({ createdAt: -1 });

// Virtual for full pricing info
resourceSchema.virtual('fullPricing').get(function() {
  return {
    hourly: this.pricing.hourlyRate,
    daily: this.pricing.dailyRate,
    weekly: this.pricing.weeklyRate,
    currency: this.pricing.currency
  };
});

// Method to calculate availability
resourceSchema.methods.isAvailableOn = function(date) {
  if (!this.availability.startDate || !this.availability.endDate) {
    return true;
  }
  
  const checkDate = new Date(date);
  return checkDate >= this.availability.startDate && checkDate <= this.availability.endDate;
};

// Method to update rating
resourceSchema.methods.updateRating = function() {
  if (this.reviews.length === 0) {
    this.ratings.average = 0;
    this.ratings.count = 0;
    return;
  }
  
  const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
  this.ratings.average = sum / this.reviews.length;
  this.ratings.count = this.reviews.length;
};

// Static method to get available resources
resourceSchema.statics.getAvailableResources = function(filters = {}) {
  const query = { status: 'Available', isActive: true };
  
  if (filters.type) query.type = filters.type;
  if (filters.location) query.location = new RegExp(filters.location, 'i');
  if (filters.minRating) query['ratings.average'] = { $gte: filters.minRating };
  
  return this.find(query).populate('owner', 'name email').sort('-createdAt');
};

// Pre-save middleware
resourceSchema.pre('save', function(next) {
  // Update rating before saving
  if (this.isModified('reviews')) {
    this.updateRating();
  }
  next();
});

module.exports = mongoose.model('Resource', resourceSchema);
