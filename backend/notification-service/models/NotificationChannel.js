const mongoose = require('mongoose');

/**
 * Notification Channel Schema
 * Represents a configured notification delivery channel
 */
const notificationChannelSchema = new mongoose.Schema({
  // Channel name/identifier
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  
  // Human-readable display name
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  
  // Channel description
  description: {
    type: String,
    trim: true
  },
  
  // Channel type
  type: {
    type: String,
    enum: ['email', 'sms', 'push', 'webhook', 'in-app', 'custom'],
    required: true,
    index: true
  },
  
  // Provider-specific configuration
  config: {
    // Email provider configuration
    email: {
      provider: {
        type: String,
        enum: ['smtp', 'sendgrid', 'mailgun', 'ses', 'custom'],
        required: function() {
          return this.type === 'email';
        }
      },
      
      // SMTP configuration
      smtp: {
        host: { type: String },
        port: { type: Number },
        secure: { type: Boolean, default: true },
        auth: {
          user: { type: String },
          pass: { type: String }
        },
        tls: {
          rejectUnauthorized: { type: Boolean, default: true }
        }
      },
      
      // SendGrid configuration
      sendgrid: {
        apiKey: { type: String }
      },
      
      // Mailgun configuration
      mailgun: {
        apiKey: { type: String },
        domain: { type: String }
      },
      
      // Amazon SES configuration
      ses: {
        accessKeyId: { type: String },
        secretAccessKey: { type: String },
        region: { type: String, default: 'us-east-1' }
      },
      
      // Default sender information
      defaultFrom: { type: String },
      defaultReplyTo: { type: String },
      
      // Email templates directory/path
      templatesDir: { type: String }
    },
    
    // SMS provider configuration
    sms: {
      provider: {
        type: String,
        enum: ['twilio', 'sns', 'nexmo', 'custom'],
        required: function() {
          return this.type === 'sms';
        }
      },
      
      // Twilio configuration
      twilio: {
        accountSid: { type: String },
        authToken: { type: String },
        phoneNumber: { type: String }
      },
      
      // Amazon SNS configuration
      sns: {
        accessKeyId: { type: String },
        secretAccessKey: { type: String },
        region: { type: String, default: 'us-east-1' }
      },
      
      // Nexmo/Vonage configuration
      nexmo: {
        apiKey: { type: String },
        apiSecret: { type: String },
        from: { type: String }
      }
    },
    
    // Push notification provider configuration
    push: {
      provider: {
        type: String,
        enum: ['fcm', 'apns', 'web-push', 'custom'],
        required: function() {
          return this.type === 'push';
        }
      },
      
      // Firebase Cloud Messaging configuration
      fcm: {
        serviceAccountJson: { type: String },
        databaseUrl: { type: String }
      },
      
      // Apple Push Notification Service configuration
      apns: {
        keyId: { type: String },
        teamId: { type: String },
        bundleId: { type: String },
        token: { type: String },
        production: { type: Boolean, default: true }
      },
      
      // Web Push configuration
      webPush: {
        vapidPublicKey: { type: String },
        vapidPrivateKey: { type: String },
        subject: { type: String } // mailto: URL or website URL
      }
    },
    
    // Webhook configuration
    webhook: {
      defaultHeaders: {
        type: Map,
        of: String
      },
      
      // Authentication method
      auth: {
        type: {
          type: String,
          enum: ['none', 'basic', 'bearer', 'custom'],
          default: 'none'
        },
        username: { type: String },
        password: { type: String },
        token: { type: String }
      },
      
      // Retry configuration
      retry: {
        enabled: { type: Boolean, default: true },
        maxAttempts: { type: Number, default: 3 },
        backoffFactor: { type: Number, default: 2 },
        initialDelay: { type: Number, default: 1000 } // in milliseconds
      }
    },
    
    // In-app notification configuration
    inApp: {
      // Storage configuration (where to store in-app notifications)
      storage: {
        type: {
          type: String,
          enum: ['database', 'redis', 'custom'],
          default: 'database'
        },
        
        // Redis configuration
        redis: {
          url: { type: String },
          prefix: { type: String, default: 'notification:' }
        }
      },
      
      // Real-time delivery configuration
      realtime: {
        enabled: { type: Boolean, default: false },
        provider: {
          type: String,
          enum: ['socket.io', 'pusher', 'ably', 'custom']
        },
        
        // Socket.io configuration
        socketio: {
          namespace: { type: String, default: '/notifications' }
        },
        
        // Pusher configuration
        pusher: {
          appId: { type: String },
          key: { type: String },
          secret: { type: String },
          cluster: { type: String }
        },
        
        // Ably configuration
        ably: {
          apiKey: { type: String }
        }
      }
    },
    
    // Custom channel configuration
    custom: {
      // Custom configuration as JSON
      config: {
        type: mongoose.Schema.Types.Mixed
      },
      
      // Handler module path
      handlerModule: { type: String }
    }
  },
  
  // Channel status
  status: {
    type: String,
    enum: ['active', 'inactive', 'testing', 'error'],
    default: 'active',
    index: true
  },
  
  // Error message if channel is in error state
  errorMessage: {
    type: String
  },
  
  // Last time the channel was tested
  lastTested: {
    type: Date
  },
  
  // Channel capabilities
  capabilities: {
    supportsTemplates: {
      type: Boolean,
      default: true
    },
    supportsAttachments: {
      type: Boolean,
      default: false
    },
    supportsBulkSend: {
      type: Boolean,
      default: false
    },
    supportsScheduling: {
      type: Boolean,
      default: false
    },
    supportsTracking: {
      type: Boolean,
      default: false
    }
  },
  
  // Rate limiting configuration
  rateLimit: {
    enabled: {
      type: Boolean,
      default: false
    },
    limit: {
      type: Number,
      default: 100
    },
    window: {
      type: Number,
      default: 60 // in seconds
    }
  },
  
  // Delivery tracking
  deliveryStats: {
    sent: {
      type: Number,
      default: 0
    },
    delivered: {
      type: Number,
      default: 0
    },
    failed: {
      type: Number,
      default: 0
    },
    lastSentAt: {
      type: Date
    }
  },
  
  // Tags for categorizing and filtering channels
  tags: [{
    type: String,
    index: true
  }]
}, {
  timestamps: true,
  versionKey: false
});

