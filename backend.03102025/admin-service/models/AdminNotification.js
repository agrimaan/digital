const mongoose = require('mongoose');

const AdminNotificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a notification title'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Please provide a notification message']
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error', 'system'],
    default: 'info'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  icon: {
    type: String,
    default: 'bell'
  },
  link: {
    type: String
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  relatedResource: {
    resourceType: {
      type: String,
      enum: [
        'user', 'farmer', 'buyer', 'logistics', 'crop', 'field', 'iot', 
        'marketplace', 'order', 'transaction', 'admin', 'settings', 
        'report', 'analytics', 'blockchain', 'system', 'other'
      ]
    },
    resourceId: {
      type: String
    }
  },
  metadata: {
    type: Object
  },
  expiresAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
AdminNotificationSchema.index({ recipientId: 1, read: 1 });
AdminNotificationSchema.index({ recipientId: 1, createdAt: -1 });
AdminNotificationSchema.index({ type: 1 });
AdminNotificationSchema.index({ priority: 1 });

// Static method to create a notification
AdminNotificationSchema.statics.createNotification = async function(notificationData) {
  return this.create(notificationData);
};

// Static method to mark a notification as read
AdminNotificationSchema.statics.markAsRead = async function(notificationId, adminId) {
  return this.findOneAndUpdate(
    { _id: notificationId, recipientId: adminId },
    { read: true, readAt: new Date() },
    { new: true }
  );
};

// Static method to mark all notifications as read for an admin
AdminNotificationSchema.statics.markAllAsRead = async function(adminId) {
  return this.updateMany(
    { recipientId: adminId, read: false },
    { read: true, readAt: new Date() }
  );
};

// Static method to get unread notifications count for an admin
AdminNotificationSchema.statics.getUnreadCount = async function(adminId) {
  return this.countDocuments({ recipientId: adminId, read: false });
};

// Static method to get recent notifications for an admin
AdminNotificationSchema.statics.getRecentNotifications = async function(adminId, limit = 10) {
  return this.find({ recipientId: adminId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to delete expired notifications
AdminNotificationSchema.statics.deleteExpiredNotifications = async function() {
  const now = new Date();
  return this.deleteMany({
    expiresAt: { $lt: now }
  });
};

module.exports = mongoose.model('AdminNotification', AdminNotificationSchema);