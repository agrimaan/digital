const Notification = require('../models/Notification');
const NotificationTemplate = require('../models/NotificationTemplate');
const NotificationPreference = require('../models/NotificationPreference');
const emailService = require('./emailService');
const smsService = require('./smsService');
const pushNotificationService = require('./pushNotificationService');
const webhookService = require('./webhookService');
const templateService = require('./templateService');
const { createError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

/**
 * Service for handling notification operations
 */
class NotificationService {
  /**
   * Create and send a notification
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Object>} - Created notification
   */
  async createAndSend(notificationData) {
    try {
      // Validate required fields
      if (!notificationData.recipient || !notificationData.type || !notificationData.category) {
        throw createError(400, 'Missing required fields: recipient, type, and category are required');
      }
      
      // If template is provided, use it to generate notification content
      let notificationContent = {};
      if (notificationData.template) {
        const templateData = await templateService.renderTemplate(
          notificationData.template,
          notificationData.templateData || {},
          notificationData.channel || 'in-app'
        );
        
        notificationContent = {
          title: templateData.title,
          message: templateData.message,
          data: templateData.data || notificationData.data,
          actions: templateData.actions
        };
      } else {
        // Otherwise use provided content
        if (!notificationData.title || !notificationData.message) {
          throw createError(400, 'Either template or title and message are required');
        }
        
        notificationContent = {
          title: notificationData.title,
          message: notificationData.message,
          data: notificationData.data || {},
          actions: notificationData.actions || []
        };
      }
      
      // Check user preferences if this notification should be sent
      const shouldSend = await this.checkUserPreferences(
        notificationData.recipient,
        notificationData.category,
        notificationData.type,
        notificationData.channel || 'in-app',
        notificationData.priority || 'normal',
        notificationData.template
      );
      
      if (!shouldSend) {
        logger.info(`Notification skipped due to user preferences: ${notificationData.recipient}`);
        return {
          skipped: true,
          reason: 'User preferences'
        };
      }
      
      // Create notification object
      const notification = new Notification({
        recipient: notificationData.recipient,
        type: notificationData.type,
        title: notificationContent.title,
        message: notificationContent.message,
        data: notificationContent.data,
        priority: notificationData.priority || 'normal',
        category: notificationData.category,
        channel: notificationData.channel || 'in-app',
        template: notificationData.template,
        actions: notificationContent.actions,
        status: 'pending',
        scheduledFor: notificationData.scheduledFor || new Date(),
        expiresAt: notificationData.expiresAt,
        metadata: {
          source: notificationData.source || 'notification-service',
          ...notificationData.metadata
        }
      });
      
      // Save notification
      await notification.save();
      
      // If notification is scheduled for the future, don't send it now
      if (notificationData.scheduledFor && new Date(notificationData.scheduledFor) > new Date()) {
        logger.info(`Notification scheduled for future delivery: ${notification._id}`);
        return notification;
      }
      
      // Send notification through appropriate channel
      const result = await this.sendNotification(notification);
      
      // Update notification status based on send result
      if (result.success) {
        notification.status = 'sent';
        if (result.deliveredAt) {
          notification.deliveredAt = result.deliveredAt;
          notification.status = 'delivered';
        }
      } else {
        notification.status = 'failed';
        notification.errorMessage = result.error || 'Failed to send notification';
      }
      
      await notification.save();
      
      return notification;
    } catch (error) {
      logger.error(`Error creating and sending notification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send a notification through the appropriate channel
   * @param {Object} notification - Notification object
   * @returns {Promise<Object>} - Send result
   */
  async sendNotification(notification) {
    try {
      // Get user preferences for delivery settings
      const preferences = await NotificationPreference.getOrCreate(notification.recipient);
      const deliverySettings = preferences.getDeliverySettings(
        notification.category,
        notification.type,
        notification.channel
      );
      
      // Send through appropriate channel
      let result;
      switch (notification.channel) {
        case 'email':
          result = await emailService.sendNotification(notification, deliverySettings);
          break;
          
        case 'sms':
          result = await smsService.sendNotification(notification, deliverySettings);
          break;
          
        case 'push':
          result = await pushNotificationService.sendNotification(notification, deliverySettings);
          break;
          
        case 'webhook':
          result = await webhookService.sendNotification(notification, deliverySettings);
          break;
          
        case 'in-app':
        default:
          // In-app notifications are considered delivered immediately
          result = {
            success: true,
            deliveredAt: new Date()
          };
          break;
      }
      
      return result;
    } catch (error) {
      logger.error(`Error sending notification: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if a notification should be sent based on user preferences
   * @param {String} userId - User ID
   * @param {String} category - Notification category
   * @param {String} type - Notification type
   * @param {String} channel - Notification channel
   * @param {String} priority - Notification priority
   * @param {String} template - Notification template name
   * @returns {Promise<Boolean>} - Whether notification should be sent
   */
  async checkUserPreferences(userId, category, type, channel, priority, template) {
    try {
      // Get user preferences
      const preferences = await NotificationPreference.getOrCreate(userId);
      
      // Check if notifications are enabled for this combination
      return preferences.isEnabled(category, type, channel, priority, template);
    } catch (error) {
      logger.error(`Error checking user preferences: ${error.message}`);
      // Default to sending notification if there's an error checking preferences
      return true;
    }
  }

  /**
   * Get notification by ID
   * @param {String} id - Notification ID
   * @returns {Promise<Object>} - Notification object
   */
  async getNotificationById(id) {
    try {
      const notification = await Notification.findById(id);
      
      if (!notification) {
        throw createError(404, `Notification with ID ${id} not found`);
      }
      
      return notification;
    } catch (error) {
      logger.error(`Error retrieving notification by ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get notifications for a user with pagination
   * @param {String} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Paginated notifications
   */
  async getUserNotifications(userId, options = {}) {
    try {
      const query = {
        recipient: userId
      };
      
      // Apply filters
      if (options.status) query.status = options.status;
      if (options.category) query.category = options.category;
      if (options.type) query.type = options.type;
      if (options.channel) query.channel = options.channel;
      if (options.priority) query.priority = options.priority;
      
      // Default to active notifications only
      if (options.isActive !== false) {
        query.isActive = true;
      }
      
      // Set up pagination
      const page = parseInt(options.page) || 1;
      const limit = parseInt(options.limit) || 20;
      const skip = (page - 1) * limit;
      
      // Execute query with pagination
      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      // Get total count for pagination
      const total = await Notification.countDocuments(query);
      
      return {
        data: notifications,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error(`Error retrieving user notifications: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mark a notification as read
   * @param {String} id - Notification ID
   * @returns {Promise<Object>} - Updated notification
   */
  async markAsRead(id) {
    try {
      const notification = await Notification.findById(id);
      
      if (!notification) {
        throw createError(404, `Notification with ID ${id} not found`);
      }
      
      return await notification.markAsRead();
    } catch (error) {
      logger.error(`Error marking notification as read: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param {String} userId - User ID
   * @param {Object} options - Options (category, etc.)
   * @returns {Promise<Number>} - Number of notifications marked as read
   */
  async markAllAsRead(userId, options = {}) {
    try {
      return await Notification.markAllAsRead(userId, options);
    } catch (error) {
      logger.error(`Error marking all notifications as read: ${error.message}`);
      throw error;
    }
  }

  /**
   * Count unread notifications for a user
   * @param {String} userId - User ID
   * @param {Object} options - Options (category, etc.)
   * @returns {Promise<Number>} - Number of unread notifications
   */
  async countUnread(userId, options = {}) {
    try {
      return await Notification.countUnreadByUser(userId, options);
    } catch (error) {
      logger.error(`Error counting unread notifications: ${error.message}`);
      throw error;
    }
  }

  /**
   * Archive a notification
   * @param {String} id - Notification ID
   * @returns {Promise<Object>} - Updated notification
   */
  async archiveNotification(id) {
    try {
      const notification = await Notification.findById(id);
      
      if (!notification) {
        throw createError(404, `Notification with ID ${id} not found`);
      }
      
      return await notification.archive();
    } catch (error) {
      logger.error(`Error archiving notification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a notification
   * @param {String} id - Notification ID
   * @returns {Promise<Boolean>} - Whether deletion was successful
   */
  async deleteNotification(id) {
    try {
      const result = await Notification.findByIdAndDelete(id);
      
      if (!result) {
        throw createError(404, `Notification with ID ${id} not found`);
      }
      
      return true;
    } catch (error) {
      logger.error(`Error deleting notification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process scheduled notifications
   * @param {Number} limit - Maximum number of notifications to process
   * @returns {Promise<Object>} - Processing results
   */
  async processScheduledNotifications(limit = 100) {
    try {
      const notifications = await Notification.findScheduledForSending({ limit });
      
      logger.info(`Processing ${notifications.length} scheduled notifications`);
      
      const results = {
        total: notifications.length,
        sent: 0,
        failed: 0,
        details: []
      };
      
      for (const notification of notifications) {
        try {
          // Send notification
          const result = await this.sendNotification(notification);
          
          // Update notification status
          if (result.success) {
            notification.status = 'sent';
            if (result.deliveredAt) {
              notification.deliveredAt = result.deliveredAt;
              notification.status = 'delivered';
            }
            results.sent++;
          } else {
            notification.status = 'failed';
            notification.errorMessage = result.error || 'Failed to send notification';
            results.failed++;
          }
          
          await notification.save();
          
          results.details.push({
            id: notification._id,
            success: result.success,
            error: result.error
          });
        } catch (error) {
          logger.error(`Error processing scheduled notification ${notification._id}: ${error.message}`);
          
          notification.status = 'failed';
          notification.errorMessage = error.message;
          await notification.save();
          
          results.failed++;
          results.details.push({
            id: notification._id,
            success: false,
            error: error.message
          });
        }
      }
      
      return results;
    } catch (error) {
      logger.error(`Error processing scheduled notifications: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process expired notifications
   * @param {Number} limit - Maximum number of notifications to process
   * @returns {Promise<Object>} - Processing results
   */
  async processExpiredNotifications(limit = 100) {
    try {
      const notifications = await Notification.findExpired({ limit });
      
      logger.info(`Processing ${notifications.length} expired notifications`);
      
      const results = {
        total: notifications.length,
        archived: 0,
        failed: 0
      };
      
      for (const notification of notifications) {
        try {
          // Archive expired notification
          await notification.archive();
          results.archived++;
        } catch (error) {
          logger.error(`Error archiving expired notification ${notification._id}: ${error.message}`);
          results.failed++;
        }
      }
      
      return results;
    } catch (error) {
      logger.error(`Error processing expired notifications: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send a batch of notifications
   * @param {Array} notifications - Array of notification data objects
   * @returns {Promise<Object>} - Batch results
   */
  async sendBatch(notifications) {
    try {
      if (!Array.isArray(notifications) || notifications.length === 0) {
        throw createError(400, 'Notifications must be a non-empty array');
      }
      
      const results = {
        total: notifications.length,
        sent: 0,
        skipped: 0,
        failed: 0,
        details: []
      };
      
      for (const notificationData of notifications) {
        try {
          const result = await this.createAndSend(notificationData);
          
          if (result.skipped) {
            results.skipped++;
            results.details.push({
              recipient: notificationData.recipient,
              success: false,
              skipped: true,
              reason: result.reason
            });
          } else if (result.status === 'sent' || result.status === 'delivered') {
            results.sent++;
            results.details.push({
              id: result._id,
              recipient: result.recipient,
              success: true
            });
          } else {
            results.failed++;
            results.details.push({
              id: result._id,
              recipient: result.recipient,
              success: false,
              error: result.errorMessage
            });
          }
        } catch (error) {
          results.failed++;
          results.details.push({
            recipient: notificationData.recipient,
            success: false,
            error: error.message
          });
        }
      }
      
      return results;
    } catch (error) {
      logger.error(`Error sending batch notifications: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new NotificationService();