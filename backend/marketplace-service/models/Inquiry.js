const mongoose = require('mongoose');

const InquirySchema = new mongoose.Schema({
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MarketplaceListing',
    required: true
  },
  buyer: {
    type: String, // User ID from user-service
    required: true
  },
  buyerName: {
    type: String,
    required: true
  },
  buyerEmail: {
    type: String,
    required: true
  },
  buyerPhone: {
    type: String
  },
  farmer: {
    type: String, // User ID from user-service
    required: true
  },
  farmerName: {
    type: String
  },
  cropName: {
    type: String,
    required: true
  },
  variety: {
    type: String
  },
  message: {
    type: String,
    required: true
  },
  interestedQuantity: {
    type: Number
  },
  quantityUnit: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'responded', 'closed'],
    default: 'pending'
  },
  response: {
    message: {
      type: String
    },
    respondedAt: {
      type: Date
    },
    respondedBy: {
      type: String
    }
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isResponseRead: {
    type: Boolean,
    default: false
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
InquirySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster queries
InquirySchema.index({ buyer: 1, createdAt: -1 });
InquirySchema.index({ farmer: 1, createdAt: -1 });
InquirySchema.index({ listing: 1 });
InquirySchema.index({ status: 1 });

// Instance method to add response
InquirySchema.methods.addResponse = function(responseMessage, respondedBy) {
  this.response = {
    message: responseMessage,
    respondedAt: new Date(),
    respondedBy: respondedBy
  };
  this.status = 'responded';
  this.isResponseRead = false;
  return this.save();
};

// Instance method to mark as read
InquirySchema.methods.markAsRead = function() {
  this.isRead = true;
  return this.save();
};

// Instance method to mark response as read
InquirySchema.methods.markResponseAsRead = function() {
  this.isResponseRead = true;
  return this.save();
};

// Static method to get unread count for farmer
InquirySchema.statics.getUnreadCountForFarmer = async function(farmerId) {
  return this.countDocuments({ farmer: farmerId, isRead: false });
};

// Static method to get pending count for farmer
InquirySchema.statics.getPendingCountForFarmer = async function(farmerId) {
  return this.countDocuments({ farmer: farmerId, status: 'pending' });
};

// Static method to get unread responses count for buyer
InquirySchema.statics.getUnreadResponsesCountForBuyer = async function(buyerId) {
  return this.countDocuments({ 
    buyer: buyerId, 
    status: 'responded',
    isResponseRead: false 
  });
};

module.exports = mongoose.model('Inquiry', InquirySchema);