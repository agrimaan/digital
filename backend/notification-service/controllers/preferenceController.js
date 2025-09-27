const NotificationPreference = require('../models/NotificationPreference');
const { handleError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

/**
 * Controller for notification preference operations
 */
class PreferenceController {
  /**
   * Get user notification preferences
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUserPreferences(req, res) {
    try {
      const userId = req.params.userId || req.user.id;
      
      // Check if the requesting user has permission to access these preferences
      if (req.params.userId && req.params.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access these preferences'
        });
      }
      
      const preferences = await NotificationPreference.getOrCreate(userId);
      
      res.status(200).json({
        success: true,
        data: preferences
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * Update user notification preferences
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateUserPreferences(req, res) {
    try {
      const userId = req.params.userId || req.user.id;
      const updateData = req.body;
      
      // Check if the requesting user has permission to update these preferences
      if (req.params.userId && req.params.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update these preferences'
        });
      }
      
      // Get current preferences
      let preferences = await NotificationPreference.findOne({ userId });
      
      // Create if not exists
      if (!preferences) {
        preferences = new NotificationPreference({ userId });
      }
      
      // Update global settings
      if (updateData.global) {
        if (updateData.global.enabled !== undefined) {
          preferences.global.enabled = updateData.global.enabled;
        }
        
        if (updateData.global.quietHours) {
          if (updateData.global.quietHours.enabled !== undefined) {
            preferences.global.quietHours.enabled = updateData.global.quietHours.enabled;
          }
          
          if (updateData.global.quietHours.start) {
            preferences.global.quietHours.start = updateData.global.quietHours.start;
          }
          
          if (updateData.global.quietHours.end) {
            preferences.global.quietHours.end = updateData.global.quietHours.end;
          }
          
          if (updateData.global.quietHours.timezone) {
            preferences.global.quietHours.timezone = updateData.global.quietHours.timezone;
          }
        }
      }
      
      // Update channel settings
      if (updateData.channels) {
        // Update in-app settings
        if (updateData.channels.inApp) {
          if (updateData.channels.inApp.enabled !== undefined) {
            preferences.channels.inApp.enabled = updateData.channels.inApp.enabled;
          }
          
          if (updateData.channels.inApp.showBadge !== undefined) {
            preferences.channels.inApp.showBadge = updateData.channels.inApp.showBadge;
          }
          
          if (updateData.channels.inApp.showPreview !== undefined) {
            preferences.channels.inApp.showPreview = updateData.channels.inApp.showPreview;
          }
        }
        
        // Update email settings
        if (updateData.channels.email) {
          if (updateData.channels.email.enabled !== undefined) {
            preferences.channels.email.enabled = updateData.channels.email.enabled;
          }
          
          if (updateData.channels.email.address) {
            preferences.channels.email.address = updateData.channels.email.address;
          }
          
          if (updateData.channels.email.frequency) {
            preferences.channels.email.frequency = updateData.channels.email.frequency;
          }
          
          if (updateData.channels.email.digestTime) {
            preferences.channels.email.digestTime = updateData.channels.email.digestTime;
          }
          
          if (updateData.channels.email.weeklyDay !== undefined) {
            preferences.channels.email.weeklyDay = updateData.channels.email.weeklyDay;
          }
        }
        
        // Update SMS settings
        if (updateData.channels.sms) {
          if (updateData.channels.sms.enabled !== undefined) {
            preferences.channels.sms.enabled = updateData.channels.sms.enabled;
          }
          
          if (updateData.channels.sms.phoneNumber) {
            preferences.channels.sms.phoneNumber = updateData.channels.sms.phoneNumber;
          }
        }
        
        // Update push settings
        if (updateData.channels.push) {
          if (updateData.channels.push.enabled !== undefined) {
            preferences.channels.push.enabled = updateData.channels.push.enabled;
          }
        }
        
        // Update webhook settings
        if (updateData.channels.webhook) {
          if (updateData.channels.webhook.enabled !== undefined) {
            preferences.channels.webhook.enabled = updateData.channels.webhook.enabled;
          }
        }
      }
      
      // Update category preferences
      if (updateData.categories) {
        // Process each category update
        for (const categoryUpdate of updateData.categories) {
          if (!categoryUpdate.name) continue;
          
          // Find existing category or create new one
          let category = preferences.categories.find(c => c.name === categoryUpdate.name);
          
          if (!category) {
            category = {
              name: categoryUpdate.name,
              enabled: true,
              channelOverrides: {},
              priorityOverrides: {}
            };
            preferences.categories.push(category);
          }
          
          // Update category settings
          if (categoryUpdate.enabled !== undefined) {
            category.enabled = categoryUpdate.enabled;
          }
          
          // Update channel overrides
          if (categoryUpdate.channelOverrides) {
            category.channelOverrides = {
              ...category.channelOverrides,
              ...categoryUpdate.channelOverrides
            };
          }
          
          // Update priority overrides
          if (categoryUpdate.priorityOverrides) {
            category.priorityOverrides = {
              ...category.priorityOverrides,
              ...categoryUpdate.priorityOverrides
            };
          }
        }
      }
      
      // Update type preferences
      if (updateData.types) {
        // Process each type update
        for (const typeUpdate of updateData.types) {
          if (!typeUpdate.name) continue;
          
          // Find existing type or create new one
          let type = preferences.types.find(t => t.name === typeUpdate.name);
          
          if (!type) {
            type = {
              name: typeUpdate.name,
              enabled: true,
              channelOverrides: {}
            };
            preferences.types.push(type);
          }
          
          // Update type settings
          if (typeUpdate.enabled !== undefined) {
            type.enabled = typeUpdate.enabled;
          }
          
          // Update channel overrides
          if (typeUpdate.channelOverrides) {
            type.channelOverrides = {
              ...type.channelOverrides,
              ...typeUpdate.channelOverrides
            };
          }
        }
      }
      
      // Update template preferences
      if (updateData.templates) {
        // Process each template update
        for (const templateUpdate of updateData.templates) {
          if (!templateUpdate.name) continue;
          
          // Find existing template or create new one
          let template = preferences.templates.find(t => t.name === templateUpdate.name);
          
          if (!template) {
            template = {
              name: templateUpdate.name,
              enabled: true,
              channelOverrides: {}
            };
            preferences.templates.push(template);
          }
          
          // Update template settings
          if (templateUpdate.enabled !== undefined) {
            template.enabled = templateUpdate.enabled;
          }
          
          // Update channel overrides
          if (templateUpdate.channelOverrides) {
            template.channelOverrides = {
              ...template.channelOverrides,
              ...templateUpdate.channelOverrides
            };
          }
        }
      }
      
      // Save updated preferences
      await preferences.save();
      
      res.status(200).json({
        success: true,
        data: preferences
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * Add push token to user preferences
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async addPushToken(req, res) {
    try {
      const userId = req.params.userId || req.user.id;
      const { token, platform, device } = req.body;
      
      // Check if the requesting user has permission to update these preferences
      if (req.params.userId && req.params.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update these preferences'
        });
      }
      
      // Validate required fields
      if (!token || !platform) {
        return res.status(400).json({
          success: false,
          message: 'Token and platform are required'
        });
      }
      
      // Get user preferences
      const preferences = await NotificationPreference.getOrCreate(userId);
      
      // Add push token
      await preferences.addPushToken(token, platform, device);
      
      res.status(200).json({
        success: true,
        message: 'Push token added successfully'
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * Remove push token from user preferences
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async removePushToken(req, res) {
    try {
      const userId = req.params.userId || req.user.id;
      const { token } = req.body;
      
      // Check if the requesting user has permission to update these preferences
      if (req.params.userId && req.params.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update these preferences'
        });
      }
      
      // Validate required fields
      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token is required'
        });
      }
      
      // Get user preferences
      const preferences = await NotificationPreference.getOrCreate(userId);
      
      // Remove push token
      await preferences.removePushToken(token);
      
      res.status(200).json({
        success: true,
        message: 'Push token removed successfully'
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * Add webhook endpoint to user preferences
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async addWebhookEndpoint(req, res) {
    try {
      const userId = req.params.userId || req.user.id;
      const { url, secret, description, events } = req.body;
      
      // Check if the requesting user has permission to update these preferences
      if (req.params.userId && req.params.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update these preferences'
        });
      }
      
      // Validate required fields
      if (!url) {
        return res.status(400).json({
          success: false,
          message: 'URL is required'
        });
      }
      
      // Get user preferences
      const preferences = await NotificationPreference.getOrCreate(userId);
      
      // Enable webhook channel if not already enabled
      preferences.channels.webhook.enabled = true;
      
      // Add webhook endpoint
      preferences.channels.webhook.endpoints.push({
        url,
        secret,
        description,
        events: events || [],
        active: true
      });
      
      await preferences.save();
      
      res.status(200).json({
        success: true,
        message: 'Webhook endpoint added successfully'
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * Remove webhook endpoint from user preferences
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async removeWebhookEndpoint(req, res) {
    try {
      const userId = req.params.userId || req.user.id;
      const { url } = req.body;
      
      // Check if the requesting user has permission to update these preferences
      if (req.params.userId && req.params.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update these preferences'
        });
      }
      
      // Validate required fields
      if (!url) {
        return res.status(400).json({
          success: false,
          message: 'URL is required'
        });
      }
      
      // Get user preferences
      const preferences = await NotificationPreference.getOrCreate(userId);
      
      // Remove webhook endpoint
      preferences.channels.webhook.endpoints = preferences.channels.webhook.endpoints.filter(
        endpoint => endpoint.url !== url
      );
      
      await preferences.save();
      
      res.status(200).json({
        success: true,
        message: 'Webhook endpoint removed successfully'
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * Check if a notification would be delivered based on user preferences
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async checkDelivery(req, res) {
    try {
      const userId = req.params.userId || req.user.id;
      const { category, type, channel, priority, template } = req.body;
      
      // Check if the requesting user has permission to access these preferences
      if (req.params.userId && req.params.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access these preferences'
        });
      }
      
      // Validate required fields
      if (!category || !type || !channel) {
        return res.status(400).json({
          success: false,
          message: 'Category, type, and channel are required'
        });
      }
      
      // Get user preferences
      const preferences = await NotificationPreference.getOrCreate(userId);
      
      // Check if notification would be delivered
      const wouldDeliver = preferences.isEnabled(
        category,
        type,
        channel,
        priority || 'normal',
        template
      );
      
      res.status(200).json({
        success: true,
        wouldDeliver
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * Reset user notification preferences to defaults
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async resetPreferences(req, res) {
    try {
      const userId = req.params.userId || req.user.id;
      
      // Check if the requesting user has permission to update these preferences
      if (req.params.userId && req.params.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update these preferences'
        });
      }
      
      // Delete existing preferences
      await NotificationPreference.deleteOne({ userId });
      
      // Create new preferences with defaults
      const preferences = await NotificationPreference.getOrCreate(userId);
      
      res.status(200).json({
        success: true,
        message: 'Preferences reset to defaults',
        data: preferences
      });
    } catch (error) {
      handleError(res, error);
    }
  }
}

module.exports = new PreferenceController();