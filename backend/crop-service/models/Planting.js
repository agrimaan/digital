const mongoose = require('mongoose');

const PlantingSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ['planned', 'planted', 'growing', 'ready_for_harvest', 'harvested', 'failed'],
    default: 'planned'
  },
  area: {
    type: Number, // in hectares
    required: [true, 'Area is required']
  },
  seedQuantity: {
    value: {
      type: Number,
      required: [true, 'Seed quantity is required']
    },
    unit: {
      type: String,
      enum: ['kg', 'g', 'seeds', 'packets'],
      default: 'kg'
    }
  },
  seedSource: {
    type: String
  },
  seedVariety: {
    type: String
  },
  plantingMethod: {
    type: String,
    enum: ['direct_seeding', 'transplanting', 'broadcasting', 'other'],
    default: 'direct_seeding'
  },
  rowSpacing: {
    type: Number, // in cm
  },
  plantSpacing: {
    type: Number, // in cm
  },
  irrigationSchedule: [{
    date: Date,
    duration: Number, // in minutes
    amount: Number, // in mm
    method: {
      type: String,
      enum: ['drip', 'sprinkler', 'flood', 'manual', 'other']
    },
    notes: String,
    completed: {
      type: Boolean,
      default: false
    }
  }],
  fertilizationSchedule: [{
    date: Date,
    fertilizer: String,
    amount: Number,
    unit: String,
    method: String,
    notes: String,
    completed: {
      type: Boolean,
      default: false
    }
  }],
  pestControlSchedule: [{
    date: Date,
    product: String,
    targetPest: String,
    amount: Number,
    unit: String,
    method: String,
    notes: String,
    completed: {
      type: Boolean,
      default: false
    }
  }],
  growthObservations: [{
    date: {
      type: Date,
      required: true
    },
    stage: {
      type: String,
      required: true
    },
    height: Number, // in cm
    healthStatus: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'diseased'],
      required: true
    },
    issues: [String],
    notes: String,
    images: [String]
  }],
  weatherEvents: [{
    date: {
      type: Date,
      required: true
    },
    eventType: {
      type: String,
      enum: ['rain', 'drought', 'frost', 'hail', 'flood', 'extreme_heat', 'extreme_cold', 'wind', 'other'],
      required: true
    },
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe', 'extreme'],
      required: true
    },
    impact: {
      type: String,
      enum: ['none', 'minor', 'moderate', 'major', 'catastrophic'],
      required: true
    },
    notes: String
  }],
  expectedYield: {
    value: {
      type: Number,
      required: [true, 'Expected yield is required']
    },
    unit: {
      type: String,
      enum: ['kg', 'ton', 'quintal'],
      default: 'kg'
    }
  },
  actualYield: {
    value: Number,
    unit: {
      type: String,
      enum: ['kg', 'ton', 'quintal'],
      default: 'kg'
    }
  },
  costs: {
    seeds: Number,
    fertilizers: Number,
    pesticides: Number,
    irrigation: Number,
    labor: Number,
    equipment: Number,
    other: Number,
    total: Number,
    currency: {
      type: String,
      default: 'INR'
    }
  },
  revenue: {
    amount: Number,
    currency: {
      type: String,
      default: 'INR'
    }
  },
  profit: {
    amount: Number,
    currency: {
      type: String,
      default: 'INR'
    }
  },
  notes: {
    type: String
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

// Create index for field and owner
PlantingSchema.index({ field: 1, owner: 1 });

// Create index for crop and status
PlantingSchema.index({ crop: 1, status: 1 });

// Create index for planting date
PlantingSchema.index({ plantingDate: -1 });

// Update the updatedAt field on save
PlantingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate profit before saving
PlantingSchema.pre('save', function(next) {
  if (this.revenue && this.revenue.amount && this.costs && this.costs.total) {
    this.profit = {
      amount: this.revenue.amount - this.costs.total,
      currency: this.revenue.currency
    };
  }
  next();
});

module.exports = mongoose.model('Planting', PlantingSchema);