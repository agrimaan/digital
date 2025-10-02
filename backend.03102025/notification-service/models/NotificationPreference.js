const mongoose = require('mongoose');

/**
 * Notification Preference Schema
 * Represents user preferences for receiving notifications
 */
const notificationPreferenceSchema = new mongoose.Schema({
  // User ID
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Global notification settings
  global: {
    // Whether notifications are enabled globally
    enabled: {
      type: Boolean,
      default: true
    },
    
    // Quiet hours settings
    quietHours: {
      enabled: {
        type: Boolean,
        default: false
      },
      start: {
        type: String, // Format: HH:MM in 24-hour format
        default: '22:00'
      },
      end: {
        type: String, // Format: HH:MM in 24-hour format
        default: '07:00'
      },
      timezone: {
        type: String,
        default: 'UTC'
      }
    }
  },
  
  // Channel-specific preferences
  channels: {
    // In-app notification preferences
    inApp: {
      enabled: {
        type: Boolean,
        default: true
      },
      showBadge: {
        type: Boolean,
        default: true
      },
      showPreview: {
        type: Boolean,
        default: true
      }
    },
    
    // Email notification preferences
    email: {
      enabled: {
        type: Boolean,
        default: true
      },
      address: {
        type: String,
        trim: true
      },
      frequency: {
        type: String,
        enum: ['immediate', 'digest', 'daily', 'weekly'],
        default: 'immediate'
      },
      digestTime: {
        type: String, // Format: HH:MM in 24-hour format
        default: '09:00'
      },
      weeklyDay: {
        type: Number, // 0 = Sunday, 1 = Monday, etc.
        default: 1
      }
    },
    
    // SMS notification preferences
    sms: {
      enabled: {
        type: Boolean,
        default: false
      },
      phoneNumber: {
        type: String,
        trim: true
      },
      verificationStatus: {
        type: String,
        enum: ['unverified', 'pending', 'verified'],
        default: 'unverified'
      }
    },
    
    // Push notification preferences
    push: {
      enabled: {
        type: Boolean,
        default: true
      },
      tokens: [{
        token: {
          type: String,
          required: true
        },
        device: {
          type: String
        },
        platform: {
          type: String,
          enum: ['ios', 'android', 'web'],
          required: true
        },
        lastUsed: {
          type: Date,
          default: Date.now
        }
      }]
    },
    
    // Webhook notification preferences
    webhook: {
      enabled: {
        type: Boolean,
        default: false
      },
      endpoints: [{
        url: {
          type: String,
          required: true
        },
        secret: {
          type: String
        },
        description: {
          type: String
        },
        events: [{
          type: String
        }],
        active: {
          type: Boolean,
          default: true
        }
      }]
    }
  },
  
  // Category-specific preferences
  categories: [{
    // Category name
    name: {
      type: String,
      required: true
    },
    
    // Whether this category is enabled
    enabled: {
      type: Boolean,
      default: true
    },
    
    // Channel overrides for this category
    channelOverrides: {
      inApp: {
        enabled: {
          type: Boolean
        }
      },
      email: {
        enabled: {
          type: Boolean
        },
        frequency: {
          type: String,
          enum: ['immediate', 'digest', 'daily', 'weekly']
        }
      },
      sms: {
        enabled: {
          type: Boolean
        }
      },
      push: {
        enabled: {
          type: Boolean
        }
      },
      webhook: {
        enabled: {
          type: Boolean
        }
      }
    },
    
    // Priority-specific settings for this category
    priorityOverrides: {
      low: {
        enabled: {
          type: Boolean
        },
        channels: {
          inApp: { type: Boolean },
          email: { type: Boolean },
          sms: { type: Boolean },
          push: { type: Boolean },
          webhook: { type: Boolean }
        }
      },
      normal: {
        enabled: {
          type: Boolean
        },
        channels: {
          inApp: { type: Boolean },
          email: { type: Boolean },
          sms: { type: Boolean },
          push: { type: Boolean },
          webhook: { type: Boolean }
        }
      },
      high: {
        enabled: {
          type: Boolean
        },
        channels: {
          inApp: { type: Boolean },
          email: { type: Boolean },
          sms: { type: Boolean },
          push: { type: Boolean },
          webhook: { type: Boolean }
        }
      },
      urgent: {
        enabled: {
          type: Boolean
        },
        channels: {
          inApp: { type: Boolean },
          email: { type: Boolean },
          sms: { type: Boolean },
          push: { type: Boolean },
          webhook: { type: Boolean }
        }
      }
    }
  }],
  
  // Type-specific preferences
  types: [{
    // Type name
    name: {
      type: String,
      required: true
    },
    
    // Whether this type is enabled
    enabled: {
      type: Boolean,
      default: true
    },
    
    // Channel overrides for this type
    channelOverrides: {
      inApp: {
        enabled: {
          type: Boolean
        }
      },
      email: {
        enabled: {
          type: Boolean
        },
        frequency: {
          type: String,
          enum: ['immediate', 'digest', 'daily', 'weekly']
        }
      },
      sms: {
        enabled: {
          type: Boolean
        }
      },
      push: {
        enabled: {
          type: Boolean
        }
      },
      webhook: {
        enabled: {
          type: Boolean
        }
      }
    }
  }],
  
  // Template-specific preferences
  templates: [{
    // Template name
    name: {
      type: String,
      required: true
    },
    
    // Whether this template is enabled
    enabled: {
      type: Boolean,
      default: true
    },
    
    // Channel overrides for this template
    channelOverrides: {
      inApp: {
        enabled: {
          type: Boolean
        }
      },
      email: {
        enabled: {
          type: Boolean
        },
        frequency: {
          type: String,
          enum: ['immediate', 'digest', 'daily', 'weekly']
        }
      },
      sms: {
        enabled: {
          type: Boolean
        }
      },
      push: {
        enabled: {
          type: Boolean
        }
      },
      webhook: {
        enabled: {
          type: Boolean
        }
      }
    }
  }]
}, {
  timestamps: true,
  versionKey: false
});

