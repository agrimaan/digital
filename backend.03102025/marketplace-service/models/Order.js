const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  buyer: {
    type: String, // User ID from user-service
    required: [true, 'Buyer ID is required']
  },
  seller: {
    type: String, // User ID from user-service
    required: [true, 'Seller ID is required']
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    totalPrice: {
      type: Number,
      required: true
    }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'credit_card', 'debit_card', 'upi', 'wallet', 'crypto'],
    required: true
  },
  paymentDetails: {
    transactionId: String,
    paymentDate: Date,
    receiptUrl: String
  },
  shippingAddress: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
    },
    postalCode: {
      type: String,
      required: true
    },
    contactName: {
      type: String,
      required: true
    },
    contactPhone: {
      type: String,
      required: true
    }
  },
  billingAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
    contactName: String,
    contactPhone: String
  },
  shipment: {
    carrier: String,
    trackingNumber: String,
    estimatedDelivery: Date,
    actualDelivery: Date
  },
  notes: String,
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    comment: String,
    updatedBy: String // User ID from user-service
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate order number before saving
OrderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderNumber = `ORD-${year}${month}${day}-${random}`;
  }
  next();
});

// Update the updatedAt field on save
OrderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add status history entry when status changes
OrderSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      comment: `Order status changed to ${this.status}`
    });
  }
  next();
});

module.exports = mongoose.model('Order', OrderSchema);