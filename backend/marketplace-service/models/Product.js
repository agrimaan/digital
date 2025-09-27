const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required']
  },
  category: {
    type: String,
    enum: ['crop', 'seed', 'fertilizer', 'pesticide', 'equipment', 'other'],
    required: [true, 'Product category is required']
  },
  price: {
    value: {
      type: Number,
      required: [true, 'Price value is required']
    },
    currency: {
      type: String,
      default: 'INR'
    },
    unit: {
      type: String,
      enum: ['kg', 'ton', 'piece', 'package', 'liter'],
      required: [true, 'Price unit is required']
    }
  },
  quantity: {
    available: {
      type: Number,
      required: [true, 'Available quantity is required']
    },
    unit: {
      type: String,
      enum: ['kg', 'ton', 'piece', 'package', 'liter'],
      required: [true, 'Quantity unit is required']
    },
    minimum: {
      type: Number,
      default: 1
    }
  },
  images: [String],
  seller: {
    type: String, // User ID from user-service
    required: [true, 'Seller ID is required']
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Location coordinates are required']
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String
    }
  },
  specifications: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ratings: {
    average: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  reviews: [{
    user: String, // User ID from user-service
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    comment: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  isOrganic: {
    type: Boolean,
    default: false
  },
  certifications: [String],
  harvestDate: Date,
  expiryDate: Date,
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

// Create geospatial index for location field
ProductSchema.index({ location: '2dsphere' });

// Create text index for search
ProductSchema.index({ name: 'text', description: 'text' });

// Update the updatedAt field on save
ProductSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Product', ProductSchema);