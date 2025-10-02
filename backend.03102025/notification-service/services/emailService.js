const NotificationChannel = require('../models/NotificationChannel');
const nodemailer = require('nodemailer');
const { createError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

// Email service providers
const providers = {
  sendgrid: require('@sendgrid/mail'),
  mailgun: require('mailgun-js'),
  ses: require('@aws-sdk/client-ses')
};

/**
 * Service for handling email notifications
 */
class EmailService {
  constructor() {
    this.transporters = new Map();
    this.defaultChannel = null;
  }

  /**
   * Initialize email service with channels
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Load all active email channels
      const channels = await NotificationChannel.findActiveByType('email');
      
      if (channels.length === 0) {
        logger.warn('No active email channels found');
        return;
      }
      
      // Initialize each channel
      for (const channel of channels) {
        await this.initializeChannel(channel);
      }
      
      // Set default channel
      const defaultChannel = await NotificationChannel.findDefaultByType('email');
      if (defaultChannel) {
        this.defaultChannel = defaultChannel.name;
        logger.info(`Default email channel set to: ${this.defaultChannel}`);
      } else if (channels.length > 0) {
        this.defaultChannel = channels[0].name;
        logger.info(`No default email channel found, using: ${this.defaultChannel}`);
      }
    } catch (error) {
      logger.error(`Error initializing email service: ${error.message}`);
      throw error;
    }
  }

  /**
   * Initialize a specific email channel
   * @param {Object} channel - Channel configuration
   * @returns {Promise<void>}
   */
  async initializeChannel(channel) {
    try {
      const config = channel.getConfig();
      
      if (!config) {
        throw new Error(`Invalid configuration for channel: ${channel.name}`);
      }
      
      let transporter;
      
      switch (config.provider) {
        case 'smtp':
          transporter = nodemailer.createTransport({
            host: config.smtp.host,
            port: config.smtp.port,
            secure: config.smtp.secure,
            auth: {
              user: config.smtp.auth.user,
              pass: config.smtp.auth.pass
            },
            tls: {
              rejectUnauthorized: config.smtp.tls?.rejectUnauthorized ?? true
            }
          });
          
          // Verify connection
          await transporter.verify();
          break;
          
        case 'sendgrid':
          providers.sendgrid.setApiKey(config.sendgrid.apiKey);
          transporter = providers.sendgrid;
          break;
          
        case 'mailgun':
          transporter = providers.mailgun({
            apiKey: config.mailgun.apiKey,
            domain: config.mailgun.domain
          });
          break;
          
        case 'ses':
          transporter = new providers.ses.SESClient({
            region: config.ses.region,
            credentials: {
              accessKeyId: config.ses.accessKeyId,
              secretAccessKey: config.ses.secretAccessKey
            }
          });
          break;
          
        default:
          throw new Error(`Unsupported email provider: ${config.provider}`);
      }
      
      // Store transporter
      this.transporters.set(channel.name, {
        transporter,
        config,
        provider: config.provider,
        channel
      });
      
      logger.info(`Email channel initialized: ${channel.name} (${config.provider})`);
    } catch (error) {
      logger.error(`Error initializing email channel ${channel.name}: ${error.message}`);
      
      // Update channel status to error
      channel.status = 'error';
      channel.errorMessage = error.message;
      await channel.save();
      
      throw error;
    }
  }

  /**
   * Send an email notification
   * @param {Object} notification - Notification object
   * @param {Object} deliverySettings - Delivery settings from user preferences
   * @param {String} channelName - Channel name to use (optional)
   * @returns {Promise<Object>} - Send result
   */
  async sendNotification(notification, deliverySettings, channelName = null) {
    try {
      // Ensure service is initialized
      if (this.transporters.size === 0) {
        await this.initialize();
      }
      
      // Get channel to use
      const channelToUse = channelName || this.defaultChannel;
      
      if (!channelToUse || !this.transporters.has(channelToUse)) {
        throw createError(500, 'No email channel available');
      }
      
      const { transporter, config, provider, channel } = this.transporters.get(channelToUse);
      
      // Check if we have an email address to send to
      if (!deliverySettings.address) {
        throw createError(400, 'No email address provided for recipient');
      }
      
      // Check delivery frequency
      if (deliverySettings.frequency !== 'immediate') {
        // For non-immediate delivery, we'll just queue it for later processing
        logger.info(`Email notification queued for ${deliverySettings.frequency} delivery: ${notification._id}`);
        return {
          success: true,
          queued: true,
          frequency: deliverySettings.frequency
        };
      }
      
      // Prepare email content
      const emailContent = this.prepareEmailContent(notification, config);
      
      // Send email based on provider
      let result;
      switch (provider) {
        case 'smtp':
          result = await this.sendWithSmtp(transporter, emailContent, deliverySettings.address);
          break;
          
        case 'sendgrid':
          result = await this.sendWithSendgrid(transporter, emailContent, deliverySettings.address);
          break;
          
        case 'mailgun':
          result = await this.sendWithMailgun(transporter, emailContent, deliverySettings.address);
          break;
          
        case 'ses':
          result = await this.sendWithSes(transporter, emailContent, deliverySettings.address);
          break;
          
        default:
          throw createError(500, `Unsupported email provider: ${provider}`);
      }
      
      // Update channel delivery stats
      await channel.updateDeliveryStats('sent');
      
      logger.info(`Email notification sent: ${notification._id} to ${deliverySettings.address}`);
      
      return {
        success: true,
        messageId: result.messageId,
        provider
      };
    } catch (error) {
      logger.error(`Error sending email notification: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Prepare email content from notification
   * @param {Object} notification - Notification object
   * @param {Object} config - Channel configuration
   * @returns {Object} - Email content
   */
  prepareEmailContent(notification, config) {
    // Use email-specific content if available
    const emailData = notification.data?.email || {};
    
    // Prepare email content
    const emailContent = {
      subject: emailData.subject || notification.title,
      text: emailData.textBody || notification.message,
      html: emailData.htmlBody || this.convertToHtml(notification)
    };
    
    // Set from address
    emailContent.from = emailData.from || config.defaultFrom || 'notifications@agrimaan.com';
    
    // Set reply-to if configured
    if (emailData.replyTo || config.defaultReplyTo) {
      emailContent.replyTo = emailData.replyTo || config.defaultReplyTo;
    }
    
    return emailContent;
  }

  /**
   * Convert notification to HTML format
   * @param {Object} notification - Notification object
   * @returns {String} - HTML content
   */
  convertToHtml(notification) {
    // Simple HTML conversion
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${notification.title}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            margin-bottom: 20px;
          }
          .content {
            margin-bottom: 30px;
          }
          .footer {
            font-size: 12px;
            color: #777;
            margin-top: 30px;
            padding-top: 10px;
            border-top: 1px solid #eee;
          }
          .button {
            display: inline-block;
            padding: 10px 20px;
            margin: 10px 0;
            background-color: #4CAF50;
            color: white;
            text-decoration: none;
            border-radius: 4px;
          }
          .secondary-button {
            background-color: #f1f1f1;
            color: #333;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>${notification.title}</h2>
        </div>
        <div class="content">
          <p>${notification.message.replace(/\n/g, '<br>')}</p>
    `;
    
    // Add action buttons if available
    if (notification.actions && notification.actions.length > 0) {
      html += '<div class="actions">';
      
      notification.actions.forEach(action => {
        if (action.url) {
          const buttonClass = action.isPrimary ? 'button' : 'button secondary-button';
          html += `<a href="${action.url}" class="${buttonClass}">${action.text}</a> `;
        }
      });
      
      html += '</div>';
    }
    
    // Add footer
    html += `
        </div>
        <div class="footer">
          <p>This is an automated notification from Agrimaan.</p>
          <p>Category: ${notification.category} | Type: ${notification.type}</p>
        </div>
      </body>
      </html>
    `;
    
    return html;
  }

  /**
   * Send email using SMTP
   * @param {Object} transporter - Nodemailer transporter
   * @param {Object} content - Email content
   * @param {String} recipient - Recipient email address
   * @returns {Promise<Object>} - Send result
   */
  async sendWithSmtp(transporter, content, recipient) {
    const mailOptions = {
      from: content.from,
      to: recipient,
      subject: content.subject,
      text: content.text,
      html: content.html
    };
    
    if (content.replyTo) {
      mailOptions.replyTo = content.replyTo;
    }
    
    return await transporter.sendMail(mailOptions);
  }

  /**
   * Send email using SendGrid
   * @param {Object} client - SendGrid client
   * @param {Object} content - Email content
   * @param {String} recipient - Recipient email address
   * @returns {Promise<Object>} - Send result
   */
  async sendWithSendgrid(client, content, recipient) {
    const msg = {
      to: recipient,
      from: content.from,
      subject: content.subject,
      text: content.text,
      html: content.html
    };
    
    if (content.replyTo) {
      msg.replyTo = content.replyTo;
    }
    
    const response = await client.send(msg);
    return {
      messageId: response[0]?.headers['x-message-id'],
      response
    };
  }

  /**
   * Send email using Mailgun
   * @param {Object} client - Mailgun client
   * @param {Object} content - Email content
   * @param {String} recipient - Recipient email address
   * @returns {Promise<Object>} - Send result
   */
  async sendWithMailgun(client, content, recipient) {
    const data = {
      from: content.from,
      to: recipient,
      subject: content.subject,
      text: content.text,
      html: content.html
    };
    
    if (content.replyTo) {
      data['h:Reply-To'] = content.replyTo;
    }
    
    return await new Promise((resolve, reject) => {
      client.messages().send(data, (error, body) => {
        if (error) reject(error);
        else resolve(body);
      });
    });
  }

  /**
   * Send email using Amazon SES
   * @param {Object} client - SES client
   * @param {Object} content - Email content
   * @param {String} recipient - Recipient email address
   * @returns {Promise<Object>} - Send result
   */
  async sendWithSes(client, content, recipient) {
    const params = {
      Source: content.from,
      Destination: {
        ToAddresses: [recipient]
      },
      Message: {
        Subject: {
          Data: content.subject,
          Charset: 'UTF-8'
        },
        Body: {
          Text: {
            Data: content.text,
            Charset: 'UTF-8'
          },
          Html: {
            Data: content.html,
            Charset: 'UTF-8'
          }
        }
      }
    };
    
    if (content.replyTo) {
      params.ReplyToAddresses = [content.replyTo];
    }
    
    const command = new providers.ses.SendEmailCommand(params);
    return await client.send(command);
  }

  /**
   * Process email digest for a user
   * @param {String} userId - User ID
   * @param {String} frequency - Digest frequency (digest, daily, weekly)
   * @returns {Promise<Object>} - Processing result
   */
  async processEmailDigest(userId, frequency) {
    try {
      // Implementation would depend on how digests are stored and processed
      // This is a placeholder for the actual implementation
      
      logger.info(`Processing ${frequency} email digest for user ${userId}`);
      
      return {
        success: true,
        userId,
        frequency,
        processed: 0
      };
    } catch (error) {
      logger.error(`Error processing email digest: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new EmailService();