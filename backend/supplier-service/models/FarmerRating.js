const mongoose = require('mongoose');

const farmerRatingSchema = new mongoose.Schema({
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  
  // Rating Components (0-100 scale)
  organicCertificationRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  iotSensorRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  sustainablePracticesRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  purchaseHistoryRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Composite Rating
  compositeRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Rating Tier
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'bronze'
  },
  
  // Detailed Metrics
  metrics: {
    // Organic Farming
    organicCertified: { type: Boolean, default: false },
    organicCertificationDate: Date,
    organicCertificationExpiry: Date,
    organicCertificationBody: String,
    organicFarmingYears: { type: Number, default: 0 },
    
    // IoT Sensors
    totalSensors: { type: Number, default: 0 },
    activeSensors: { type: Number, default: 0 },
    sensorTypes: [String], // soil_moisture, temperature, humidity, etc.
    dataQuality: { type: Number, min: 0, max: 100, default: 0 },
    lastDataUpdate: Date,
    
    // Sustainable Practices
    waterConservation: { type: Boolean, default: false },
    soilConservation: { type: Boolean, default: false },
    renewableEnergy: { type: Boolean, default: false },
    wasteManagement: { type: Boolean, default: false },
    biodiversityConservation: { type: Boolean, default: false },
    carbonFootprintReduction: { type: Boolean, default: false },
    
    // Purchase History
    totalPurchases: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },
    purchaseFrequency: { type: Number, default: 0 }, // orders per month
    lastPurchaseDate: Date,
    loyaltyYears: { type: Number, default: 0 }
  },
  
  // Benefits Unlocked
  benefits: {
    maxDiscountPercentage: { type: Number, default: 0 },
    prioritySupport: { type: Boolean, default: false },
    freeShipping: { type: Boolean, default: false },
    extendedPaymentTerms: { type: Boolean, default: false },
    exclusiveProducts: { type: Boolean, default: false }
  },
  
  // Rating History
  ratingHistory: [{
    date: Date,
    compositeRating: Number,
    tier: String,
    reason: String
  }],
  
  // Last Calculation
  lastCalculated: {
    type: Date,
    default: Date.now
  },
  calculationVersion: {
    type: String,
    default: '1.0'
  }
}, {
  timestamps: true
});

// Indexes
farmerRatingSchema.index({ compositeRating: -1 });
farmerRatingSchema.index({ tier: 1 });
farmerRatingSchema.index({ lastCalculated: 1 });

// Method to calculate composite rating
farmerRatingSchema.methods.calculateCompositeRating = function() {
  const weights = {
    organic: 0.35,      // 35% weight
    iotSensor: 0.25,    // 25% weight
    sustainable: 0.25,  // 25% weight
    purchase: 0.15      // 15% weight
  };
  
  this.compositeRating = Math.round(
    (this.organicCertificationRating * weights.organic) +
    (this.iotSensorRating * weights.iotSensor) +
    (this.sustainablePracticesRating * weights.sustainable) +
    (this.purchaseHistoryRating * weights.purchase)
  );
  
  // Update tier based on composite rating
  this.tier = this.getTierFromRating(this.compositeRating);
  
  // Update benefits
  this.updateBenefits();
  
  // Add to history
  this.ratingHistory.push({
    date: new Date(),
    compositeRating: this.compositeRating,
    tier: this.tier,
    reason: 'Automatic calculation'
  });
  
  this.lastCalculated = new Date();
  
  return this.compositeRating;
};

// Method to determine tier from rating
farmerRatingSchema.methods.getTierFromRating = function(rating) {
  if (rating >= 90) return 'platinum';
  if (rating >= 75) return 'gold';
  if (rating >= 60) return 'silver';
  return 'bronze';
};

