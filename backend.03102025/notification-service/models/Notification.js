const mongoose = require('mongoose');

/**
 * Notification Schema
 * Represents a notification sent to a user or group of users
 */
const notificationSchema = new mongoose.Schema({
  // Recipient user ID
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Notification type (e.g., alert, info, reminder, etc.)
  type: {
    type: String,
    required: true,
    index: true
  },
  
  // Notification title
  title: {
    type: String,
    required: true,
    trim: true
  },
  
  // Notification message content
  message: {
    type: String,
    required: true
  },
  
  // Additional data related to the notification (JSON object)
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Notification priority level
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
    index: true
  },
  
  // Notification category (e.g., system, crop, weather, marketplace, etc.)
  category: {
    type: String,
    required: true,
    index: true
  },
  
  // Notification channel (e.g., in-app, email, sms, push, etc.)
  channel: {
    type: String,
    required: true,
    enum: ['in-app', 'email', 'sms', 'push', 'webhook'],
    index: true
  },
  
  // Reference to the template used to generate this notification (if any)
  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NotificationTemplate',
    index: true
  },
  
  // Status of the notification
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
    default: 'pending',
    index: true
  },
  
  // Error message if notification failed
  errorMessage: {
    type: String
  },
  
  // Timestamp when the notification was read by the recipient
  readAt: {
    type: Date
  },
  
  // Timestamp when the notification was delivered to the recipient
  deliveredAt: {
    type: Date
  },
  
  // Whether the notification is active or has been archived/deleted
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // Scheduled time for sending the notification (for delayed notifications)
  scheduledFor: {
    type: Date,
    index: true
  },
  
  // Expiration time for the notification
  expiresAt: {
    type: Date,
    index: true
  },
  
  // Actions that can be performed on this notification
  actions: [{
    // Action name/identifier
    name: {
      type: String,
      required: true
    },
    
    // Display text for the action
    text: {
      type: String,
      required: true
    },
    
    // URL or deep link to execute when action is clicked
    url: {
      type: String
    },
    
    // Icon for the action button
    icon: {
      type: String
    },
    
    // Primary action flag
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  
  // Metadata for tracking and analytics
  metadata: {
    // Source service that generated the notification
    source: {
      type: String
    },
    
    // IP address of the sender
    senderIp: {
      type: String
    },
    
    // User agent of the sender
    userAgent: {
      type: String
    },
    
    // Device information
    device: {
      type: String
    },
    
    // Tracking ID for analytics
    trackingId: {
      type: String
    }
  }
}, {
  timestamps: true,
  versionKey: false
});

// Create indexes for common query patterns
notificationSchema.index({ recipient: 1, status: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, category: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isActive: 1, createdAt: -1 });
notificationSchema.index({ scheduledFor: 1, status: 1 });
notificationSchema.index({ expiresAt: 1, isActive: 1 });

/**
 * Mark notification as read
 */
notificationSchema.methods.markAsRead = async function() {
  if (!this.readAt) {
    this.readAt = new Date();
    this.status = 'read';
    await this.save();
  }
  return this;
};

/**
 * Mark notification as delivered
 */
notificationSchema.methods.markAsDelivered = async function() {
  if (!this.deliveredAt) {
    this.deliveredAt = new Date();
    this.status = 'delivered';
    await this.save();
  }
  return this;
};

/**
 * Archive notification
 */
notificationSchema.methods.archive = async function() {
  this.isActive = false;
  await this.save();
  return this;
};

/**
 * Static method to find unread notifications for a user
 */
notificationSchema.statics.findUnreadByUser = function(userId, options = {}) {
  const query = {
    recipient: userId,
    status: { $ne: 'read' },
    isActive: true
  };
  
  if (options.category) query.category = options.category;
  if (options.priority) query.priority = options.priority;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

/**
 * Static method to count unread notifications for a user
 */
notificationSchema.statics.countUnreadByUser = function(userId, options = {}) {
  const query = {
    recipient: userId,
    status: { $ne: 'read' },
    isActive: true
  };
  
  if (options.category) query.category = options.category;
  if (options.priority) query.priority = options.priority;
  
  return this.countDocuments(query);
};

/**
 * Static method to mark all notifications as read for a user
 */
notificationSchema.statics.markAllAsRead = async function(userId, options = {}) {
  const query = {
    recipient: userId,
    status: { $ne: 'read' },
    isActive: true
  };
  
  if (options.category) query.category = options.category;
  
  const now = new Date();
  
  const result = await this.updateMany(
    query,
    {
      $set: {
        status: 'read',
        readAt: now
      }
    }
  );
  
  return result.modifiedCount;
};

/**
 * Static method to find notifications scheduled for sending
 */
notificationSchema.statics.findScheduledForSending = function(options = {}) {
  const now = new Date();
  
  const query = {
    scheduledFor: { $lte: now },
    status: 'pending',
    isActive: true
  };
  
  return this.find(query)
    .sort({ scheduledFor: 1 })
    .limit(options.limit || 100);
};

/**
 * Static method to find expired notifications
 */
notificationSchema.statics.findExpired = function(options = {}) {
  const now = new Date();
  
  const query = {
    expiresAt: { $lte: now },
    isActive: true
  };
  
  return this.find(query)
    .sort({ expiresAt: 1 })
    .limit(options.limit || 100);
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;