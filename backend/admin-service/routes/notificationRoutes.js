const express = require('express');
const { check } = require('express-validator');
const notificationController = require('../controllers/notificationController');
const { protect, authorize, logAction } = require('@agrimaan/shared').middleware;

const router = express.Router();

// Protect all routes
router.use(protect);

// Get unread notifications count for an admin
router.get('/unread-count', notificationController.getUnreadCount);

// Mark all notifications as read for an admin
router.put('/read-all', notificationController.markAllAsRead);

// Delete all notifications for an admin
router.delete('/', notificationController.deleteAllNotifications);

// Get notifications for an admin
router.get('/', notificationController.getNotificationsForAdmin);

// Get a notification by ID
router.get('/:id', notificationController.getNotificationById);

// Mark a notification as read
router.put('/:id/read', notificationController.markAsRead);

// Delete a notification
router.delete('/:id', notificationController.deleteNotification);

// Admin/SuperAdmin only routes
router.use(authorize('admin', 'super-admin'));

// Create a new notification
router.post(
  '/',
  [
    check('title', 'Title is required').not().isEmpty(),
    check('message', 'Message is required').not().isEmpty(),
    check('recipientId', 'Recipient ID is required').not().isEmpty()
  ],
  logAction('create', 'notification'),
  notificationController.createNotification
);

// Send notification to all admins
router.post(
  '/all-admins',
  [
    check('title', 'Title is required').not().isEmpty(),
    check('message', 'Message is required').not().isEmpty()
  ],
  logAction('create', 'notification'),
  notificationController.sendToAllAdmins
);

// Send notification to admins by role
router.post(
  '/role/:role',
  [
    check('title', 'Title is required').not().isEmpty(),
    check('message', 'Message is required').not().isEmpty()
  ],
  logAction('create', 'notification'),
  notificationController.sendToAdminsByRole
);

// Create system alert notification
router.post(
  '/system-alert',
  [
    check('message', 'Message is required').not().isEmpty()
  ],
  logAction('create', 'notification'),
  notificationController.createSystemAlert
);

// Delete expired notifications
router.delete('/expired', authorize('super-admin'), notificationController.deleteExpiredNotifications);

module.exports = router;