const AdminNotification = require('../models/AdminNotification');
const Admin = require('../models/Admin');

/**
 * Create a new notification
 * @param {Object} notificationData - Notification data
 * @returns {Object} Created notification
 */
exports.createNotification = async (notificationData) => {
  try {
    const notification = await AdminNotification.createNotification(notificationData);
    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    throw new Error(`Failed to create notification: ${error.message}`);
  }
};

/**
 * Get a notification by ID
 * @param {string} id - Notification ID
 * @param {string} adminId - Admin ID
 * @returns {Object} Notification
 */
exports.getNotificationById = async (id, adminId) => {
  try {
    const notification = await AdminNotification.findOne({
      _id: id,
      recipientId: adminId
    });
    
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    return notification;
  } catch (error) {
    console.error('Get notification error:', error);
    throw new Error(`Failed to get notification: ${error.message}`);
  }
};

/**
 * Get notifications for an admin
 * @param {string} adminId - Admin ID
 * @param {Object} options - Query options
 * @returns {Array} Notifications
 */
exports.getNotificationsForAdmin = async (adminId, options = {}) => {
  try {
    const { page = 1, limit = 20, read, type, priority, sort = { createdAt: -1 } } = options;
    
    const query = { recipientId: adminId };
    
    if (read !== undefined) {
      query.read = read;
    }
    
    if (type) {
      query.type = type;
    }
    
    if (priority) {
      query.priority = priority;
    }
    
    const notifications = await AdminNotification.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);
      
    const total = await AdminNotification.countDocuments(query);
    
    return {
      notifications,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Get notifications for admin error:', error);
    throw new Error(`Failed to get notifications: ${error.message}`);
  }
};

/**
 * Mark a notification as read
 * @param {string} id - Notification ID
 * @param {string} adminId - Admin ID
 * @returns {Object} Updated notification
 */
exports.markAsRead = async (id, adminId) => {
  try {
    const notification = await AdminNotification.markAsRead(id, adminId);
    
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    return notification;
  } catch (error) {
    console.error('Mark notification as read error:', error);
    throw new Error(`Failed to mark notification as read: ${error.message}`);
  }
};

/**
 * Mark all notifications as read for an admin
 * @param {string} adminId - Admin ID
 * @returns {Object} Result
 */
exports.markAllAsRead = async (adminId) => {
  try {
    const result = await AdminNotification.markAllAsRead(adminId);
    return { success: true, count: result.modifiedCount };
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    throw new Error(`Failed to mark all notifications as read: ${error.message}`);
  }
};

/**
 * Get unread notifications count for an admin
 * @param {string} adminId - Admin ID
 * @returns {number} Unread count
 */
exports.getUnreadCount = async (adminId) => {
  try {
    const count = await AdminNotification.getUnreadCount(adminId);
    return { count };
  } catch (error) {
    console.error('Get unread count error:', error);
    throw new Error(`Failed to get unread count: ${error.message}`);
  }
};

/**
 * Delete a notification
 * @param {string} id - Notification ID
 * @param {string} adminId - Admin ID
 * @returns {Object} Deleted notification
 */
exports.deleteNotification = async (id, adminId) => {
  try {
    const notification = await AdminNotification.findOneAndDelete({
      _id: id,
      recipientId: adminId
    });
    
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    return notification;
  } catch (error) {
    console.error('Delete notification error:', error);
    throw new Error(`Failed to delete notification: ${error.message}`);
  }
};

/**
 * Delete all notifications for an admin
 * @param {string} adminId - Admin ID
 * @returns {Object} Result
 */
exports.deleteAllNotifications = async (adminId) => {
  try {
    const result = await AdminNotification.deleteMany({ recipientId: adminId });
    return { success: true, count: result.deletedCount };
  } catch (error) {
    console.error('Delete all notifications error:', error);
    throw new Error(`Failed to delete all notifications: ${error.message}`);
  }
};

/**
 * Send notification to all admins
 * @param {Object} notificationData - Notification data
 * @returns {Object} Result
 */
exports.sendToAllAdmins = async (notificationData) => {
  try {
    // Get all active admins
    const admins = await Admin.find({ active: true });
    
    const notifications = [];
    
    // Create notification for each admin
    for (const admin of admins) {
      const notification = await AdminNotification.createNotification({
        ...notificationData,
        recipientId: admin._id
      });
      
      notifications.push(notification);
    }
    
    return { success: true, count: notifications.length };
  } catch (error) {
    console.error('Send to all admins error:', error);
    throw new Error(`Failed to send notification to all admins: ${error.message}`);
  }
};

/**
 * Send notification to admins by role
 * @param {Object} notificationData - Notification data
 * @param {string} role - Admin role
 * @returns {Object} Result
 */
exports.sendToAdminsByRole = async (notificationData, role) => {
  try {
    // Get all active admins with the specified role
    const admins = await Admin.find({ active: true, role });
    
    const notifications = [];
    
    // Create notification for each admin
    for (const admin of admins) {
      const notification = await AdminNotification.createNotification({
        ...notificationData,
        recipientId: admin._id
      });
      
      notifications.push(notification);
    }
    
    return { success: true, count: notifications.length };
  } catch (error) {
    console.error('Send to admins by role error:', error);
    throw new Error(`Failed to send notification to admins by role: ${error.message}`);
  }
};

/**
 * Delete expired notifications
 * @returns {number} Number of deleted notifications
 */
exports.deleteExpiredNotifications = async () => {
  try {
    const result = await AdminNotification.deleteExpiredNotifications();
    return result.deletedCount;
  } catch (error) {
    console.error('Delete expired notifications error:', error);
    throw new Error(`Failed to delete expired notifications: ${error.message}`);
  }
};

/**
 * Create system alert notification
 * @param {string} message - Alert message
 * @param {string} priority - Priority level
 * @param {Object} details - Additional details
 * @returns {Object} Created notification
 */
exports.createSystemAlert = async (message, priority = 'high', details = {}) => {
  try {
    // Get all super-admins
    const superAdmins = await Admin.find({ active: true, role: 'super-admin' });
    
    const notifications = [];
    
    // Create notification for each super-admin
    for (const admin of superAdmins) {
      const notification = await AdminNotification.createNotification({
        title: 'System Alert',
        message,
        type: 'error',
        priority,
        icon: 'warning',
        recipientId: admin._id,
        relatedResource: {
          resourceType: 'system',
          resourceId: 'system'
        },
        metadata: details
      });
      
      notifications.push(notification);
    }
    
    return { success: true, count: notifications.length };
  } catch (error) {
    console.error('Create system alert error:', error);
    throw new Error(`Failed to create system alert: ${error.message}`);
  }
};