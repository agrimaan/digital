const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  resource: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource',
    required: [true, 'Resource is required']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  userName: String,
  userEmail: String,
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  duration: {
    value: Number,
    unit: {
      type: String,
      enum: ['hours', 'days', 'weeks'],
      default: 'hours'
    }
  },
  pricing: {
    rate: Number,
    total: Number,
    currency: {
      type: String,
      default: 'INR'
    }
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'Rejected'],
    default: 'Pending'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Refunded', 'Failed'],
    default: 'Pending'
  },
  paymentDetails: {
    method: String,
    transactionId: String,
    paidAt: Date
  },
  notes: String,
  cancellationReason: String,
  cancelledAt: Date,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  blockchain: {
    registered: {
      type: Boolean,
      default: false
    },
    transactionHash: String,
    blockNumber: Number,
    registeredAt: Date
  }
}, {
  timestamps: true
});

// Indexes
bookingSchema.index({ resource: 1, startDate: 1, endDate: 1 });
bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ status: 1, createdAt: -1 });

// Calculate duration before saving
bookingSchema.pre('save', function(next) {
  if (this.startDate && this.endDate) {
    const diffMs = this.endDate - this.startDate;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      this.duration = { value: diffHours, unit: 'hours' };
    } else if (diffHours < 168) {
      this.duration = { value: diffHours / 24, unit: 'days' };
    } else {
      this.duration = { value: diffHours / 168, unit: 'weeks' };
    }
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