/**
 * Check if notifications are enabled for a specific category, type, and channel
 * @param {String} category - Notification category
 * @param {String} type - Notification type
 * @param {String} channel - Notification channel
 * @param {String} priority - Notification priority
 * @param {String} template - Notification template name
 * @returns {Boolean} - Whether notifications are enabled
 */
notificationPreferenceSchema.methods.isEnabled = function(category, type, channel, priority = 'normal', template = null) {
  // Check if notifications are globally disabled
  if (!this.global.enabled) {
    return false;
  }
  
  // Check if the channel is globally disabled
  if (!this.channels[channel]?.enabled) {
    return false;
  }
  
  // Check quiet hours if applicable
  if (this.global.quietHours.enabled && channel !== 'inApp') {
    const now = new Date();
    const userTimezone = this.global.quietHours.timezone || 'UTC';
    
    // Convert current time to user's timezone
    const userTime = new Intl.DateTimeFormat('en-US', {
      timeZone: userTimezone,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    }).format(now);
    
    const currentHour = parseInt(userTime.split(':')[0], 10);
    const currentMinute = parseInt(userTime.split(':')[1], 10);
    const currentTimeMinutes = currentHour * 60 + currentMinute;
    
    const startHour = parseInt(this.global.quietHours.start.split(':')[0], 10);
    const startMinute = parseInt(this.global.quietHours.start.split(':')[1], 10);
    const startTimeMinutes = startHour * 60 + startMinute;
    
    const endHour = parseInt(this.global.quietHours.end.split(':')[0], 10);
    const endMinute = parseInt(this.global.quietHours.end.split(':')[1], 10);
    const endTimeMinutes = endHour * 60 + endMinute;
    
    // Check if current time is within quiet hours
    let isQuietHours = false;
    if (startTimeMinutes <= endTimeMinutes) {
      // Simple case: start time is before end time
      isQuietHours = currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes;
    } else {
      // Complex case: quiet hours span midnight
      isQuietHours = currentTimeMinutes >= startTimeMinutes || currentTimeMinutes <= endTimeMinutes;
    }
    
    // If it's quiet hours and not an urgent notification, disable
    if (isQuietHours && priority !== 'urgent') {
      return false;
    }
  }
  
  // Check template-specific settings
  if (template) {
    const templatePreference = this.templates.find(t => t.name === template);
    if (templatePreference) {
      // If template is explicitly disabled
      if (templatePreference.enabled === false) {
        return false;
      }
      
      // Check template channel override
      const templateChannelOverride = templatePreference.channelOverrides?.[channel]?.enabled;
      if (templateChannelOverride !== undefined) {
        return templateChannelOverride;
      }
    }
  }
  
  // Check category-specific settings
  if (category) {
    const categoryPreference = this.categories.find(c => c.name === category);
    if (categoryPreference) {
      // If category is explicitly disabled
      if (categoryPreference.enabled === false) {
        return false;
      }
      
      // Check priority override for this category
      const priorityOverride = categoryPreference.priorityOverrides?.[priority];
      if (priorityOverride) {
        // Check if this priority is disabled for the category
        if (priorityOverride.enabled === false) {
          return false;
        }
        
        // Check if this channel is disabled for this priority
        const priorityChannelOverride = priorityOverride.channels?.[channel];
        if (priorityChannelOverride !== undefined) {
          return priorityChannelOverride;
        }
      }
      
      // Check category channel override
      const categoryChannelOverride = categoryPreference.channelOverrides?.[channel]?.enabled;
      if (categoryChannelOverride !== undefined) {
        return categoryChannelOverride;
      }
    }
  }
  
  // Check type-specific settings
  if (type) {
    const typePreference = this.types.find(t => t.name === type);
    if (typePreference) {
      // If type is explicitly disabled
      if (typePreference.enabled === false) {
        return false;
      }
      
      // Check type channel override
      const typeChannelOverride = typePreference.channelOverrides?.[channel]?.enabled;
      if (typeChannelOverride !== undefined) {
        return typeChannelOverride;
      }
    }
  }
  
  // Default to the global channel setting
  return this.channels[channel]?.enabled || false;
};

