const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  vehicleId: {
    type: String,
    required: true,
    unique: true,
    default: () => 'VEH' + Date.now()
  },
  registrationNumber: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['truck', 'van', 'refrigerated_truck', 'pickup', 'bike', 'other'],
    required: true
  },
  make: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true,
    min: 1990,
    max: new Date().getFullYear()
  },
  capacity: {
    maxWeight: { type: Number, required: true }, // in kg
    maxVolume: { type: Number, required: true }, // in cubic meters
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    }
  },
  fuelType: {
    type: String,
    enum: ['diesel', 'petrol', 'electric', 'hybrid', 'cng'],
    required: true
  },
  currentLocation: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: String,
    lastUpdated: { type: Date, default: Date.now }
  },
  status: {
    type: String,
    enum: ['available', 'in_use', 'maintenance', 'out_of_service'],
    default: 'available'
  },
  driver: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    licenseNumber: { type: String, required: true },
    experience: { type: Number, default: 0 }, // years
    rating: { type: Number, min: 1, max: 5, default: 5 }
  },
  owner: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    company: String,
    address: String
  },
  insurance: {
    provider: String,
    policyNumber: String,
    expiryDate: Date,
    coverage: String
  },
  fitness: {
    certificateNumber: String,
    expiryDate: Date,
    status: { type: String, enum: ['valid', 'expired'], default: 'valid' }
  },
  documents: [{
    type: { type: String, enum: ['registration', 'insurance', 'fitness', 'permit'] },
    url: String,
    expiryDate: Date,
    uploadedAt: { type: Date, default: Date.now }
  }],
  features: [{
    type: String,
    enum: ['gps', 'refrigeration', 'tracking', 'temperature_control', 'security_lock']
  }],
  availability: {
    isAvailable: { type: Boolean, default: true },
    availableFrom: { type: Date, default: Date.now },
    availableUntil: Date,
    preferredRoutes: [String],
    restrictions: [String]
  },
  operatingCost: {
    perKm: { type: Number, default: 0 },
    baseRate: { type: Number, default: 0 },
    hourlyRate: { type: Number, default: 0 }
  },
  maintenance: {
    lastService: Date,
    nextService: Date,
    serviceHistory: [{
      date: Date,
      type: String,
      cost: Number,
      description: String
    }]
  },
  images: [{
    url: String,
    caption: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

vehicleSchema.index({ vehicleId: 1 });
vehicleSchema.index({ registrationNumber: 1 });
vehicleSchema.index({ status: 1 });
vehicleSchema.index({ 'currentLocation': '2dsphere' });
vehicleSchema.index({ type: 1 });
vehicleSchema.index({ 'availability.isAvailable': 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);