/**
 * Get channel configuration based on type
 * @returns {Object} - Channel configuration
 */
notificationChannelSchema.methods.getConfig = function() {
  switch (this.type) {
    case 'email':
      return this.config.email;
    case 'sms':
      return this.config.sms;
    case 'push':
      return this.config.push;
    case 'webhook':
      return this.config.webhook;
    case 'in-app':
      return this.config.inApp;
    case 'custom':
      return this.config.custom;
    default:
      return {};
  }
};

/**
 * Update delivery statistics
 * @param {String} status - Delivery status (sent, delivered, failed)
 * @returns {Promise<Object>} - Updated channel document
 */
notificationChannelSchema.methods.updateDeliveryStats = async function(status) {
  if (status === 'sent') {
    this.deliveryStats.sent += 1;
    this.deliveryStats.lastSentAt = new Date();
  } else if (status === 'delivered') {
    this.deliveryStats.delivered += 1;
  } else if (status === 'failed') {
    this.deliveryStats.failed += 1;
  }
  
  await this.save();
  return this;
};

/**
 * Test the channel configuration
 * @returns {Promise<Object>} - Test result
 */
notificationChannelSchema.methods.test = async function() {
  try {
    // Implementation would depend on the channel type
    // This is a placeholder for the actual implementation
    
    const result = {
      success: true,
      message: 'Channel test successful',
      timestamp: new Date()
    };
    
    // Update channel status
    this.status = 'active';
    this.errorMessage = null;
    this.lastTested = new Date();
    await this.save();
    
    return result;
  } catch (error) {
    // Update channel status
    this.status = 'error';
    this.errorMessage = error.message;
    this.lastTested = new Date();
    await this.save();
    
    return {
      success: false,
      message: error.message,
      timestamp: new Date()
    };
  }
};

/**
 * Static method to find active channels by type
 * @param {String} type - Channel type
 * @returns {Promise<Array>} - Array of active channels
 */
notificationChannelSchema.statics.findActiveByType = function(type) {
  return this.find({
    type,
    status: 'active'
  });
};

/**
 * Static method to find default channel by type
 * @param {String} type - Channel type
 * @returns {Promise<Object>} - Default channel
 */
notificationChannelSchema.statics.findDefaultByType = async function(type) {
  // Find channel with 'default' tag
  const defaultChannel = await this.findOne({
    type,
    status: 'active',
    tags: 'default'
  });
  
  if (defaultChannel) {
    return defaultChannel;
  }
  
  // If no default channel found, return the first active channel of this type
  return this.findOne({
    type,
    status: 'active'
  });
};

const NotificationChannel = mongoose.model('NotificationChannel', notificationChannelSchema);

module.exports = NotificationChannel;