/**
 * Get delivery settings for a specific notification
 * @param {String} category - Notification category
 * @param {String} type - Notification type
 * @param {String} channel - Notification channel
 * @returns {Object} - Delivery settings
 */
notificationPreferenceSchema.methods.getDeliverySettings = function(category, type, channel) {
  const settings = {};
  
  // Get base channel settings
  if (channel === 'email') {
    settings.frequency = this.channels.email.frequency || 'immediate';
    settings.address = this.channels.email.address;
    settings.digestTime = this.channels.email.digestTime;
    settings.weeklyDay = this.channels.email.weeklyDay;
  } else if (channel === 'sms') {
    settings.phoneNumber = this.channels.sms.phoneNumber;
  } else if (channel === 'push') {
    settings.tokens = this.channels.push.tokens
      .filter(token => token.active !== false)
      .map(token => ({
        token: token.token,
        platform: token.platform,
        device: token.device
      }));
  } else if (channel === 'webhook') {
    settings.endpoints = this.channels.webhook.endpoints
      .filter(endpoint => endpoint.active !== false)
      .map(endpoint => ({
        url: endpoint.url,
        secret: endpoint.secret,
        events: endpoint.events
      }));
  } else if (channel === 'inApp') {
    settings.showBadge = this.channels.inApp.showBadge;
    settings.showPreview = this.channels.inApp.showPreview;
  }
  
  // Override with category-specific settings
  if (category) {
    const categoryPreference = this.categories.find(c => c.name === category);
    if (categoryPreference && categoryPreference.channelOverrides) {
      if (channel === 'email' && categoryPreference.channelOverrides.email) {
        if (categoryPreference.channelOverrides.email.frequency) {
          settings.frequency = categoryPreference.channelOverrides.email.frequency;
        }
      }
    }
  }
  
  // Override with type-specific settings
  if (type) {
    const typePreference = this.types.find(t => t.name === type);
    if (typePreference && typePreference.channelOverrides) {
      if (channel === 'email' && typePreference.channelOverrides.email) {
        if (typePreference.channelOverrides.email.frequency) {
          settings.frequency = typePreference.channelOverrides.email.frequency;
        }
      }
    }
  }
  
  return settings;
};

/**
 * Add or update a push token
 * @param {String} token - Push notification token
 * @param {String} platform - Device platform (ios, android, web)
 * @param {String} device - Device identifier
 * @returns {Promise<Object>} - Updated preference document
 */
notificationPreferenceSchema.methods.addPushToken = async function(token, platform, device) {
  // Check if token already exists
  const existingTokenIndex = this.channels.push.tokens.findIndex(t => t.token === token);
  
  if (existingTokenIndex !== -1) {
    // Update existing token
    this.channels.push.tokens[existingTokenIndex].lastUsed = new Date();
    this.channels.push.tokens[existingTokenIndex].platform = platform;
    if (device) {
      this.channels.push.tokens[existingTokenIndex].device = device;
    }
  } else {
    // Add new token
    this.channels.push.tokens.push({
      token,
      platform,
      device,
      lastUsed: new Date()
    });
  }
  
  await this.save();
  return this;
};

/**
 * Remove a push token
 * @param {String} token - Push notification token to remove
 * @returns {Promise<Object>} - Updated preference document
 */
notificationPreferenceSchema.methods.removePushToken = async function(token) {
  this.channels.push.tokens = this.channels.push.tokens.filter(t => t.token !== token);
  await this.save();
  return this;
};

/**
 * Static method to get or create preferences for a user
 * @param {String} userId - User ID
 * @returns {Promise<Object>} - User's notification preferences
 */
notificationPreferenceSchema.statics.getOrCreate = async function(userId) {
  let preferences = await this.findOne({ userId });
  
  if (!preferences) {
    // Create default preferences
    preferences = new this({
      userId,
      // Default settings are defined in the schema
    });
    
    await preferences.save();
  }
  
  return preferences;
};

const NotificationPreference = mongoose.model('NotificationPreference', notificationPreferenceSchema);

module.exports = NotificationPreference;