// Method to update benefits based on tier
farmerRatingSchema.methods.updateBenefits = function() {
  switch(this.tier) {
    case 'platinum':
      this.benefits.maxDiscountPercentage = 25;
      this.benefits.prioritySupport = true;
      this.benefits.freeShipping = true;
      this.benefits.extendedPaymentTerms = true;
      this.benefits.exclusiveProducts = true;
      break;
    case 'gold':
      this.benefits.maxDiscountPercentage = 20;
      this.benefits.prioritySupport = true;
      this.benefits.freeShipping = true;
      this.benefits.extendedPaymentTerms = true;
      this.benefits.exclusiveProducts = false;
      break;
    case 'silver':
      this.benefits.maxDiscountPercentage = 15;
      this.benefits.prioritySupport = true;
      this.benefits.freeShipping = false;
      this.benefits.extendedPaymentTerms = false;
      this.benefits.exclusiveProducts = false;
      break;
    case 'bronze':
      this.benefits.maxDiscountPercentage = 10;
      this.benefits.prioritySupport = false;
      this.benefits.freeShipping = false;
      this.benefits.extendedPaymentTerms = false;
      this.benefits.exclusiveProducts = false;
      break;
  }
};

// Method to calculate organic certification rating
farmerRatingSchema.methods.calculateOrganicRating = function() {
  let rating = 0;
  
  if (this.metrics.organicCertified) {
    rating += 50; // Base points for certification
    
    // Additional points for years of organic farming
    const years = this.metrics.organicFarmingYears || 0;
    rating += Math.min(years * 5, 30); // Up to 30 points for experience
    
    // Check if certification is current
    if (this.metrics.organicCertificationExpiry && 
        new Date(this.metrics.organicCertificationExpiry) > new Date()) {
      rating += 20; // Points for current certification
    }
  }
  
  this.organicCertificationRating = Math.min(rating, 100);
  return this.organicCertificationRating;
};

// Method to calculate IoT sensor rating
farmerRatingSchema.methods.calculateIoTRating = function() {
  let rating = 0;
  
  const totalSensors = this.metrics.totalSensors || 0;
  const activeSensors = this.metrics.activeSensors || 0;
  const dataQuality = this.metrics.dataQuality || 0;
  
  if (totalSensors > 0) {
    // Points for number of sensors (up to 40 points)
    rating += Math.min(totalSensors * 5, 40);
    
    // Points for active sensors ratio (up to 30 points)
    const activeRatio = activeSensors / totalSensors;
    rating += activeRatio * 30;
    
    // Points for data quality (up to 30 points)
    rating += (dataQuality / 100) * 30;
  }
  
  this.iotSensorRating = Math.min(rating, 100);
  return this.iotSensorRating;
};

// Method to calculate sustainable practices rating
farmerRatingSchema.methods.calculateSustainableRating = function() {
  let rating = 0;
  const practices = this.metrics;
  
  // Each practice contributes points
  if (practices.waterConservation) rating += 17;
  if (practices.soilConservation) rating += 17;
  if (practices.renewableEnergy) rating += 17;
  if (practices.wasteManagement) rating += 17;
  if (practices.biodiversityConservation) rating += 16;
  if (practices.carbonFootprintReduction) rating += 16;
  
  this.sustainablePracticesRating = Math.min(rating, 100);
  return this.sustainablePracticesRating;
};

// Method to calculate purchase history rating
farmerRatingSchema.methods.calculatePurchaseRating = function() {
  let rating = 0;
  const metrics = this.metrics;
  
  // Points for total purchases (up to 30 points)
  const purchasePoints = Math.min(metrics.totalPurchases || 0, 30);
  rating += purchasePoints;
  
  // Points for purchase frequency (up to 30 points)
  const frequencyPoints = Math.min((metrics.purchaseFrequency || 0) * 3, 30);
  rating += frequencyPoints;
  
  // Points for loyalty years (up to 20 points)
  const loyaltyPoints = Math.min((metrics.loyaltyYears || 0) * 4, 20);
  rating += loyaltyPoints;
  
  // Points for average order value (up to 20 points)
  const avgOrderValue = metrics.averageOrderValue || 0;
  if (avgOrderValue > 50000) rating += 20;
  else if (avgOrderValue > 25000) rating += 15;
  else if (avgOrderValue > 10000) rating += 10;
  else if (avgOrderValue > 5000) rating += 5;
  
  this.purchaseHistoryRating = Math.min(rating, 100);
  return this.purchaseHistoryRating;
};

// Method to recalculate all ratings
farmerRatingSchema.methods.recalculateAllRatings = function() {
  this.calculateOrganicRating();
  this.calculateIoTRating();
  this.calculateSustainableRating();
  this.calculatePurchaseRating();
  this.calculateCompositeRating();
  
  return this.save();
};

module.exports = mongoose.model('FarmerRating', farmerRatingSchema);