const express = require('express');
const router = express.Router();
const preferenceController = require('../controllers/preferenceController');
const { authenticateJWT, authorizeRole } = require('../middleware/authMiddleware');

/**
 * @route GET /api/preferences/user/:userId
 * @desc Get user notification preferences
 * @access Private (Admin or Owner)
 */
router.get('/user/:userId', authenticateJWT, preferenceController.getUserPreferences);

/**
 * @route GET /api/preferences/my
 * @desc Get notification preferences for the authenticated user
 * @access Private
 */
router.get('/my', authenticateJWT, preferenceController.getUserPreferences);

/**
 * @route PUT /api/preferences/user/:userId
 * @desc Update user notification preferences
 * @access Private (Admin or Owner)
 */
router.put('/user/:userId', authenticateJWT, preferenceController.updateUserPreferences);

/**
 * @route PUT /api/preferences/my
 * @desc Update notification preferences for the authenticated user
 * @access Private
 */
router.put('/my', authenticateJWT, preferenceController.updateUserPreferences);

/**
 * @route POST /api/preferences/user/:userId/push-token
 * @desc Add push token to user preferences
 * @access Private (Admin or Owner)
 */
router.post('/user/:userId/push-token', authenticateJWT, preferenceController.addPushToken);

/**
 * @route POST /api/preferences/my/push-token
 * @desc Add push token to authenticated user's preferences
 * @access Private
 */
router.post('/my/push-token', authenticateJWT, preferenceController.addPushToken);

/**
 * @route DELETE /api/preferences/user/:userId/push-token
 * @desc Remove push token from user preferences
 * @access Private (Admin or Owner)
 */
router.delete('/user/:userId/push-token', authenticateJWT, preferenceController.removePushToken);

/**
 * @route DELETE /api/preferences/my/push-token
 * @desc Remove push token from authenticated user's preferences
 * @access Private
 */
router.delete('/my/push-token', authenticateJWT, preferenceController.removePushToken);

/**
 * @route POST /api/preferences/user/:userId/webhook-endpoint
 * @desc Add webhook endpoint to user preferences
 * @access Private (Admin or Owner)
 */
router.post('/user/:userId/webhook-endpoint', authenticateJWT, preferenceController.addWebhookEndpoint);

/**
 * @route POST /api/preferences/my/webhook-endpoint
 * @desc Add webhook endpoint to authenticated user's preferences
 * @access Private
 */
router.post('/my/webhook-endpoint', authenticateJWT, preferenceController.addWebhookEndpoint);

/**
 * @route DELETE /api/preferences/user/:userId/webhook-endpoint
 * @desc Remove webhook endpoint from user preferences
 * @access Private (Admin or Owner)
 */
router.delete('/user/:userId/webhook-endpoint', authenticateJWT, preferenceController.removeWebhookEndpoint);

/**
 * @route DELETE /api/preferences/my/webhook-endpoint
 * @desc Remove webhook endpoint from authenticated user's preferences
 * @access Private
 */
router.delete('/my/webhook-endpoint', authenticateJWT, preferenceController.removeWebhookEndpoint);

/**
 * @route POST /api/preferences/user/:userId/check-delivery
 * @desc Check if a notification would be delivered based on user preferences
 * @access Private (Admin or Owner)
 */
router.post('/user/:userId/check-delivery', authenticateJWT, preferenceController.checkDelivery);

/**
 * @route POST /api/preferences/my/check-delivery
 * @desc Check if a notification would be delivered based on authenticated user's preferences
 * @access Private
 */
router.post('/my/check-delivery', authenticateJWT, preferenceController.checkDelivery);

/**
 * @route POST /api/preferences/user/:userId/reset
 * @desc Reset user notification preferences to defaults
 * @access Private (Admin or Owner)
 */
router.post('/user/:userId/reset', authenticateJWT, preferenceController.resetPreferences);

/**
 * @route POST /api/preferences/my/reset
 * @desc Reset authenticated user's notification preferences to defaults
 * @access Private
 */
router.post('/my/reset', authenticateJWT, preferenceController.resetPreferences);

module.exports = router;