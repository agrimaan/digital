
const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MarketplaceListing',
    required: true
  },
  cropName: {
    type: String,
    required: true
  },
  variety: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unit: {
    type: String,
    required: true
  },
  pricePerUnit: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  seller: {
    type: String, // Farmer ID from user-service
    required: true
  },
  sellerName: String,
  images: [String],
  farmLocation: {
    city: String,
    state: String
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const CartSchema = new mongoose.Schema({
  buyer: {
    type: String, // User ID from user-service
    required: true,
    unique: true
  },
  items: [CartItemSchema],
  totalAmount: {
    type: Number,
    default: 0
  },
  itemCount: {
    type: Number,
    default: 0
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

// Calculate totals before saving
CartSchema.pre('save', function(next) {
  this.itemCount = this.items.length;
  this.totalAmount = this.items.reduce((total, item) => total + item.totalPrice, 0);
  this.updatedAt = Date.now();
  next();
});

// Instance method to add item
CartSchema.methods.addItem = function(itemData) {
  // Check if item already exists
  const existingItemIndex = this.items.findIndex(
    item => item.listing.toString() === itemData.listing.toString()
  );

  if (existingItemIndex > -1) {
    // Update existing item quantity
    this.items[existingItemIndex].quantity += itemData.quantity;
    this.items[existingItemIndex].totalPrice = 
      this.items[existingItemIndex].quantity * this.items[existingItemIndex].pricePerUnit;
  } else {
    // Add new item
    this.items.push(itemData);
  }
  
  return this.save();
};

// Instance method to update item quantity
CartSchema.methods.updateItemQuantity = function(listingId, quantity) {
  const item = this.items.find(item => item.listing.toString() === listingId);
  
  if (item) {
    item.quantity = quantity;
    item.totalPrice = item.quantity * item.pricePerUnit;
  }
  
  return this.save();
};

// Instance method to remove item
CartSchema.methods.removeItem = function(listingId) {
  this.items = this.items.filter(item => item.listing.toString() !== listingId);
  return this.save();
};

// Instance method to clear cart
CartSchema.methods.clearCart = function() {
  this.items = [];
  return this.save();
};

module.exports = mongoose.model('Cart', CartSchema);
