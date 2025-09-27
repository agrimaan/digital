const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateJWT, authorizeRole } = require('../middleware/authMiddleware');

/**
 * @route POST /api/notifications
 * @desc Create and send a notification
 * @access Private
 */
router.post('/', authenticateJWT, notificationController.createAndSend);

/**
 * @route POST /api/notifications/batch
 * @desc Send a batch of notifications
 * @access Private
 */
router.post('/batch', authenticateJWT, notificationController.sendBatch);

/**
 * @route GET /api/notifications/:id
 * @desc Get notification by ID
 * @access Private
 */
router.get('/:id', authenticateJWT, notificationController.getNotificationById);

/**
 * @route GET /api/notifications/user/:userId
 * @desc Get notifications for a specific user
 * @access Private (Admin or Owner)
 */
router.get('/user/:userId', authenticateJWT, notificationController.getUserNotifications);

/**
 * @route GET /api/notifications/my
 * @desc Get notifications for the authenticated user
 * @access Private
 */
router.get('/my/notifications', authenticateJWT, notificationController.getUserNotifications);

/**
 * @route PUT /api/notifications/:id/read
 * @desc Mark a notification as read
 * @access Private
 */
router.put('/:id/read', authenticateJWT, notificationController.markAsRead);

/**
 * @route PUT /api/notifications/user/:userId/read-all
 * @desc Mark all notifications as read for a specific user
 * @access Private (Admin or Owner)
 */
router.put('/user/:userId/read-all', authenticateJWT, notificationController.markAllAsRead);

/**
 * @route PUT /api/notifications/my/read-all
 * @desc Mark all notifications as read for the authenticated user
 * @access Private
 */
router.put('/my/read-all', authenticateJWT, notificationController.markAllAsRead);

/**
 * @route GET /api/notifications/user/:userId/unread-count
 * @desc Count unread notifications for a specific user
 * @access Private (Admin or Owner)
 */
router.get('/user/:userId/unread-count', authenticateJWT, notificationController.countUnread);

/**
 * @route GET /api/notifications/my/unread-count
 * @desc Count unread notifications for the authenticated user
 * @access Private
 */
router.get('/my/unread-count', authenticateJWT, notificationController.countUnread);

/**
 * @route PUT /api/notifications/:id/archive
 * @desc Archive a notification
 * @access Private
 */
router.put('/:id/archive', authenticateJWT, notificationController.archiveNotification);

/**
 * @route DELETE /api/notifications/:id
 * @desc Delete a notification
 * @access Private
 */
router.delete('/:id', authenticateJWT, notificationController.deleteNotification);

/**
 * @route POST /api/notifications/process-scheduled
 * @desc Process scheduled notifications
 * @access Private (Admin only)
 */
router.post('/process-scheduled', authenticateJWT, authorizeRole('admin'), notificationController.processScheduledNotifications);

/**
 * @route POST /api/notifications/process-expired
 * @desc Process expired notifications
 * @access Private (Admin only)
 */
router.post('/process-expired', authenticateJWT, authorizeRole('admin'), notificationController.processExpiredNotifications);

module.exports = router;