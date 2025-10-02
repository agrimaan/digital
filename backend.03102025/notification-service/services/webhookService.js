const NotificationChannel = require('../models/NotificationChannel');
const axios = require('axios');
const crypto = require('crypto');
const { createError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

/**
 * Service for handling webhook notifications
 */
class WebhookService {
  constructor() {
    this.channels = new Map();
    this.defaultChannel = null;
  }

  /**
   * Initialize webhook service with channels
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Load all active webhook channels
      const channels = await NotificationChannel.findActiveByType('webhook');
      
      if (channels.length === 0) {
        logger.warn('No active webhook channels found');
        return;
      }
      
      // Initialize each channel
      for (const channel of channels) {
        await this.initializeChannel(channel);
      }
      
      // Set default channel
      const defaultChannel = await NotificationChannel.findDefaultByType('webhook');
      if (defaultChannel) {
        this.defaultChannel = defaultChannel.name;
        logger.info(`Default webhook channel set to: ${this.defaultChannel}`);
      } else if (channels.length > 0) {
        this.defaultChannel = channels[0].name;
        logger.info(`No default webhook channel found, using: ${this.defaultChannel}`);
      }
    } catch (error) {
      logger.error(`Error initializing webhook service: ${error.message}`);
      throw error;
    }
  }

  /**
   * Initialize a specific webhook channel
   * @param {Object} channel - Channel configuration
   * @returns {Promise<void>}
   */
  async initializeChannel(channel) {
    try {
      const config = channel.getConfig();
      
      if (!config) {
        throw new Error(`Invalid configuration for channel: ${channel.name}`);
      }
      
      // Store channel configuration
      this.channels.set(channel.name, {
        config,
        channel
      });
      
      logger.info(`Webhook channel initialized: ${channel.name}`);
    } catch (error) {
      logger.error(`Error initializing webhook channel ${channel.name}: ${error.message}`);
      
      // Update channel status to error
      channel.status = 'error';
      channel.errorMessage = error.message;
      await channel.save();
      
      throw error;
    }
  }

  /**
   * Send a webhook notification
   * @param {Object} notification - Notification object
   * @param {Object} deliverySettings - Delivery settings from user preferences
   * @param {String} channelName - Channel name to use (optional)
   * @returns {Promise<Object>} - Send result
   */
  async sendNotification(notification, deliverySettings, channelName = null) {
    try {
      // Ensure service is initialized
      if (this.channels.size === 0) {
        await this.initialize();
      }
      
      // Get channel to use
      const channelToUse = channelName || this.defaultChannel;
      
      if (!channelToUse || !this.channels.has(channelToUse)) {
        throw createError(500, 'No webhook channel available');
      }
      
      const { config, channel } = this.channels.get(channelToUse);
      
      // Check if we have endpoints to send to
      if (!deliverySettings.endpoints || deliverySettings.endpoints.length === 0) {
        throw createError(400, 'No webhook endpoints provided');
      }
      
      // Prepare webhook payload
      const payload = this.prepareWebhookPayload(notification);
      
      // Send to each endpoint
      const results = {
        success: true,
        sent: 0,
        failed: 0,
        responses: []
      };
      
      for (const endpoint of deliverySettings.endpoints) {
        try {
          // Check if this endpoint should receive this notification
          if (endpoint.events && endpoint.events.length > 0) {
            const eventType = `${notification.category}.${notification.type}`;
            if (!endpoint.events.includes(eventType) && !endpoint.events.includes('*')) {
              logger.debug(`Skipping endpoint ${endpoint.url} for event ${eventType}`);
              continue;
            }
          }
          
          // Send webhook
          const result = await this.sendToEndpoint(endpoint, payload, config);
          
          results.sent++;
          results.responses.push({
            url: endpoint.url,
            success: true,
            statusCode: result.status,
            responseTime: result.responseTime
          });
        } catch (error) {
          results.failed++;
          results.responses.push({
            url: endpoint.url,
            success: false,
            error: error.message
          });
          
          logger.error(`Error sending webhook to ${endpoint.url}: ${error.message}`);
        }
      }
      
      // Update success flag if any failures
      if (results.failed > 0) {
        results.success = results.sent > 0;
      }
      
      // Update channel delivery stats
      await channel.updateDeliveryStats('sent');
      
      logger.info(`Webhook notification sent: ${notification._id}, sent: ${results.sent}, failed: ${results.failed}`);
      
      return results;
    } catch (error) {
      logger.error(`Error sending webhook notification: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Prepare webhook payload from notification
   * @param {Object} notification - Notification object
   * @returns {Object} - Webhook payload
   */
  prepareWebhookPayload(notification) {
    // Use webhook-specific payload if available
    const webhookData = notification.data?.webhook?.payload;
    
    if (webhookData) {
      return webhookData;
    }
    
    // Create default payload
    return {
      id: notification._id.toString(),
      type: notification.type,
      category: notification.category,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      timestamp: notification.createdAt || new Date().toISOString(),
      data: notification.data || {},
      actions: notification.actions || []
    };
  }

  /**
   * Send webhook to a specific endpoint
   * @param {Object} endpoint - Endpoint configuration
   * @param {Object} payload - Webhook payload
   * @param {Object} channelConfig - Channel configuration
   * @returns {Promise<Object>} - Send result
   */
  async sendToEndpoint(endpoint, payload, channelConfig) {
    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'Agrimaan-Notification-Service/1.0',
      'X-Agrimaan-Notification-Timestamp': new Date().toISOString()
    };
    
    // Add default headers from channel config
    if (channelConfig.defaultHeaders) {
      for (const [key, value] of channelConfig.defaultHeaders.entries()) {
        headers[key] = value;
      }
    }
    
    // Add signature if secret is provided
    if (endpoint.secret) {
      const signature = this.generateSignature(payload, endpoint.secret);
      headers['X-Agrimaan-Signature'] = signature;
    }
    
    // Add authentication if configured
    if (channelConfig.auth && channelConfig.auth.type !== 'none') {
      switch (channelConfig.auth.type) {
        case 'basic':
          headers.Authorization = `Basic ${Buffer.from(`${channelConfig.auth.username}:${channelConfig.auth.password}`).toString('base64')}`;
          break;
          
        case 'bearer':
          headers.Authorization = `Bearer ${channelConfig.auth.token}`;
          break;
      }
    }
    
    // Send request with retry logic
    const maxRetries = channelConfig.retry?.enabled ? channelConfig.retry.maxAttempts : 1;
    const initialDelay = channelConfig.retry?.initialDelay || 1000;
    const backoffFactor = channelConfig.retry?.backoffFactor || 2;
    
    let attempt = 0;
    let lastError;
    
    while (attempt < maxRetries) {
      try {
        const startTime = Date.now();
        
        const response = await axios({
          method: 'POST',
          url: endpoint.url,
          headers,
          data: payload,
          timeout: 10000 // 10 seconds timeout
        });
        
        const responseTime = Date.now() - startTime;
        
        return {
          status: response.status,
          data: response.data,
          responseTime
        };
      } catch (error) {
        lastError = error;
        
        // Check if we should retry
        const isRetryable = this.isRetryableError(error);
        if (!isRetryable || attempt >= maxRetries - 1) {
          break;
        }
        
        // Calculate delay for exponential backoff
        const delay = initialDelay * Math.pow(backoffFactor, attempt);
        
        logger.debug(`Retrying webhook to ${endpoint.url} after ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        
        attempt++;
      }
    }
    
    // If we get here, all attempts failed
    throw new Error(`Failed to send webhook after ${maxRetries} attempts: ${lastError.message}`);
  }

  /**
   * Generate signature for webhook payload
   * @param {Object} payload - Webhook payload
   * @param {String} secret - Endpoint secret
   * @returns {String} - HMAC signature
   */
  generateSignature(payload, secret) {
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto.createHmac('sha256', secret).update(payloadString).digest('hex');
  }

  /**
   * Check if an error is retryable
   * @param {Error} error - Axios error
   * @returns {Boolean} - Whether the error is retryable
   */
  isRetryableError(error) {
    // Network errors are retryable
    if (!error.response) {
      return true;
    }
    
    // 5xx errors are retryable
    if (error.response.status >= 500) {
      return true;
    }
    
    // 429 Too Many Requests is retryable
    if (error.response.status === 429) {
      return true;
    }
    
    // Other errors are not retryable
    return false;
  }

  /**
   * Register a new webhook endpoint
   * @param {String} userId - User ID
   * @param {Object} endpointData - Endpoint data
   * @returns {Promise<Object>} - Registration result
   */
  async registerEndpoint(userId, endpointData) {
    try {
      // Implementation would depend on how endpoints are stored
      // This is a placeholder for the actual implementation
      
      logger.info(`Webhook endpoint registered for user ${userId}: ${endpointData.url}`);
      
      return {
        success: true,
        userId,
        endpointId: `ep-${Date.now()}`
      };
    } catch (error) {
      logger.error(`Error registering webhook endpoint: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Unregister a webhook endpoint
   * @param {String} userId - User ID
   * @param {String} endpointId - Endpoint ID
   * @returns {Promise<Object>} - Unregistration result
   */
  async unregisterEndpoint(userId, endpointId) {
    try {
      // Implementation would depend on how endpoints are stored
      // This is a placeholder for the actual implementation
      
      logger.info(`Webhook endpoint unregistered for user ${userId}: ${endpointId}`);
      
      return {
        success: true,
        userId
      };
    } catch (error) {
      logger.error(`Error unregistering webhook endpoint: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new WebhookService();