const NotificationChannel = require('../models/NotificationChannel');
const { createError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

// Push notification service providers
const providers = {
  fcm: require('firebase-admin'),
  webPush: require('web-push')
};

/**
 * Service for handling push notifications
 */
class PushNotificationService {
  constructor() {
    this.clients = new Map();
    this.defaultChannel = null;
    this.fcmInitialized = false;
  }

  /**
   * Initialize push notification service with channels
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Load all active push notification channels
      const channels = await NotificationChannel.findActiveByType('push');
      
      if (channels.length === 0) {
        logger.warn('No active push notification channels found');
        return;
      }
      
      // Initialize each channel
      for (const channel of channels) {
        await this.initializeChannel(channel);
      }
      
      // Set default channel
      const defaultChannel = await NotificationChannel.findDefaultByType('push');
      if (defaultChannel) {
        this.defaultChannel = defaultChannel.name;
        logger.info(`Default push notification channel set to: ${this.defaultChannel}`);
      } else if (channels.length > 0) {
        this.defaultChannel = channels[0].name;
        logger.info(`No default push notification channel found, using: ${this.defaultChannel}`);
      }
    } catch (error) {
      logger.error(`Error initializing push notification service: ${error.message}`);
      throw error;
    }
  }

  /**
   * Initialize a specific push notification channel
   * @param {Object} channel - Channel configuration
   * @returns {Promise<void>}
   */
  async initializeChannel(channel) {
    try {
      const config = channel.getConfig();
      
      if (!config) {
        throw new Error(`Invalid configuration for channel: ${channel.name}`);
      }
      
      let client;
      
      switch (config.provider) {
        case 'fcm':
          client = await this.initializeFcm(config.fcm);
          break;
          
        case 'apns':
          // APNS requires a different approach, typically handled by FCM or a specialized library
          throw new Error('Direct APNS integration not supported, use FCM instead');
          
        case 'web-push':
          client = this.initializeWebPush(config.webPush);
          break;
          
        default:
          throw new Error(`Unsupported push notification provider: ${config.provider}`);
      }
      
      // Store client
      this.clients.set(channel.name, {
        client,
        config,
        provider: config.provider,
        channel
      });
      
      logger.info(`Push notification channel initialized: ${channel.name} (${config.provider})`);
    } catch (error) {
      logger.error(`Error initializing push notification channel ${channel.name}: ${error.message}`);
      
      // Update channel status to error
      channel.status = 'error';
      channel.errorMessage = error.message;
      await channel.save();
      
      throw error;
    }
  }

  /**
   * Initialize Firebase Cloud Messaging
   * @param {Object} config - FCM configuration
   * @returns {Promise<Object>} - FCM client
   */
  async initializeFcm(config) {
    // Check if FCM is already initialized
    if (this.fcmInitialized) {
      return providers.fcm;
    }
    
    // Parse service account JSON if it's a string
    let serviceAccount;
    try {
      serviceAccount = typeof config.serviceAccountJson === 'string'
        ? JSON.parse(config.serviceAccountJson)
        : config.serviceAccountJson;
    } catch (error) {
      throw new Error(`Invalid FCM service account JSON: ${error.message}`);
    }
    
    // Initialize Firebase Admin SDK
    providers.fcm.initializeApp({
      credential: providers.fcm.credential.cert(serviceAccount),
      databaseURL: config.databaseUrl
    });
    
    this.fcmInitialized = true;
    return providers.fcm;
  }

  /**
   * Initialize Web Push
   * @param {Object} config - Web Push configuration
   * @returns {Object} - Web Push client
   */
  initializeWebPush(config) {
    providers.webPush.setVapidDetails(
      config.subject,
      config.vapidPublicKey,
      config.vapidPrivateKey
    );
    
    return providers.webPush;
  }

  /**
   * Send a push notification
   * @param {Object} notification - Notification object
   * @param {Object} deliverySettings - Delivery settings from user preferences
   * @param {String} channelName - Channel name to use (optional)
   * @returns {Promise<Object>} - Send result
   */
  async sendNotification(notification, deliverySettings, channelName = null) {
    try {
      // Ensure service is initialized
      if (this.clients.size === 0) {
        await this.initialize();
      }
      
      // Get channel to use
      const channelToUse = channelName || this.defaultChannel;
      
      if (!channelToUse || !this.clients.has(channelToUse)) {
        throw createError(500, 'No push notification channel available');
      }
      
      const { client, provider, channel } = this.clients.get(channelToUse);
      
      // Check if we have tokens to send to
      if (!deliverySettings.tokens || deliverySettings.tokens.length === 0) {
        throw createError(400, 'No push tokens provided for recipient');
      }
      
      // Prepare push notification content
      const pushContent = this.preparePushContent(notification);
      
      // Group tokens by platform
      const tokensByPlatform = this.groupTokensByPlatform(deliverySettings.tokens);
      
      // Send push notifications based on provider
      const results = {
        success: true,
        sent: 0,
        failed: 0,
        messageIds: [],
        errors: []
      };
      
      switch (provider) {
        case 'fcm':
          // Send to Android and iOS devices
          if (tokensByPlatform.android.length > 0 || tokensByPlatform.ios.length > 0) {
            const fcmResult = await this.sendWithFcm(
              client,
              pushContent,
              [...tokensByPlatform.android, ...tokensByPlatform.ios]
            );
            
            results.sent += fcmResult.sent;
            results.failed += fcmResult.failed;
            results.messageIds = results.messageIds.concat(fcmResult.messageIds);
            results.errors = results.errors.concat(fcmResult.errors);
          }
          
          // Send to web devices
          if (tokensByPlatform.web.length > 0) {
            const webResult = await this.sendWithFcmWeb(
              client,
              pushContent,
              tokensByPlatform.web
            );
            
            results.sent += webResult.sent;
            results.failed += webResult.failed;
            results.messageIds = results.messageIds.concat(webResult.messageIds);
            results.errors = results.errors.concat(webResult.errors);
          }
          break;
          
        case 'web-push':
          // Send to web devices only
          if (tokensByPlatform.web.length > 0) {
            const webPushResult = await this.sendWithWebPush(
              client,
              pushContent,
              tokensByPlatform.web
            );
            
            results.sent += webPushResult.sent;
            results.failed += webPushResult.failed;
            results.messageIds = results.messageIds.concat(webPushResult.messageIds);
            results.errors = results.errors.concat(webPushResult.errors);
          } else {
            throw createError(400, 'No web push tokens provided');
          }
          break;
          
        default:
          throw createError(500, `Unsupported push notification provider: ${provider}`);
      }
      
      // Update success flag if any failures
      if (results.failed > 0) {
        results.success = results.sent > 0;
      }
      
      // Update channel delivery stats
      await channel.updateDeliveryStats('sent');
      
      logger.info(`Push notification sent: ${notification._id}, sent: ${results.sent}, failed: ${results.failed}`);
      
      return results;
    } catch (error) {
      logger.error(`Error sending push notification: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Prepare push notification content from notification
   * @param {Object} notification - Notification object
   * @returns {Object} - Push notification content
   */
  preparePushContent(notification) {
    // Use push-specific content if available
    const pushData = notification.data?.push || {};
    
    // Prepare push content
    const pushContent = {
      title: pushData.title || notification.title,
      body: pushData.body || notification.message,
      data: {
        notificationId: notification._id.toString(),
        category: notification.category,
        type: notification.type,
        ...notification.data
      }
    };
    
    // Add actions if available
    if (notification.actions && notification.actions.length > 0) {
      pushContent.actions = notification.actions.map(action => ({
        action: action.name,
        title: action.text,
        icon: action.icon
      }));
      
      // Add click action from the primary action
      const primaryAction = notification.actions.find(action => action.isPrimary);
      if (primaryAction && primaryAction.url) {
        pushContent.data.clickAction = primaryAction.url;
      }
    }
    
    // Add icon if available
    if (pushData.icon) {
      pushContent.icon = pushData.icon;
    }
    
    // Add image if available
    if (pushData.image) {
      pushContent.image = pushData.image;
    }
    
    // Add badge if available
    if (pushData.badge) {
      pushContent.badge = pushData.badge;
    }
    
    return pushContent;
  }

  /**
   * Group tokens by platform
   * @param {Array} tokens - Array of token objects
   * @returns {Object} - Tokens grouped by platform
   */
  groupTokensByPlatform(tokens) {
    const result = {
      android: [],
      ios: [],
      web: []
    };
    
    tokens.forEach(token => {
      if (token.platform === 'android') {
        result.android.push(token.token);
      } else if (token.platform === 'ios') {
        result.ios.push(token.token);
      } else if (token.platform === 'web') {
        result.web.push(token.token);
      }
    });
    
    return result;
  }

  /**
   * Send push notification using Firebase Cloud Messaging
   * @param {Object} client - FCM client
   * @param {Object} content - Push notification content
   * @param {Array} tokens - Device tokens
   * @returns {Promise<Object>} - Send result
   */
  async sendWithFcm(client, content, tokens) {
    // Prepare FCM message
    const message = {
      notification: {
        title: content.title,
        body: content.body
      },
      data: Object.entries(content.data).reduce((acc, [key, value]) => {
        // FCM data must be strings
        acc[key] = typeof value === 'string' ? value : JSON.stringify(value);
        return acc;
      }, {}),
      tokens
    };
    
    // Add additional fields if available
    if (content.icon) {
      message.notification.icon = content.icon;
    }
    
    if (content.image) {
      message.notification.imageUrl = content.image;
    }
    
    // Send the message
    try {
      const response = await client.messaging().sendMulticast(message);
      
      // Process results
      const results = {
        sent: response.successCount,
        failed: response.failureCount,
        messageIds: [],
        errors: []
      };
      
      response.responses.forEach((resp, index) => {
        if (resp.success) {
          results.messageIds.push(resp.messageId);
        } else {
          results.errors.push({
            token: tokens[index],
            error: resp.error.message
          });
        }
      });
      
      return results;
    } catch (error) {
      throw new Error(`FCM send error: ${error.message}`);
    }
  }

  /**
   * Send web push notification using Firebase Cloud Messaging
   * @param {Object} client - FCM client
   * @param {Object} content - Push notification content
   * @param {Array} tokens - Web push tokens
   * @returns {Promise<Object>} - Send result
   */
  async sendWithFcmWeb(client, content, tokens) {
    // Prepare FCM web message
    const message = {
      notification: {
        title: content.title,
        body: content.body
      },
      data: content.data,
      webpush: {
        notification: {
          icon: content.icon,
          image: content.image,
          badge: content.badge,
          actions: content.actions
        },
        fcmOptions: {
          link: content.data.clickAction
        }
      },
      tokens
    };
    
    // Send the message
    try {
      const response = await client.messaging().sendMulticast(message);
      
      // Process results
      const results = {
        sent: response.successCount,
        failed: response.failureCount,
        messageIds: [],
        errors: []
      };
      
      response.responses.forEach((resp, index) => {
        if (resp.success) {
          results.messageIds.push(resp.messageId);
        } else {
          results.errors.push({
            token: tokens[index],
            error: resp.error.message
          });
        }
      });
      
      return results;
    } catch (error) {
      throw new Error(`FCM web send error: ${error.message}`);
    }
  }

  /**
   * Send web push notification using Web Push API
   * @param {Object} client - Web Push client
   * @param {Object} content - Push notification content
   * @param {Array} tokens - Web push subscription objects
   * @returns {Promise<Object>} - Send result
   */
  async sendWithWebPush(client, content, tokens) {
    const results = {
      sent: 0,
      failed: 0,
      messageIds: [],
      errors: []
    };
    
    // Prepare payload
    const payload = JSON.stringify({
      title: content.title,
      body: content.body,
      icon: content.icon,
      image: content.image,
      badge: content.badge,
      data: content.data,
      actions: content.actions
    });
    
    // Send to each subscription
    const sendPromises = tokens.map(async (token, index) => {
      try {
        // Parse subscription if it's a string
        let subscription;
        try {
          subscription = typeof token === 'string' ? JSON.parse(token) : token;
        } catch (error) {
          throw new Error(`Invalid subscription format: ${error.message}`);
        }
        
        const result = await client.sendNotification(subscription, payload);
        results.sent++;
        results.messageIds.push(`wp-${Date.now()}-${index}`);
        return result;
      } catch (error) {
        results.failed++;
        results.errors.push({
          token,
          error: error.message
        });
        return error;
      }
    });
    
    await Promise.all(sendPromises);
    return results;
  }

  /**
   * Subscribe a device to push notifications
   * @param {String} userId - User ID
   * @param {Object} subscription - Push subscription details
   * @returns {Promise<Object>} - Subscription result
   */
  async subscribe(userId, subscription) {
    try {
      // Implementation would depend on how subscriptions are stored
      // This is a placeholder for the actual implementation
      
      logger.info(`User ${userId} subscribed to push notifications`);
      
      return {
        success: true,
        userId,
        subscriptionId: `sub-${Date.now()}`
      };
    } catch (error) {
      logger.error(`Error subscribing to push notifications: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Unsubscribe a device from push notifications
   * @param {String} userId - User ID
   * @param {String} token - Push token to unsubscribe
   * @returns {Promise<Object>} - Unsubscription result
   */
  async unsubscribe(userId, token) {
    try {
      // Implementation would depend on how subscriptions are stored
      // This is a placeholder for the actual implementation
      
      logger.info(`User ${userId} unsubscribed from push notifications`);
      
      return {
        success: true,
        userId
      };
    } catch (error) {
      logger.error(`Error unsubscribing from push notifications: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new PushNotificationService();