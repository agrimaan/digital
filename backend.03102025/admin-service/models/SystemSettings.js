const mongoose = require('mongoose');

const SystemSettingsSchema = new mongoose.Schema({
  siteName: {
    type: String,
    default: 'Agrimaan Platform'
  },
  siteDescription: {
    type: String,
    default: 'Agricultural Management and Analytics Network'
  },
  logo: {
    type: String,
    default: '/assets/images/logo.png'
  },
  favicon: {
    type: String,
    default: '/assets/images/favicon.ico'
  },
  theme: {
    primaryColor: {
      type: String,
      default: '#4CAF50'
    },
    secondaryColor: {
      type: String,
      default: '#8BC34A'
    },
    accentColor: {
      type: String,
      default: '#FF9800'
    },
    darkMode: {
      type: Boolean,
      default: false
    }
  },
  contact: {
    email: {
      type: String,
      default: 'contact@agrimaan.com'
    },
    phone: {
      type: String,
      default: '+1-123-456-7890'
    },
    address: {
      type: String,
      default: '123 Agriculture Street, Farm City, FC 12345'
    }
  },
  social: {
    facebook: {
      type: String,
      default: 'https://facebook.com/agrimaan'
    },
    twitter: {
      type: String,
      default: 'https://twitter.com/agrimaan'
    },
    instagram: {
      type: String,
      default: 'https://instagram.com/agrimaan'
    },
    linkedin: {
      type: String,
      default: 'https://linkedin.com/company/agrimaan'
    }
  },
  emailSettings: {
    smtpHost: {
      type: String,
      default: 'smtp.example.com'
    },
    smtpPort: {
      type: Number,
      default: 587
    },
    smtpUser: {
      type: String,
      default: 'noreply@agrimaan.com'
    },
    smtpPass: {
      type: String,
      default: '',
      select: false
    },
    fromEmail: {
      type: String,
      default: 'noreply@agrimaan.com'
    },
    fromName: {
      type: String,
      default: 'Agrimaan Platform'
    }
  },
  smsSettings: {
    provider: {
      type: String,
      enum: ['twilio', 'aws-sns', 'nexmo', 'none'],
      default: 'none'
    },
    apiKey: {
      type: String,
      default: '',
      select: false
    },
    apiSecret: {
      type: String,
      default: '',
      select: false
    },
    fromNumber: {
      type: String,
      default: ''
    }
  },
  paymentSettings: {
    currency: {
      type: String,
      default: 'USD'
    },
    providers: {
      stripe: {
        enabled: {
          type: Boolean,
          default: false
        },
        publicKey: {
          type: String,
          default: '',
          select: false
        },
        secretKey: {
          type: String,
          default: '',
          select: false
        }
      },
      paypal: {
        enabled: {
          type: Boolean,
          default: false
        },
        clientId: {
          type: String,
          default: '',
          select: false
        },
        clientSecret: {
          type: String,
          default: '',
          select: false
        }
      },
      razorpay: {
        enabled: {
          type: Boolean,
          default: false
        },
        keyId: {
          type: String,
          default: '',
          select: false
        },
        keySecret: {
          type: String,
          default: '',
          select: false
        }
      }
    }
  },
  systemMaintenance: {
    maintenanceMode: {
      type: Boolean,
      default: false
    },
    maintenanceMessage: {
      type: String,
      default: 'The system is currently undergoing scheduled maintenance. Please check back later.'
    },
    plannedStartTime: {
      type: Date
    },
    plannedEndTime: {
      type: Date
    }
  },
  security: {
    maxLoginAttempts: {
      type: Number,
      default: 5
    },
    lockoutTime: {
      type: Number,
      default: 15 // minutes
    },
    passwordPolicy: {
      minLength: {
        type: Number,
        default: 8
      },
      requireUppercase: {
        type: Boolean,
        default: true
      },
      requireLowercase: {
        type: Boolean,
        default: true
      },
      requireNumbers: {
        type: Boolean,
        default: true
      },
      requireSpecialChars: {
        type: Boolean,
        default: true
      },
      passwordExpiryDays: {
        type: Number,
        default: 90
      }
    },
    twoFactorAuth: {
      enabled: {
        type: Boolean,
        default: false
      },
      required: {
        type: Boolean,
        default: false
      }
    }
  },
  apiSettings: {
    rateLimit: {
      enabled: {
        type: Boolean,
        default: true
      },
      maxRequests: {
        type: Number,
        default: 100
      },
      timeWindow: {
        type: Number,
        default: 15 // minutes
      }
    },
    corsOrigins: {
      type: [String],
      default: ['*']
    }
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure there's only one settings document
SystemSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  
  if (!settings) {
    settings = await this.create({});
  }
  
  return settings;
};

module.exports = mongoose.model('SystemSettings', SystemSettingsSchema);