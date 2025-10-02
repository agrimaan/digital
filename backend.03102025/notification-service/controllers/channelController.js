const NotificationChannel = require('../models/NotificationChannel');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');
const pushNotificationService = require('../services/pushNotificationService');
const webhookService = require('../services/webhookService');
const { handleError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

/**
 * Controller for notification channel operations
 */
class ChannelController {
  /**
   * Create a new notification channel
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createChannel(req, res) {
    try {
      const channelData = req.body;
      
      // Validate required fields
      if (!channelData.name || !channelData.displayName || !channelData.type) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: name, displayName, and type are required'
        });
      }
      
      // Check if channel with same name already exists
      const existingChannel = await NotificationChannel.findOne({ name: channelData.name });
      
      if (existingChannel) {
        return res.status(409).json({
          success: false,
          message: `Channel with name '${channelData.name}' already exists`
        });
      }
      
      // Create and save new channel
      const channel = new NotificationChannel(channelData);
      await channel.save();
      
      logger.info(`Created notification channel: ${channel._id} with name: ${channelData.name}`);
      
      res.status(201).json({
        success: true,
        data: channel
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * Get channel by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getChannelById(req, res) {
    try {
      const { id } = req.params;
      const channel = await NotificationChannel.findById(id);
      
      if (!channel) {
        return res.status(404).json({
          success: false,
          message: `Channel with ID ${id} not found`
        });
      }
      
      res.status(200).json({
        success: true,
        data: channel
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * Get channels with filters and pagination
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getChannels(req, res) {
    try {
      const filters = {
        type: req.query.type,
        status: req.query.status,
        tags: req.query.tags ? req.query.tags.split(',') : undefined
      };
      
      const query = {};
      
      // Apply filters
      if (filters.type) query.type = filters.type;
      if (filters.status) query.status = filters.status;
      if (filters.tags && filters.tags.length > 0) query.tags = { $in: filters.tags };
      
      // Set up pagination
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      
      // Set up sorting
      const sort = req.query.sort ? JSON.parse(req.query.sort) : { name: 1 };
      
      // Execute query with pagination
      const channels = await NotificationChannel.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit);
      
      // Get total count for pagination
      const total = await NotificationChannel.countDocuments(query);
      
      res.status(200).json({
        success: true,
        count: channels.length,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        },
        data: channels
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * Update an existing channel
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateChannel(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Check if trying to update name to an existing name
      if (updateData.name) {
        const existingChannel = await NotificationChannel.findOne({ 
          name: updateData.name,
          _id: { $ne: id }
        });
        
        if (existingChannel) {
          return res.status(409).json({
            success: false,
            message: `Another channel with name '${updateData.name}' already exists`
          });
        }
      }
      
      const channel = await NotificationChannel.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
      
      if (!channel) {
        return res.status(404).json({
          success: false,
          message: `Channel with ID ${id} not found`
        });
      }
      
      logger.info(`Updated channel: ${id}`);
      
      res.status(200).json({
        success: true,
        data: channel
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * Delete a channel
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteChannel(req, res) {
    try {
      const { id } = req.params;
      const result = await NotificationChannel.findByIdAndDelete(id);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          message: `Channel with ID ${id} not found`
        });
      }
      
      logger.info(`Deleted channel: ${id}`);
      
      res.status(200).json({
        success: true,
        message: 'Channel deleted successfully'
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * Test a channel configuration
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async testChannel(req, res) {
    try {
      const { id } = req.params;
      const channel = await NotificationChannel.findById(id);
      
      if (!channel) {
        return res.status(404).json({
          success: false,
          message: `Channel with ID ${id} not found`
        });
      }
      
      // Test the channel based on its type
      let testResult;
      
      switch (channel.type) {
        case 'email':
          // Initialize email service with this channel
          await emailService.initializeChannel(channel);
          testResult = { success: true, message: 'Email channel initialized successfully' };
          break;
          
        case 'sms':
          // Initialize SMS service with this channel
          await smsService.initializeChannel(channel);
          testResult = { success: true, message: 'SMS channel initialized successfully' };
          break;
          
        case 'push':
          // Initialize push notification service with this channel
          await pushNotificationService.initializeChannel(channel);
          testResult = { success: true, message: 'Push notification channel initialized successfully' };
          break;
          
        case 'webhook':
          // Initialize webhook service with this channel
          await webhookService.initializeChannel(channel);
          testResult = { success: true, message: 'Webhook channel initialized successfully' };
          break;
          
        default:
          testResult = { success: false, message: `Unsupported channel type: ${channel.type}` };
      }
      
      // Update channel status based on test result
      if (testResult.success) {
        channel.status = 'active';
        channel.errorMessage = null;
      } else {
        channel.status = 'error';
        channel.errorMessage = testResult.message;
      }
      
      channel.lastTested = new Date();
      await channel.save();
      
      res.status(200).json({
        success: testResult.success,
        message: testResult.message,
        data: channel
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * Set a channel as default for its type
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async setAsDefault(req, res) {
    try {
      const { id } = req.params;
      const channel = await NotificationChannel.findById(id);
      
      if (!channel) {
        return res.status(404).json({
          success: false,
          message: `Channel with ID ${id} not found`
        });
      }
      
      // Remove default tag from all channels of the same type
      await NotificationChannel.updateMany(
        { type: channel.type, tags: 'default' },
        { $pull: { tags: 'default' } }
      );
      
      // Add default tag to this channel
      if (!channel.tags.includes('default')) {
        channel.tags.push('default');
        await channel.save();
      }
      
      logger.info(`Set channel ${id} as default for type ${channel.type}`);
      
      res.status(200).json({
        success: true,
        message: `Channel set as default for type ${channel.type}`,
        data: channel
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * Get channel delivery statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getChannelStats(req, res) {
    try {
      const { id } = req.params;
      const channel = await NotificationChannel.findById(id);
      
      if (!channel) {
        return res.status(404).json({
          success: false,
          message: `Channel with ID ${id} not found`
        });
      }
      
      // Return channel delivery stats
      res.status(200).json({
        success: true,
        data: {
          sent: channel.deliveryStats.sent,
          delivered: channel.deliveryStats.delivered,
          failed: channel.deliveryStats.failed,
          lastSentAt: channel.deliveryStats.lastSentAt,
          successRate: channel.deliveryStats.sent > 0 
            ? (channel.deliveryStats.delivered / channel.deliveryStats.sent * 100).toFixed(2) + '%'
            : '0%'
        }
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * Get channels by type
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getChannelsByType(req, res) {
    try {
      const { type } = req.params;
      
      // Validate channel type
      const validTypes = ['email', 'sms', 'push', 'webhook', 'in-app', 'custom'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: `Invalid channel type: ${type}`
        });
      }
      
      const channels = await NotificationChannel.find({ 
        type,
        status: req.query.activeOnly === 'true' ? 'active' : { $in: ['active', 'testing', 'inactive', 'error'] }
      }).sort({ name: 1 });
      
      res.status(200).json({
        success: true,
        count: channels.length,
        data: channels
      });
    } catch (error) {
      handleError(res, error);
    }
  }
}

module.exports = new ChannelController();