const mongoose = require('mongoose');

const MarketplaceListingSchema = new mongoose.Schema({
  crop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Crop',
    required: [true, 'Crop reference is required']
  },
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Farmer ID is required']
  },
  cropName: {
    type: String,
    required: [true, 'Crop name is required'],
    trim: true
  },
  title: {
    type: String,
    trim: true
  },
  variety: {
    type: String,
    trim: true
  },
  scientificName: {
    type: String,
    trim: true
  },
  quantity: {
    available: {
      type: Number,
      required: [true, 'Available quantity is required'],
      min: [0, 'Available quantity must be positive']
    },
    unit: {
      type: String,
      enum: ['kg', 'ton', 'quintal'],
      required: [true, 'Quantity unit is required']
    },
    reserved: {
      type: Number,
      default: 0,
      min: [0, 'Reserved quantity must be positive']
    }
  },
  pricing: {
    pricePerUnit: {
      type: Number,
      required: [true, 'Price per unit is required'],
      min: [0.01, 'Price must be greater than 0']
    },
    currency: {
      type: String,
      default: 'INR'
    },
    negotiable: {
      type: Boolean,
      default: false
    },
    minimumOrderQuantity: {
      type: Number,
      default: 1,
      min: [0, 'Minimum order quantity must be positive']
    }
  },
  harvestInfo: {
    expectedHarvestDate: {
      type: Date,
      required: [true, 'Expected harvest date is required']
    },
    actualHarvestDate: {
      type: Date
    },
    harvestStatus: {
      type: String,
      enum: ['ready', 'in_progress', 'completed'],
      default: 'ready'
    }
  },
  quality: {
    grade: {
      type: String,
      enum: ['A', 'B', 'C', 'premium', 'standard'],
      default: 'standard'
    },
    isOrganic: {
      type: Boolean,
      default: false
    },
    certifications: [String],
    healthStatus: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'diseased'],
      default: 'good'
    }
  },
  farmInfo: {
    fieldId: {
      type: mongoose.Schema.Types.ObjectId
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0]
      },
      address: {
        village: String,
        district: String,
        state: String,
        pincode: String
      }
    },
    soilType: String,
    irrigationMethod: String
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  images: [{
    url: String,
    caption: String,
    isPrimary: Boolean
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'sold_out', 'expired'],
    default: 'active'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'verified_buyers_only'],
    default: 'public'
  },
  statistics: {
    views: {
      type: Number,
      default: 0
    },
    inquiries: {
      type: Number,
      default: 0
    },
    orders: {
      type: Number,
      default: 0
    }
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiration date is required']
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

// Indexes for efficient querying
MarketplaceListingSchema.index({ farmer: 1, status: 1 });
MarketplaceListingSchema.index({ cropName: 'text', variety: 'text', description: 'text' });
MarketplaceListingSchema.index({ 'farmInfo.location': '2dsphere' });
MarketplaceListingSchema.index({ status: 1, expiresAt: 1 });
MarketplaceListingSchema.index({ 'harvestInfo.expectedHarvestDate': 1 });
MarketplaceListingSchema.index({ 'quality.isOrganic': 1 });

// Update the updatedAt field on save
MarketplaceListingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for available quantity after reservations
MarketplaceListingSchema.virtual('actualAvailable').get(function() {
  return this.quantity.available - (this.quantity.reserved || 0);
});

// Virtual for total value
MarketplaceListingSchema.virtual('totalValue').get(function() {
  return this.quantity.available * this.pricing.pricePerUnit;
});

// Virtual for days until harvest
MarketplaceListingSchema.virtual('daysUntilHarvest').get(function() {
  if (!this.harvestInfo.expectedHarvestDate) return null;
  const today = new Date();
  const harvestDate = new Date(this.harvestInfo.expectedHarvestDate);
  const diffTime = harvestDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
});

// Method to check if listing is expired
MarketplaceListingSchema.methods.isExpired = function() {
  return this.expiresAt < new Date();
};

// Method to increment view count
MarketplaceListingSchema.methods.incrementViews = function() {
  this.statistics.views += 1;
  return this.save();
};

// Method to increment inquiry count
MarketplaceListingSchema.methods.incrementInquiries = function() {
  this.statistics.inquiries += 1;
  return this.save();
};

// Method to reserve quantity
MarketplaceListingSchema.methods.reserveQuantity = function(amount) {
  if (this.actualAvailable < amount) {
    throw new Error('Insufficient quantity available');
  }
  this.quantity.reserved += amount;
  return this.save();
};

// Method to release reserved quantity
MarketplaceListingSchema.methods.releaseQuantity = function(amount) {
  this.quantity.reserved = Math.max(0, this.quantity.reserved - amount);
  return this.save();
};

// Method to reduce available quantity (after sale)
MarketplaceListingSchema.methods.reduceQuantity = function(amount) {
  if (this.quantity.available < amount) {
    throw new Error('Insufficient quantity available');
  }
  this.quantity.available -= amount;
  this.quantity.reserved = Math.max(0, this.quantity.reserved - amount);
  this.statistics.orders += 1;
  
  // Mark as sold out if no quantity left
  if (this.quantity.available <= 0) {
    this.status = 'sold_out';
  }
  
  return this.save();
};

// Static method to find active listings
MarketplaceListingSchema.statics.findActive = function(filter = {}) {
  return this.find({
    ...filter,
    status: 'active',
    expiresAt: { $gt: new Date() }
  });
};

// Static method to find listings by location
MarketplaceListingSchema.statics.findNearby = function(longitude, latitude, maxDistance = 50000) {
  return this.find({
    status: 'active',
    expiresAt: { $gt: new Date() },
    'farmInfo.location': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    }
  });
};

// Enable virtuals in JSON
MarketplaceListingSchema.set('toJSON', { virtuals: true });
MarketplaceListingSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('MarketplaceListing', MarketplaceListingSchema);