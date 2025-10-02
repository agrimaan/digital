const adminNotificationService = require('../services/adminNotificationService');
const responseHandler = require('../utils/responseHandler');
const { validationResult } = require('express-validator');

/**
 * @desc    Create a new notification
 * @route   POST /api/notifications
 * @access  Private/Admin
 */
exports.createNotification = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return responseHandler.badRequest(res, 'Validation error', errors.array());
    }

    const notificationData = {
      title: req.body.title,
      message: req.body.message,
      type: req.body.type || 'info',
      priority: req.body.priority || 'medium',
      icon: req.body.icon || 'bell',
      link: req.body.link,
      recipientId: req.body.recipientId,
      senderId: req.admin.id,
      relatedResource: req.body.relatedResource,
      metadata: req.body.metadata,
      expiresAt: req.body.expiresAt
    };

    const notification = await adminNotificationService.createNotification(notificationData);

    return responseHandler.success(
      res,
      201,
      { notification },
      'Notification created successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Get a notification by ID
 * @route   GET /api/notifications/:id
 * @access  Private
 */
exports.getNotificationById = async (req, res) => {
  try {
    const notification = await adminNotificationService.getNotificationById(req.params.id, req.admin.id);

    if (!notification) {
      return responseHandler.notFound(res, 'Notification not found');
    }

    return responseHandler.success(
      res,
      200,
      { notification },
      'Notification retrieved successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Get notifications for an admin
 * @route   GET /api/notifications
 * @access  Private
 */
exports.getNotificationsForAdmin = async (req, res) => {
  try {
    const { page, limit, read, type, priority } = req.query;
    
    const options = {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
      read: read === 'true' ? true : read === 'false' ? false : undefined,
      type,
      priority
    };
    
    const result = await adminNotificationService.getNotificationsForAdmin(req.admin.id, options);

    return responseHandler.success(
      res,
      200,
      result,
      'Notifications retrieved successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Mark a notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
exports.markAsRead = async (req, res) => {
  try {
    const notification = await adminNotificationService.markAsRead(req.params.id, req.admin.id);

    if (!notification) {
      return responseHandler.notFound(res, 'Notification not found');
    }

    return responseHandler.success(
      res,
      200,
      { notification },
      'Notification marked as read'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Mark all notifications as read for an admin
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const result = await adminNotificationService.markAllAsRead(req.admin.id);

    return responseHandler.success(
      res,
      200,
      result,
      'All notifications marked as read'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Get unread notifications count for an admin
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const result = await adminNotificationService.getUnreadCount(req.admin.id);

    return responseHandler.success(
      res,
      200,
      result,
      'Unread count retrieved successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Delete a notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await adminNotificationService.deleteNotification(req.params.id, req.admin.id);

    if (!notification) {
      return responseHandler.notFound(res, 'Notification not found');
    }

    return responseHandler.success(
      res,
      200,
      { notification },
      'Notification deleted successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Delete all notifications for an admin
 * @route   DELETE /api/notifications
 * @access  Private
 */
exports.deleteAllNotifications = async (req, res) => {
  try {
    const result = await adminNotificationService.deleteAllNotifications(req.admin.id);

    return responseHandler.success(
      res,
      200,
      result,
      'All notifications deleted successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Send notification to all admins
 * @route   POST /api/notifications/all-admins
 * @access  Private/Admin
 */
exports.sendToAllAdmins = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return responseHandler.badRequest(res, 'Validation error', errors.array());
    }

    const notificationData = {
      title: req.body.title,
      message: req.body.message,
      type: req.body.type || 'info',
      priority: req.body.priority || 'medium',
      icon: req.body.icon || 'bell',
      link: req.body.link,
      relatedResource: req.body.relatedResource,
      metadata: req.body.metadata,
      expiresAt: req.body.expiresAt
    };

    const result = await adminNotificationService.sendToAllAdmins(notificationData);

    return responseHandler.success(
      res,
      200,
      result,
      'Notification sent to all admins successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Send notification to admins by role
 * @route   POST /api/notifications/role/:role
 * @access  Private/Admin
 */
exports.sendToAdminsByRole = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return responseHandler.badRequest(res, 'Validation error', errors.array());
    }

    const notificationData = {
      title: req.body.title,
      message: req.body.message,
      type: req.body.type || 'info',
      priority: req.body.priority || 'medium',
      icon: req.body.icon || 'bell',
      link: req.body.link,
      relatedResource: req.body.relatedResource,
      metadata: req.body.metadata,
      expiresAt: req.body.expiresAt
    };

    const result = await adminNotificationService.sendToAdminsByRole(notificationData, req.params.role);

    return responseHandler.success(
      res,
      200,
      result,
      `Notification sent to admins with role ${req.params.role} successfully`
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Create system alert notification
 * @route   POST /api/notifications/system-alert
 * @access  Private/Admin
 */
exports.createSystemAlert = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return responseHandler.badRequest(res, 'Validation error', errors.array());
    }

    const { message, priority, details } = req.body;

    const result = await adminNotificationService.createSystemAlert(
      message,
      priority || 'high',
      details || {}
    );

    return responseHandler.success(
      res,
      200,
      result,
      'System alert created successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Delete expired notifications
 * @route   DELETE /api/notifications/expired
 * @access  Private/Admin
 */
exports.deleteExpiredNotifications = async (req, res) => {
  try {
    const deletedCount = await adminNotificationService.deleteExpiredNotifications();

    return responseHandler.success(
      res,
      200,
      { deletedCount },
      `Deleted ${deletedCount} expired notifications`
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};