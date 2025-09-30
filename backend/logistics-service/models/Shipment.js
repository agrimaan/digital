const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  shipmentId: {
    type: String,
    required: true,
    unique: true,
    default: () => 'SHP' + Date.now()
  },
  orderId: {
    type: String,
    required: true,
    ref: 'Order'
  },
  farmerId: {
    type: String,
    required: true,
    ref: 'User'
  },
  buyerId: {
    type: String,
    required: true,
    ref: 'User'
  },
  pickupLocation: {
    address: { type: String, required: true },
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    },
    contact: {
      name: String,
      phone: String,
      email: String
    }
  },
  deliveryLocation: {
    address: { type: String, required: true },
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    },
    contact: {
      name: String,
      phone: String,
      email: String
    }
  },
  items: [{
    cropId: { type: String, required: true },
    cropName: String,
    quantity: { type: Number, required: true },
    unit: String,
    price: Number
  }],
  totalWeight: {
    type: Number,
    required: true
  },
  totalValue: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_transit', 'delivered', 'cancelled', 'failed'],
    default: 'pending'
  },
  assignedVehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    default: null
  },
  driver: {
    name: String,
    phone: String,
    licenseNumber: String
  },
  estimatedDelivery: {
    type: Date,
    required: true
  },
  actualDelivery: {
    type: Date,
    default: null
  },
  trackingUpdates: [{
    status: String,
    location: String,
    timestamp: { type: Date, default: Date.now },
    notes: String
  }],
  shippingCost: {
    type: Number,
    default: 0
  },
  insurance: {
    required: { type: Boolean, default: false },
    cost: { type: Number, default: 0 },
    provider: String
  },
  packaging: {
    type: String,
    enum: ['standard', 'refrigerated', 'fragile', 'bulk'],
    default: 'standard'
  },
  specialInstructions: String,
  documents: [{
    type: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  rating: {
    delivery: { type: Number, min: 1, max: 5 },
    communication: { type: Number, min: 1, max: 5 },
    condition: { type: Number, min: 1, max: 5 },
    review: String
  }
}, {
  timestamps: true
});

shipmentSchema.index({ shipmentId: 1 });
shipmentSchema.index({ orderId: 1 });
shipmentSchema.index({ farmerId: 1 });
shipmentSchema.index({ buyerId: 1 });
shipmentSchema.index({ status: 1 });
shipmentSchema.index({ 'pickupLocation.coordinates': '2dsphere' });
shipmentSchema.index({ 'deliveryLocation.coordinates': '2dsphere' });

module.exports = mongoose.model('Shipment', shipmentSchema);