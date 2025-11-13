
const mongoose = require('mongoose');

const CropSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Crop name is required'],
    trim: true,
    maxlength: [100, 'Crop name cannot exceed 100 characters']
  },
  scientificName: {
    type: String,
    trim: true
  },
  variety: {
    type: String,
    required: [true, 'Crop variety is required'],
    trim: true
  },
  fieldId: {
    type: mongoose.Schema.Types.ObjectId,
//    ref: 'Fields',
    required: [true, 'field ID is required']
  },
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
 //   ref: 'User',
    required: [true, 'Farmer ID is required']
  },
  plantedArea: {
    type: Number,
    required: [true, 'Planted area is required'],
    min: [0.1, 'Planted area must be greater than 0']
  },
  plantingDate: {
    type: Date,
    required: [true, 'Planting date is required']
  },
  expectedHarvestDate: {
    type: Date,
    required: [true, 'Expected harvest date is required']
  },
  actualHarvestDate: {
    type: Date
  },
  expectedYield: {
    type: Number,
    required: [true, 'Expected yield is required'],
    min: [0, 'Expected yield must be positive']
  },
  actualYield: {
    type: Number,
    min: [0, 'Actual yield must be positive']
  },
  unit: {
    type: String,
    enum: ['kg', 'ton', 'quintal'],
    default: 'kg'
  },
  pricePerUnit: {
    type: Number,
    min: [0, 'Price per unit must be positive']
  },
  totalValue: {
    type: Number,
    min: [0, 'Total value must be positive']
  },
  soilType: {
    type: String,
    enum: ['loam', 'clay', 'sandy', 'silty', 'peaty', 'chalky', 'alluvial'],
    required: true
  },
  irrigationMethod: {
    type: String,
    enum: ['drip', 'sprinkler', 'flood', 'rainfed', 'center-pivot'],
    required: true
  },
  seedSource: {
    type: String,
    enum: ['own', 'market', 'government', 'supplier'],
    required: true
  },
  fertilizerUsed: [{
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    applicationDate: { type: Date, required: true }
  }],
  pesticidesUsed: [{
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    applicationDate: { type: Date, required: true }
  }],
  healthStatus: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor', 'diseased'],
    default: 'good'
  },
  growthStage: {
    type: String,
    enum: ['seedling', 'vegetative', 'flowering', 'fruiting', 'maturity', 'harvested'],
    default: 'seedling'
  },
  weatherConditions: [{
    date: { type: Date, required: true },
    temperature: { type: Number, required: true },
    humidity: { type: Number, required: true },
    rainfall: { type: Number, default: 0 },
    weatherCondition: { type: String, required: true }
  }],
  images: [{
    url: { type: String, required: true },
    caption: { type: String },
    date: { type: Date, default: Date.now }
  }],
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  marketplaceListing: {
    productId: {
      type: String // Product ID from marketplace-service
    },
    listedDate: {
      type: Date
    },
    unlistedDate: {
      type: Date
    },
    quantity: {
      type: Number
    },
    pricePerUnit: {
      type: Number
    },
    status: {
      type: String,
      enum: ['active', 'unlisted', 'sold'],
      default: 'active'
    }
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
CropSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate total value before saving
CropSchema.pre('save', function(next) {
  if (this.actualYield && this.pricePerUnit) {
    this.totalValue = this.actualYield * this.pricePerUnit;
  }
  next();
});

// Calculate days to harvest
CropSchema.virtual('daysToHarvest').get(function() {
  if (!this.expectedHarvestDate) return null;
  const today = new Date();
  const harvestDate = new Date(this.expectedHarvestDate);
  const diffTime = harvestDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
});

// Calculate days since planting
CropSchema.virtual('daysSincePlanting').get(function() {
  if (!this.plantingDate) return null;
  const today = new Date();
  const plantingDate = new Date(this.plantingDate);
  const diffTime = today - plantingDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

module.exports = mongoose.model('Crop', CropSchema);
