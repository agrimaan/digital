const notificationService = require('../services/notificationService');
const { handleError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

/**
 * Controller for notification operations
 */
class NotificationController {
  /**
   * Create and send a notification
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createAndSend(req, res) {
    try {
      const notificationData = req.body;
      
      // Validate required fields
      if (!notificationData.recipient || !notificationData.type || !notificationData.category) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: recipient, type, and category are required'
        });
      }
      
      // If neither template nor title/message is provided, return error
      if (!notificationData.template && (!notificationData.title || !notificationData.message)) {
        return res.status(400).json({
          success: false,
          message: 'Either template or title and message are required'
        });
      }
      
      const notification = await notificationService.createAndSend(notificationData);
      
      // Check if notification was skipped due to user preferences
      if (notification.skipped) {
        return res.status(200).json({
          success: true,
          skipped: true,
          reason: notification.reason
        });
      }
      
      res.status(201).json({
        success: true,
        data: notification
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * Send a batch of notifications
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async sendBatch(req, res) {
    try {
      const notifications = req.body;
      
      if (!Array.isArray(notifications) || notifications.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Request body must be a non-empty array of notification objects'
        });
      }
      
      const results = await notificationService.sendBatch(notifications);
      
      res.status(200).json({
        success: true,
        total: results.total,
        sent: results.sent,
        skipped: results.skipped,
        failed: results.failed
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * Get notification by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getNotificationById(req, res) {
    try {
      const { id } = req.params;
      const notification = await notificationService.getNotificationById(id);
      
      res.status(200).json({
        success: true,
        data: notification
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * Get notifications for a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUserNotifications(req, res) {
    try {
      const userId = req.params.userId || req.user.id;
      
      // Check if the requesting user has permission to access these notifications
      if (req.params.userId && req.params.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access these notifications'
        });
      }
      
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        status: req.query.status,
        category: req.query.category,
        type: req.query.type,
        channel: req.query.channel,
        priority: req.query.priority,
        isActive: req.query.isActive !== 'false'
      };
      
      const result = await notificationService.getUserNotifications(userId, options);
      
      res.status(200).json({
        success: true,
        count: result.data.length,
        pagination: result.pagination,
        data: result.data
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * Mark a notification as read
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      
      // Get the notification first to check ownership
      const notification = await notificationService.getNotificationById(id);
      
      // Check if the requesting user has permission to mark this notification as read
      if (notification.recipient.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to mark this notification as read'
        });
      }
      
      const updatedNotification = await notificationService.markAsRead(id);
      
      res.status(200).json({
        success: true,
        data: updatedNotification
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async markAllAsRead(req, res) {
    try {
      const userId = req.params.userId || req.user.id;
      
      // Check if the requesting user has permission to mark these notifications as read
      if (req.params.userId && req.params.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to mark these notifications as read'
        });
      }
      
      const options = {
        category: req.query.category
      };
      
      const count = await notificationService.markAllAsRead(userId, options);
      
      res.status(200).json({
        success: true,
        count
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * Count unread notifications for a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async countUnread(req, res) {
    try {
      const userId = req.params.userId || req.user.id;
      
      // Check if the requesting user has permission to access these notifications
      if (req.params.userId && req.params.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access these notifications'
        });
      }
      
      const options = {
        category: req.query.category,
        priority: req.query.priority
      };
      
      const count = await notificationService.countUnread(userId, options);
      
      res.status(200).json({
        success: true,
        count
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * Archive a notification
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async archiveNotification(req, res) {
    try {
      const { id } = req.params;
      
      // Get the notification first to check ownership
      const notification = await notificationService.getNotificationById(id);
      
      // Check if the requesting user has permission to archive this notification
      if (notification.recipient.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to archive this notification'
        });
      }
      
      const updatedNotification = await notificationService.archiveNotification(id);
      
      res.status(200).json({
        success: true,
        data: updatedNotification
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * Delete a notification
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteNotification(req, res) {
    try {
      const { id } = req.params;
      
      // Get the notification first to check ownership
      const notification = await notificationService.getNotificationById(id);
      
      // Check if the requesting user has permission to delete this notification
      if (notification.recipient.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete this notification'
        });
      }
      
      await notificationService.deleteNotification(id);
      
      res.status(200).json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * Process scheduled notifications (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async processScheduledNotifications(req, res) {
    try {
      // Check if the requesting user has admin permission
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to process scheduled notifications'
        });
      }
      
      const limit = parseInt(req.query.limit) || 100;
      const results = await notificationService.processScheduledNotifications(limit);
      
      res.status(200).json({
        success: true,
        total: results.total,
        sent: results.sent,
        failed: results.failed
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * Process expired notifications (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async processExpiredNotifications(req, res) {
    try {
      // Check if the requesting user has admin permission
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to process expired notifications'
        });
      }
      
      const limit = parseInt(req.query.limit) || 100;
      const results = await notificationService.processExpiredNotifications(limit);
      
      res.status(200).json({
        success: true,
        total: results.total,
        archived: results.archived,
        failed: results.failed
      });
    } catch (error) {
      handleError(res, error);
    }
  }
}

module.exports = new NotificationController();