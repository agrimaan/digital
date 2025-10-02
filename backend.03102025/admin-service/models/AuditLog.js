const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  adminName: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['create', 'read', 'update', 'delete', 'login', 'logout', 'export', 'import', 'approve', 'reject', 'other']
  },
  resourceType: {
    type: String,
    required: true,
    enum: [
      'user', 'farmer', 'buyer', 'logistics', 'crop', 'field', 'iot', 
      'marketplace', 'order', 'transaction', 'admin', 'settings', 
      'notification', 'analytics', 'report', 'blockchain', 'other'
    ]
  },
  resourceId: {
    type: String
  },
  description: {
    type: String,
    required: true
  },
  details: {
    type: Object
  },
  previousState: {
    type: Object
  },
  newState: {
    type: Object
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  status: {
    type: String,
    enum: ['success', 'failure', 'warning', 'info'],
    default: 'success'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
AuditLogSchema.index({ adminId: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ resourceType: 1 });
AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ status: 1 });

// Static method to create an audit log
AuditLogSchema.statics.createLog = async function(logData) {
  return this.create(logData);
};

// Static method to get logs by admin
AuditLogSchema.statics.getLogsByAdmin = async function(adminId, limit = 100) {
  return this.find({ adminId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to get logs by resource
AuditLogSchema.statics.getLogsByResource = async function(resourceType, resourceId, limit = 100) {
  const query = { resourceType };
  if (resourceId) {
    query.resourceId = resourceId;
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to get logs by action
AuditLogSchema.statics.getLogsByAction = async function(action, limit = 100) {
  return this.find({ action })
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to get logs by date range
AuditLogSchema.statics.getLogsByDateRange = async function(startDate, endDate, limit = 100) {
  return this.find({
    timestamp: {
      $gte: startDate,
      $lte: endDate
    }
  })
    .sort({ timestamp: -1 })
    .limit(limit);
};

module.exports = mongoose.model('AuditLog', AuditLogSchema);