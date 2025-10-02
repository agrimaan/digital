const NotificationChannel = require('../models/NotificationChannel');
const { createError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

// SMS service providers
const providers = {
  twilio: require('twilio'),
  sns: require('@aws-sdk/client-sns'),
  nexmo: require('@vonage/server-sdk')
};

/**
 * Service for handling SMS notifications
 */
class SmsService {
  constructor() {
    this.clients = new Map();
    this.defaultChannel = null;
  }

  /**
   * Initialize SMS service with channels
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Load all active SMS channels
      const channels = await NotificationChannel.findActiveByType('sms');
      
      if (channels.length === 0) {
        logger.warn('No active SMS channels found');
        return;
      }
      
      // Initialize each channel
      for (const channel of channels) {
        await this.initializeChannel(channel);
      }
      
      // Set default channel
      const defaultChannel = await NotificationChannel.findDefaultByType('sms');
      if (defaultChannel) {
        this.defaultChannel = defaultChannel.name;
        logger.info(`Default SMS channel set to: ${this.defaultChannel}`);
      } else if (channels.length > 0) {
        this.defaultChannel = channels[0].name;
        logger.info(`No default SMS channel found, using: ${this.defaultChannel}`);
      }
    } catch (error) {
      logger.error(`Error initializing SMS service: ${error.message}`);
      throw error;
    }
  }

  /**
   * Initialize a specific SMS channel
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
        case 'twilio':
          client = providers.twilio(
            config.twilio.accountSid,
            config.twilio.authToken
          );
          break;
          
        case 'sns':
          client = new providers.sns.SNSClient({
            region: config.sns.region,
            credentials: {
              accessKeyId: config.sns.accessKeyId,
              secretAccessKey: config.sns.secretAccessKey
            }
          });
          break;
          
        case 'nexmo':
          client = new providers.nexmo({
            apiKey: config.nexmo.apiKey,
            apiSecret: config.nexmo.apiSecret
          });
          break;
          
        default:
          throw new Error(`Unsupported SMS provider: ${config.provider}`);
      }
      
      // Store client
      this.clients.set(channel.name, {
        client,
        config,
        provider: config.provider,
        channel
      });
      
      logger.info(`SMS channel initialized: ${channel.name} (${config.provider})`);
    } catch (error) {
      logger.error(`Error initializing SMS channel ${channel.name}: ${error.message}`);
      
      // Update channel status to error
      channel.status = 'error';
      channel.errorMessage = error.message;
      await channel.save();
      
      throw error;
    }
  }

  /**
   * Send an SMS notification
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
        throw createError(500, 'No SMS channel available');
      }
      
      const { client, config, provider, channel } = this.clients.get(channelToUse);
      
      // Check if we have a phone number to send to
      if (!deliverySettings.phoneNumber) {
        throw createError(400, 'No phone number provided for recipient');
      }
      
      // Prepare SMS content
      const smsContent = this.prepareSmsContent(notification);
      
      // Send SMS based on provider
      let result;
      switch (provider) {
        case 'twilio':
          result = await this.sendWithTwilio(client, smsContent, deliverySettings.phoneNumber, config.twilio);
          break;
          
        case 'sns':
          result = await this.sendWithSns(client, smsContent, deliverySettings.phoneNumber);
          break;
          
        case 'nexmo':
          result = await this.sendWithNexmo(client, smsContent, deliverySettings.phoneNumber, config.nexmo);
          break;
          
        default:
          throw createError(500, `Unsupported SMS provider: ${provider}`);
      }
      
      // Update channel delivery stats
      await channel.updateDeliveryStats('sent');
      
      logger.info(`SMS notification sent: ${notification._id} to ${deliverySettings.phoneNumber}`);
      
      return {
        success: true,
        messageId: result.messageId,
        provider
      };
    } catch (error) {
      logger.error(`Error sending SMS notification: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Prepare SMS content from notification
   * @param {Object} notification - Notification object
   * @returns {Object} - SMS content
   */
  prepareSmsContent(notification) {
    // Use SMS-specific content if available
    const smsData = notification.data?.sms || {};
    
    // Prepare SMS content
    let text = smsData.text || notification.message;
    
    // Add title if not already included in the message
    if (!text.includes(notification.title)) {
      text = `${notification.title}: ${text}`;
    }
    
    // Truncate if too long (most SMS providers have a limit around 160 characters)
    const maxLength = 160;
    if (text.length > maxLength) {
      text = text.substring(0, maxLength - 3) + '...';
    }
    
    return { text };
  }

  /**
   * Send SMS using Twilio
   * @param {Object} client - Twilio client
   * @param {Object} content - SMS content
   * @param {String} phoneNumber - Recipient phone number
   * @param {Object} config - Twilio configuration
   * @returns {Promise<Object>} - Send result
   */
  async sendWithTwilio(client, content, phoneNumber, config) {
    const message = await client.messages.create({
      body: content.text,
      from: config.phoneNumber,
      to: phoneNumber
    });
    
    return {
      messageId: message.sid,
      status: message.status
    };
  }

  /**
   * Send SMS using Amazon SNS
   * @param {Object} client - SNS client
   * @param {Object} content - SMS content
   * @param {String} phoneNumber - Recipient phone number
   * @returns {Promise<Object>} - Send result
   */
  async sendWithSns(client, content, phoneNumber) {
    const params = {
      Message: content.text,
      PhoneNumber: phoneNumber,
      MessageAttributes: {
        'AWS.SNS.SMS.SenderID': {
          DataType: 'String',
          StringValue: 'AGRIMAAN'
        },
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Transactional'
        }
      }
    };
    
    const command = new providers.sns.PublishCommand(params);
    const response = await client.send(command);
    
    return {
      messageId: response.MessageId,
      status: 'sent'
    };
  }

  /**
   * Send SMS using Nexmo/Vonage
   * @param {Object} client - Nexmo client
   * @param {Object} content - SMS content
   * @param {String} phoneNumber - Recipient phone number
   * @param {Object} config - Nexmo configuration
   * @returns {Promise<Object>} - Send result
   */
  async sendWithNexmo(client, content, phoneNumber, config) {
    return new Promise((resolve, reject) => {
      client.message.sendSms(
        config.from,
        phoneNumber,
        content.text,
        {},
        (error, response) => {
          if (error) {
            reject(error);
          } else {
            const message = response.messages[0];
            resolve({
              messageId: message.message_id,
              status: message.status === '0' ? 'sent' : 'failed',
              remainingBalance: message['remaining-balance'],
              messagePrice: message['message-price']
            });
          }
        }
      );
    });
  }

  /**
   * Verify a phone number
   * @param {String} phoneNumber - Phone number to verify
   * @param {String} channelName - Channel name to use (optional)
   * @returns {Promise<Object>} - Verification result
   */
  async verifyPhoneNumber(phoneNumber, channelName = null) {
    try {
      // Ensure service is initialized
      if (this.clients.size === 0) {
        await this.initialize();
      }
      
      // Get channel to use
      const channelToUse = channelName || this.defaultChannel;
      
      if (!channelToUse || !this.clients.has(channelToUse)) {
        throw createError(500, 'No SMS channel available');
      }
      
      const { client, provider } = this.clients.get(channelToUse);
      
      // Implementation would depend on the provider
      // This is a placeholder for the actual implementation
      
      logger.info(`Phone number verification initiated: ${phoneNumber}`);
      
      return {
        success: true,
        verificationId: `v-${Date.now()}`,
        provider
      };
    } catch (error) {
      logger.error(`Error verifying phone number: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check phone number verification code
   * @param {String} verificationId - Verification ID
   * @param {String} code - Verification code
   * @returns {Promise<Object>} - Verification result
   */
  async checkVerificationCode(verificationId, code) {
    try {
      // Implementation would depend on the provider
      // This is a placeholder for the actual implementation
      
      logger.info(`Verification code checked: ${verificationId}`);
      
      return {
        success: true,
        verified: true
      };
    } catch (error) {
      logger.error(`Error checking verification code: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new SmsService();