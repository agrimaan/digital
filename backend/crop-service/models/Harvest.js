const mongoose = require('mongoose');

const HarvestSchema = new mongoose.Schema({
  planting: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Planting',
    required: [true, 'Planting reference is required']
  },
  field: {
    type: String, // Field ID from field-service
    required: [true, 'Field ID is required']
  },
  crop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Crop',
    required: [true, 'Crop is required']
  },
  owner: {
    type: String, // User ID from user-service
    required: [true, 'Owner is required']
  },
  harvestDate: {
    type: Date,
    required: [true, 'Harvest date is required']
  },
  completionDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['planned', 'in_progress', 'completed', 'cancelled'],
    default: 'planned'
  },
  method: {
    type: String,
    enum: ['manual', 'mechanical', 'combined', 'other'],
    required: [true, 'Harvest method is required']
  },
  yield: {
    value: {
      type: Number,
      required: [true, 'Yield value is required']
    },
    unit: {
      type: String,
      enum: ['kg', 'ton', 'quintal'],
      default: 'kg'
    },
    perArea: {
      type: Number // calculated yield per hectare
    }
  },
  quality: {
    grade: {
      type: String,
      enum: ['A', 'B', 'C', 'D', 'E', 'ungraded'],
      default: 'ungraded'
    },
    moisture: {
      type: Number, // percentage
    },
    purity: {
      type: Number, // percentage
    },
    damage: {
      type: Number, // percentage
    },
    notes: String
  },
  storage: {
    location: String,
    conditions: String,
    capacity: Number,
    unit: {
      type: String,
      enum: ['kg', 'ton', 'quintal'],
      default: 'kg'
    }
  },
  costs: {
    labor: Number,
    equipment: Number,
    transportation: Number,
    storage: Number,
    other: Number,
    total: Number,
    currency: {
      type: String,
      default: 'INR'
    }
  },
  marketValue: {
    pricePerUnit: Number,
    totalValue: Number,
    currency: {
      type: String,
      default: 'INR'
    },
    marketDate: Date
  },
  profit: {
    amount: Number,
    currency: {
      type: String,
      default: 'INR'
    }
  },
  laborers: {
    count: Number,
    hours: Number,
    cost: Number
  },
  equipment: [{
    name: String,
    hours: Number,
    cost: Number
  }],
  weather: {
    temperature: Number,
    humidity: Number,
    conditions: String
  },
  images: [String],
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create index for planting
HarvestSchema.index({ planting: 1 });

// Create index for field and owner
HarvestSchema.index({ field: 1, owner: 1 });

// Create index for crop and status
HarvestSchema.index({ crop: 1, status: 1 });

// Create index for harvest date
HarvestSchema.index({ harvestDate: -1 });

// Update the updatedAt field on save
HarvestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate yield per hectare and total market value before saving
HarvestSchema.pre('save', async function(next) {
  try {
    // Calculate yield per hectare if we have the planting information
    if (this.planting) {
      const Planting = mongoose.model('Planting');
      const planting = await Planting.findById(this.planting);
      
      if (planting && planting.area && this.yield && this.yield.value) {
        this.yield.perArea = this.yield.value / planting.area;
      }
    }
    
    // Calculate total market value
    if (this.marketValue && this.marketValue.pricePerUnit && this.yield && this.yield.value) {
      this.marketValue.totalValue = this.marketValue.pricePerUnit * this.yield.value;
    }
    
    // Calculate total costs
    if (this.costs) {
      const { labor = 0, equipment = 0, transportation = 0, storage = 0, other = 0 } = this.costs;
      this.costs.total = labor + equipment + transportation + storage + other;
    }
    
    // Calculate profit
    if (this.marketValue && this.marketValue.totalValue && this.costs && this.costs.total) {
      this.profit = {
        amount: this.marketValue.totalValue - this.costs.total,
        currency: this.marketValue.currency
      };
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Harvest', HarvestSchema);