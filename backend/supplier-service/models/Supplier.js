const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  // Business Information
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true,
    maxlength: [200, 'Business name cannot exceed 200 characters']
  },
  ownerName: {
    type: String,
    required: [true, 'Owner name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number']
  },
  
  // Address
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, default: 'India' }
  },
  
  // Business Details
  businessType: {
    type: String,
    enum: ['wholesaler', 'manufacturer', 'distributor', 'retailer'],
    required: true
  },
  gstNumber: {
    type: String,
    required: [true, 'GST number is required'],
    unique: true,
    match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number format']
  },
  panNumber: {
    type: String,
    required: [true, 'PAN number is required'],
    match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN number format']
  },
  
  // Certifications
  certifications: [{
    name: String,
    issuedBy: String,
    certificateNumber: String,
    issueDate: Date,
    expiryDate: Date,
    documentUrl: String
  }],
  
  // Bank Details
  bankDetails: {
    accountHolderName: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    branchName: String
  },
  
  // Business Documents
  documents: {
    businessLicense: String,
    gstCertificate: String,
    panCard: String,
    cancelledCheque: String,
    addressProof: String
  },
  
  // Status and Verification
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended', 'inactive'],
    default: 'pending'
  },
  verificationStatus: {
    documentsVerified: { type: Boolean, default: false },
    bankVerified: { type: Boolean, default: false },
    addressVerified: { type: Boolean, default: false }
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  rejectionReason: String,
  
  // Performance Metrics
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  totalSales: {
    type: Number,
    default: 0
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  
  // Operational Details
  operatingHours: {
    monday: { open: String, close: String, isOpen: Boolean },
    tuesday: { open: String, close: String, isOpen: Boolean },
    wednesday: { open: String, close: String, isOpen: Boolean },
    thursday: { open: String, close: String, isOpen: Boolean },
    friday: { open: String, close: String, isOpen: Boolean },
    saturday: { open: String, close: String, isOpen: Boolean },
    sunday: { open: String, close: String, isOpen: Boolean }
  },
  deliveryAreas: [{
    state: String,
    cities: [String]
  }],
  minimumOrderValue: {
    type: Number,
    default: 0
  },
  
  // Contact Person
  contactPerson: {
    name: String,
    designation: String,
    phone: String,
    email: String
  },
  
  // Settings
  settings: {
    autoAcceptOrders: { type: Boolean, default: false },
    notifyOnNewOrder: { type: Boolean, default: true },
    notifyOnLowStock: { type: Boolean, default: true },
    lowStockThreshold: { type: Number, default: 10 }
  }
}, {
  timestamps: true
});

// Indexes
supplierSchema.index({ email: 1 });
supplierSchema.index({ gstNumber: 1 });
supplierSchema.index({ status: 1 });
supplierSchema.index({ businessType: 1 });
supplierSchema.index({ 'address.city': 1, 'address.state': 1 });

// Virtual for full address
supplierSchema.virtual('fullAddress').get(function() {
  return `${this.address.street}, ${this.address.city}, ${this.address.state} - ${this.address.zipCode}`;
});

// Method to calculate average rating
supplierSchema.methods.calculateAverageRating = function() {
  if (this.totalRatings === 0) return 0;
  return this.rating / this.totalRatings;
};

// Method to check if supplier is operational
supplierSchema.methods.isOperational = function() {
  return this.status === 'approved' && this.verificationStatus.documentsVerified;
};

module.exports = mongoose.model('Supplier', supplierSchema);