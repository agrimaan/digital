const mongoose = require('mongoose');

/**
 * Notification Template Schema
 * Represents a template for generating notifications
 */
const notificationTemplateSchema = new mongoose.Schema({
  // Template name/identifier
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
  
  // Template description
  description: {
    type: String,
    trim: true
  },
  
  // Notification type (e.g., alert, info, reminder, etc.)
  type: {
    type: String,
    required: true,
    index: true
  },
  
  // Notification category (e.g., system, crop, weather, marketplace, etc.)
  category: {
    type: String,
    required: true,
    index: true
  },
  
  // Template for notification title (supports variables with {{variable}} syntax)
  titleTemplate: {
    type: String,
    required: true
  },
  
  // Template for notification message (supports variables with {{variable}} syntax)
  messageTemplate: {
    type: String,
    required: true
  },
  
  // Default notification priority level
  defaultPriority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Channels this template supports
  supportedChannels: [{
    // Channel type
    type: {
      type: String,
      enum: ['in-app', 'email', 'sms', 'push', 'webhook'],
      required: true
    },
    
    // Whether this channel is enabled by default
    enabled: {
      type: Boolean,
      default: true
    },
    
    // Channel-specific template content
    content: {
      // Email-specific fields
      subject: {
        type: String
      },
      htmlBody: {
        type: String
      },
      textBody: {
        type: String
      },
      
      // SMS-specific fields
      smsText: {
        type: String
      },
      
      // Push notification specific fields
      pushTitle: {
        type: String
      },
      pushBody: {
        type: String
      },
      
      // Webhook specific fields
      webhookPayload: {
        type: mongoose.Schema.Types.Mixed
      }
    }
  }],
  
  // Default actions for notifications created from this template
  defaultActions: [{
    // Action name/identifier
    name: {
      type: String,
      required: true
    },
    
    // Display text for the action
    text: {
      type: String,
      required: true
    },
    
    // URL or deep link template (supports variables with {{variable}} syntax)
    urlTemplate: {
      type: String
    },
    
    // Icon for the action button
    icon: {
      type: String
    },
    
    // Primary action flag
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  
  // Variables that this template expects
  variables: [{
    // Variable name
    name: {
      type: String,
      required: true
    },
    
    // Variable description
    description: {
      type: String
    },
    
    // Whether this variable is required
    required: {
      type: Boolean,
      default: true
    },
    
    // Default value for the variable
    defaultValue: {
      type: String
    },
    
    // Example value for documentation
    exampleValue: {
      type: String
    }
  }],
  
  // Whether this template is active
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // User/service that created this template
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // User/service that last updated this template
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Tags for categorizing and filtering templates
  tags: [{
    type: String,
    index: true
  }],
  
  // Version number of the template
  version: {
    type: Number,
    default: 1
  },
  
  // Previous version of this template (for versioning)
  previousVersion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NotificationTemplate'
  }
}, {
  timestamps: true,
  versionKey: false
});

// Create indexes for common query patterns
notificationTemplateSchema.index({ name: 1, version: 1 });
notificationTemplateSchema.index({ category: 1, isActive: 1 });
notificationTemplateSchema.index({ tags: 1, isActive: 1 });

/**
 * Render template with provided variables
 * @param {Object} variables - Variables to use for rendering
 * @param {String} channel - Channel to render for (in-app, email, sms, push, webhook)
 * @returns {Object} - Rendered notification content
 */
notificationTemplateSchema.methods.render = function(variables = {}, channel = 'in-app') {
  // Helper function to replace variables in a string
  const replaceVariables = (template) => {
    if (!template) return '';
    
    return template.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
      const trimmedVarName = varName.trim();
      return variables[trimmedVarName] !== undefined ? variables[trimmedVarName] : match;
    });
  };
  
  // Render title and message
  const title = replaceVariables(this.titleTemplate);
  const message = replaceVariables(this.messageTemplate);
  
  // Render actions
  const actions = this.defaultActions.map(action => ({
    name: action.name,
    text: action.text,
    url: action.urlTemplate ? replaceVariables(action.urlTemplate) : undefined,
    icon: action.icon,
    isPrimary: action.isPrimary
  }));
  
  // Base notification content
  const content = {
    title,
    message,
    actions,
    type: this.type,
    category: this.category,
    priority: this.defaultPriority
  };
  
  // Add channel-specific content
  const channelConfig = this.supportedChannels.find(c => c.type === channel);
  if (channelConfig && channelConfig.content) {
    switch (channel) {
      case 'email':
        content.email = {
          subject: replaceVariables(channelConfig.content.subject || title),
          htmlBody: replaceVariables(channelConfig.content.htmlBody || message),
          textBody: replaceVariables(channelConfig.content.textBody || message)
        };
        break;
        
      case 'sms':
        content.sms = {
          text: replaceVariables(channelConfig.content.smsText || message)
        };
        break;
        
      case 'push':
        content.push = {
          title: replaceVariables(channelConfig.content.pushTitle || title),
          body: replaceVariables(channelConfig.content.pushBody || message)
        };
        break;
        
      case 'webhook':
        // For webhook, we need to recursively replace variables in the payload
        const processObject = (obj) => {
          if (!obj) return obj;
          
          if (typeof obj === 'string') {
            return replaceVariables(obj);
          } else if (Array.isArray(obj)) {
            return obj.map(item => processObject(item));
          } else if (typeof obj === 'object') {
            const result = {};
            for (const key in obj) {
              result[key] = processObject(obj[key]);
            }
            return result;
          }
          
          return obj;
        };
        
        content.webhook = {
          payload: processObject(channelConfig.content.webhookPayload || {
            title,
            message,
            type: this.type,
            category: this.category
          })
        };
        break;
    }
  }
  
  return content;
};

/**
 * Validate variables against template requirements
 * @param {Object} variables - Variables to validate
 * @returns {Object} - Validation result with isValid flag and errors array
 */
notificationTemplateSchema.methods.validateVariables = function(variables = {}) {
  const errors = [];
  
  // Check for required variables
  for (const variable of this.variables) {
    if (variable.required && variables[variable.name] === undefined) {
      errors.push(`Required variable '${variable.name}' is missing`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Create a new version of this template
 * @param {Object} updates - Updates to apply to the new version
 * @returns {Promise<Object>} - New template version
 */
notificationTemplateSchema.methods.createNewVersion = async function(updates = {}) {
  // Create a new template document
  const newTemplate = new this.constructor({
    ...this.toObject(),
    _id: undefined, // Let MongoDB generate a new ID
    version: this.version + 1,
    previousVersion: this._id,
    createdAt: undefined,
    updatedAt: undefined,
    ...updates
  });
  
  await newTemplate.save();
  return newTemplate;
};

/**
 * Static method to find template by name and version
 * @param {String} name - Template name
 * @param {Number} version - Template version (optional, defaults to latest)
 * @returns {Promise<Object>} - Template document
 */
notificationTemplateSchema.statics.findByNameAndVersion = async function(name, version) {
  if (version) {
    return this.findOne({ name, version });
  }
  
  // Find the latest version
  return this.findOne({ name, isActive: true }).sort({ version: -1 });
};

const NotificationTemplate = mongoose.model('NotificationTemplate', notificationTemplateSchema);

module.exports = NotificationTemplate;