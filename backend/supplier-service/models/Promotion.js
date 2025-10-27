const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  // Basic Information
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Promotion name is required'],
    trim: true,
    maxlength: [200, 'Promotion name cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  // Promotion Type
  type: {
    type: String,
    required: true,
    enum: ['percentage', 'fixed_amount', 'bundle', 'buy_x_get_y', 'free_shipping'],
    index: true
  },
  
  // Discount Details
  discountValue: {
    type: Number,
    required: true,
    min: [0, 'Discount value cannot be negative']
  },
  maxDiscountAmount: {
    type: Number,
    default: null // null means no limit
  },
  
  // Applicable Products
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  applicableCategories: [{
    type: String,
    enum: ['seeds', 'fertilizers', 'pesticides', 'equipment', 'tools', 'irrigation', 'other']
  }],
  applyToAllProducts: {
    type: Boolean,
    default: false
  },
  
  // Bundle Details (for bundle type)
  bundleDetails: {
    products: [{
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: Number
    }],
    bundlePrice: Number
  },
  
  // Buy X Get Y Details
  buyXGetYDetails: {
    buyQuantity: Number,
    buyProductId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    getQuantity: Number,
    getProductId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    getDiscount: Number // percentage discount on Y
  },
  
  // Minimum Purchase Requirements
  minPurchaseAmount: {
    type: Number,
    default: 0
  },
  minPurchaseQuantity: {
    type: Number,
    default: 0
  },
  
  // Farmer Segments
  farmerSegments: [{
    type: String,
    enum: ['all', 'organic', 'sensor_enabled', 'sustainable', 'bronze', 'silver', 'gold', 'platinum']
  }],
  minFarmerRating: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // Validity Period
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  
  // Usage Limits
  usageLimit: {
    type: Number,
    default: null // null means unlimited
  },
  usagePerFarmer: {
    type: Number,
    default: 1
  },
  usedCount: {
    type: Number,
    default: 0
  },
  
  // Coupon Codes
  coupons: [{
    code: { type: String, unique: true, uppercase: true },
    usageLimit: Number,
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  }],
  requiresCoupon: {
    type: Boolean,
    default: false
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'expired', 'cancelled'],
    default: 'draft',
    index: true
  },
  
  // Display Settings
  displaySettings: {
    showOnHomepage: { type: Boolean, default: false },
    showOnProductPage: { type: Boolean, default: true },
    showOnCheckout: { type: Boolean, default: true },
    bannerImage: String,
    badgeText: String,
    badgeColor: String
  },
  
  // Terms and Conditions
  termsAndConditions: String,
  
  // Performance Metrics
  metrics: {
    totalViews: { type: Number, default: 0 },
    totalClicks: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    totalDiscount: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 }
  },
  
  // Approval
  isApproved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date
}, {
  timestamps: true
});

// Indexes
promotionSchema.index({ supplierId: 1, status: 1 });
promotionSchema.index({ startDate: 1, endDate: 1 });
promotionSchema.index({ type: 1 });
promotionSchema.index({ 'coupons.code': 1 });

// Virtual for active status
promotionSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'active' && 
         this.startDate <= now && 
         this.endDate >= now &&
         (this.usageLimit === null || this.usedCount < this.usageLimit);
});

// Method to check if promotion is applicable to farmer
promotionSchema.methods.isApplicableToFarmer = function(farmerRating) {
  // Check farmer segments
  if (this.farmerSegments.length > 0 && !this.farmerSegments.includes('all')) {
    const farmerTier = farmerRating.tier;
    const hasOrganic = farmerRating.metrics.organicCertified;
    const hasSensors = farmerRating.metrics.totalSensors > 0;
    const isSustainable = farmerRating.sustainablePracticesRating >= 60;
    
    let isApplicable = false;
    
    if (this.farmerSegments.includes(farmerTier)) isApplicable = true;
    if (this.farmerSegments.includes('organic') && hasOrganic) isApplicable = true;
    if (this.farmerSegments.includes('sensor_enabled') && hasSensors) isApplicable = true;
    if (this.farmerSegments.includes('sustainable') && isSustainable) isApplicable = true;
    
    if (!isApplicable) return false;
  }
  
  // Check minimum rating
  if (farmerRating.compositeRating < this.minFarmerRating) {
    return false;
  }
  
  return true;
};

// Method to check if promotion is applicable to product
promotionSchema.methods.isApplicableToProduct = function(productId, category) {
  if (this.applyToAllProducts) return true;
  
  // Check specific products
  if (this.applicableProducts.length > 0) {
    return this.applicableProducts.some(id => id.toString() === productId.toString());
  }
  
  // Check categories
  if (this.applicableCategories.length > 0) {
    return this.applicableCategories.includes(category);
  }
  
  return false;
};

// Method to calculate discount
promotionSchema.methods.calculateDiscount = function(orderAmount, quantity = 1) {
  let discount = 0;
  
  switch(this.type) {
    case 'percentage':
      discount = orderAmount * (this.discountValue / 100);
      break;
    case 'fixed_amount':
      discount = this.discountValue;
      break;
    case 'bundle':
      // Bundle discount is calculated differently
      if (this.bundleDetails && this.bundleDetails.bundlePrice) {
        const regularPrice = orderAmount;
        discount = regularPrice - this.bundleDetails.bundlePrice;
      }
      break;
    case 'free_shipping':
      // Shipping discount handled separately
      discount = 0;
      break;
  }
  
  // Apply max discount limit
  if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
    discount = this.maxDiscountAmount;
  }
  
  return Math.max(0, discount);
};

// Method to validate coupon
promotionSchema.methods.validateCoupon = function(couponCode) {
  if (!this.requiresCoupon) return { valid: true };
  
  const coupon = this.coupons.find(c => c.code === couponCode.toUpperCase());
  
  if (!coupon) {
    return { valid: false, message: 'Invalid coupon code' };
  }
  
  if (!coupon.isActive) {
    return { valid: false, message: 'Coupon is no longer active' };
  }
  
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, message: 'Coupon usage limit reached' };
  }
  
  return { valid: true, coupon };
};

// Method to increment usage
promotionSchema.methods.incrementUsage = function(couponCode = null) {
  this.usedCount += 1;
  
  if (couponCode) {
    const coupon = this.coupons.find(c => c.code === couponCode.toUpperCase());
    if (coupon) {
      coupon.usedCount += 1;
    }
  }
  
  return this.save();
};

// Method to update metrics
promotionSchema.methods.updateMetrics = function(orderAmount, discountAmount) {
  this.metrics.totalOrders += 1;
  this.metrics.totalRevenue += orderAmount;
  this.metrics.totalDiscount += discountAmount;
  
  if (this.metrics.totalClicks > 0) {
    this.metrics.conversionRate = (this.metrics.totalOrders / this.metrics.totalClicks) * 100;
  }
  
  return this.save();
};

module.exports = mongoose.model('Promotion', promotionSchema);