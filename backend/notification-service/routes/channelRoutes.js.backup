const express = require('express');
const router = express.Router();
const channelController = require('../controllers/channelController');
const { authenticateJWT, authorizeRole } = require('../middleware/authMiddleware');

/**
 * @route POST /api/channels
 * @desc Create a new notification channel
 * @access Private (Admin only)
 */
router.post('/', authenticateJWT, authorizeRole('admin'), channelController.createChannel);

/**
 * @route GET /api/channels/:id
 * @desc Get channel by ID
 * @access Private (Admin only)
 */
router.get('/:id', authenticateJWT, authorizeRole('admin'), channelController.getChannelById);

/**
 * @route GET /api/channels
 * @desc Get channels with filters and pagination
 * @access Private (Admin only)
 */
router.get('/', authenticateJWT, authorizeRole('admin'), channelController.getChannels);

/**
 * @route PUT /api/channels/:id
 * @desc Update an existing channel
 * @access Private (Admin only)
 */
router.put('/:id', authenticateJWT, authorizeRole('admin'), channelController.updateChannel);

/**
 * @route DELETE /api/channels/:id
 * @desc Delete a channel
 * @access Private (Admin only)
 */
router.delete('/:id', authenticateJWT, authorizeRole('admin'), channelController.deleteChannel);

/**
 * @route POST /api/channels/:id/test
 * @desc Test a channel configuration
 * @access Private (Admin only)
 */
router.post('/:id/test', authenticateJWT, authorizeRole('admin'), channelController.testChannel);

/**
 * @route PUT /api/channels/:id/default
 * @desc Set a channel as default for its type
 * @access Private (Admin only)
 */
router.put('/:id/default', authenticateJWT, authorizeRole('admin'), channelController.setAsDefault);

/**
 * @route GET /api/channels/:id/stats
 * @desc Get channel delivery statistics
 * @access Private (Admin only)
 */
router.get('/:id/stats', authenticateJWT, authorizeRole('admin'), channelController.getChannelStats);

/**
 * @route GET /api/channels/type/:type
 * @desc Get channels by type
 * @access Private (Admin only)
 */
router.get('/type/:type', authenticateJWT, authorizeRole('admin'), channelController.getChannelsByType);

module.exports = router;