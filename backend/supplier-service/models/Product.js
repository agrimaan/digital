const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // Basic Information
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  
  // Category
  category: {
    type: String,
    required: true,
    enum: ['seeds', 'fertilizers', 'pesticides', 'equipment', 'tools', 'irrigation', 'other'],
    index: true
  },
  subcategory: {
    type: String,
    required: true
  },
  
  // Description
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [500, 'Short description cannot exceed 500 characters']
  },
  
  // Specifications
  specifications: {
    type: Map,
    of: String
  },
  
  // Pricing
  basePrice: {
    type: Number,
    required: [true, 'Base price is required'],
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    default: 'INR'
  },
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'gram', 'liter', 'ml', 'piece', 'packet', 'bag', 'box']
  },
  unitSize: {
    type: Number,
    required: true,
    min: [0, 'Unit size must be positive']
  },
  
  // Inventory
  stockQuantity: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Stock quantity cannot be negative']
  },
  minimumOrderQuantity: {
    type: Number,
    default: 1,
    min: [1, 'Minimum order quantity must be at least 1']
  },
  maximumOrderQuantity: {
    type: Number,
    default: null
  },
  reorderLevel: {
    type: Number,
    default: 10
  },
  
  // Volume Pricing Tiers
  volumePricing: [{
    minQuantity: { type: Number, required: true },
    maxQuantity: { type: Number },
    discountPercentage: { type: Number, min: 0, max: 100 },
    pricePerUnit: { type: Number }
  }],
  
  // Certifications
  certifications: [{
    name: String,
    issuedBy: String,
    certificateNumber: String,
    expiryDate: Date,
    documentUrl: String
  }],
  
  // Media
  images: [{
    url: String,
    isPrimary: { type: Boolean, default: false },
    alt: String
  }],
  documents: [{
    name: String,
    url: String,
    type: String // datasheet, manual, certificate
  }],
  
  // Product Details
  brand: String,
  manufacturer: String,
  countryOfOrigin: String,
  
  // Organic/Sustainable
  isOrganic: {
    type: Boolean,
    default: false
  },
  isSustainable: {
    type: Boolean,
    default: false
  },
  sustainabilityScore: {
    type: Number,
    min: 0,
    max: 100
  },
  
  // Shipping
  weight: {
    value: Number,
    unit: { type: String, enum: ['kg', 'gram'], default: 'kg' }
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: { type: String, enum: ['cm', 'inch'], default: 'cm' }
  },
  shippingClass: {
    type: String,
    enum: ['standard', 'fragile', 'hazardous', 'perishable'],
    default: 'standard'
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'out_of_stock', 'discontinued'],
    default: 'active',
    index: true
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  
  // Performance Metrics
  viewCount: {
    type: Number,
    default: 0
  },
  orderCount: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
  },
  
  // SEO
  seoTitle: String,
  seoDescription: String,
  seoKeywords: [String],
  
  // Tags
  tags: [String],
  
  // Seasonal Information
  seasonalAvailability: [{
    season: { type: String, enum: ['spring', 'summer', 'monsoon', 'autumn', 'winter'] },
    available: Boolean
  }]
}, {
  timestamps: true
});

// Indexes
productSchema.index({ supplierId: 1, status: 1 });
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ basePrice: 1 });
productSchema.index({ isOrganic: 1, isSustainable: 1 });

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.stockQuantity === 0) return 'out_of_stock';
  if (this.stockQuantity <= this.reorderLevel) return 'low_stock';
  return 'in_stock';
});

// Virtual for average rating
productSchema.virtual('averageRating').get(function() {
  if (this.totalRatings === 0) return 0;
  return (this.rating / this.totalRatings).toFixed(1);
});

// Method to calculate price for quantity
productSchema.methods.calculatePrice = function(quantity) {
  let pricePerUnit = this.basePrice;
  
  // Check volume pricing
  if (this.volumePricing && this.volumePricing.length > 0) {
    for (const tier of this.volumePricing) {
      if (quantity >= tier.minQuantity && (!tier.maxQuantity || quantity <= tier.maxQuantity)) {
        if (tier.pricePerUnit) {
          pricePerUnit = tier.pricePerUnit;
        } else if (tier.discountPercentage) {
          pricePerUnit = this.basePrice * (1 - tier.discountPercentage / 100);
        }
        break;
      }
    }
  }
  
  return pricePerUnit * quantity;
};

// Method to check if product is available
productSchema.methods.isAvailable = function(quantity = 1) {
  return this.status === 'active' && 
         this.isApproved && 
         this.stockQuantity >= quantity &&
         quantity >= this.minimumOrderQuantity &&
         (!this.maximumOrderQuantity || quantity <= this.maximumOrderQuantity);
};

// Method to update stock
productSchema.methods.updateStock = function(quantity, operation = 'subtract') {
  if (operation === 'subtract') {
    this.stockQuantity -= quantity;
  } else if (operation === 'add') {
    this.stockQuantity += quantity;
  }
  
  if (this.stockQuantity <= 0) {
    this.status = 'out_of_stock';
  } else if (this.status === 'out_of_stock') {
    this.status = 'active';
  }
  
  return this.save();
};

module.exports = mongoose.model('Product', productSchema);