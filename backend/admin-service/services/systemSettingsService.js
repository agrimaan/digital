const axios = require('axios');

// Service URLs with fallbacks
const USER_SVC = process.env.USER_SERVICE_URL || 'http://localhost:3002';
const ANALYTICS_SVC = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3009';
const NOTIFICATION_SVC = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3010';

// Helper function for HTTP requests
const httpRequest = async (serviceUrl, endpoint, method = 'GET', data = null, headers = {}) => {
  try {
    const config = {
      method,
      url: `${serviceUrl}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: 8000
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`HTTP request failed: ${method} ${serviceUrl}${endpoint}`, error.message);
    // Return fallback data instead of throwing
    return { 
      success: false, 
      error: error.message,
      data: null 
    };
  }
};

/**
 * Get system settings from configuration service
 * @returns {Object} System settings
 */
exports.getSystemSettings = async () => {
  try {
    // Get settings from user service (which should handle system configuration)
    const response = await httpRequest(USER_SVC, '/api/admin/settings');
    
    if (response.success === false) {
      // Return default settings if service is unavailable
      return getDefaultSettings();
    }

    return response.data || response;
  } catch (error) {
    console.error('Get system settings error:', error);
    return getDefaultSettings();
  }
};

/**
 * Update system settings
 * @param {Object} updateData - Settings data to update
 * @param {Object} adminData - Admin data for audit logging
 * @returns {Object} Updated settings
 */
exports.updateSystemSettings = async (updateData, adminData) => {
  try {
    const { token, id: adminId, name: adminName, ipAddress, userAgent } = adminData;

    // Get current settings for comparison
    const currentSettings = await exports.getSystemSettings();

    // Update settings via user service
    const updateResponse = await httpRequest(
      USER_SVC,
      '/api/admin/settings',
      'PUT',
      updateData,
      { Authorization: `Bearer ${token}` }
    );

    if (updateResponse.success === false) {
      throw new Error(updateResponse.error || 'Failed to update settings');
    }

    const updatedSettings = updateResponse.data || updateResponse;

    // Log the action via admin service
    try {
      await httpRequest(
        USER_SVC,
        '/api/admin/audit-logs',
        'POST',
        {
          adminId: adminId,
          adminName: adminName,
          action: 'update',
          resourceType: 'settings',
          resourceId: 'system-settings',
          description: `Updated system settings: ${Object.keys(updateData).join(', ')}`,
          status: 'success',
          ipAddress: ipAddress,
          userAgent: userAgent
        },
        { Authorization: `Bearer ${token}` }
      );
    } catch (auditError) {
      console.error('Audit log creation failed:', auditError);
      // Continue without audit log if service is unavailable
    }

    return updatedSettings;
  } catch (error) {
    console.error('Update system settings error:', error);
    throw new Error(`Failed to update system settings: ${error.message}`);
  }
};

/**
 * Get system configuration
 * @returns {Object} System configuration
 */
exports.getSystemConfiguration = async () => {
  try {
    // Collect configuration from multiple services
    const [
      userConfig,
      notificationConfig,
      analyticsConfig
    ] = await Promise.all([
      httpRequest(USER_SVC, '/api/admin/configuration'),
      httpRequest(NOTIFICATION_SVC, '/api/admin/configuration'),
      httpRequest(ANALYTICS_SVC, '/api/admin/configuration')
    ]);

    // Compile comprehensive configuration
    const configuration = {
      system: {
        name: 'Agrimaan Admin System',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      user: userConfig.data || userConfig,
      notifications: notificationConfig.data || notificationConfig,
      analytics: analyticsConfig.data || analyticsConfig,
      features: {
        userManagement: true,
        fieldManagement: true,
        cropManagement: true,
        orderManagement: true,
        sensorManagement: true,
        analytics: true,
        reporting: true,
        notifications: true
      },
      limits: {
        maxUsers: 10000,
        maxFieldsPerUser: 100,
        maxCropsPerField: 50,
        maxOrdersPerUser: 1000,
        maxSensorsPerField: 20
      }
    };

    return configuration;
  } catch (error) {
    console.error('Get system configuration error:', error);
    return getDefaultConfiguration();
  }
};

/**
 * Reset system settings to defaults
 * @param {Object} adminData - Admin data for audit logging
 * @returns {Object} Reset result
 */
exports.resetSystemSettings = async (adminData) => {
  try {
    const { token, id: adminId, name: adminName, ipAddress, userAgent } = adminData;

    // Reset to default settings
    const defaultSettings = getDefaultSettings();
    
    const resetResponse = await httpRequest(
      USER_SVC,
      '/api/admin/settings/reset',
      'POST',
      { resetToDefaults: true },
      { Authorization: `Bearer ${token}` }
    );

    if (resetResponse.success === false) {
      throw new Error(resetResponse.error || 'Failed to reset settings');
    }

    // Log the action
    try {
      await httpRequest(
        USER_SVC,
        '/api/admin/audit-logs',
        'POST',
        {
          adminId: adminId,
          adminName: adminName,
          action: 'reset',
          resourceType: 'settings',
          resourceId: 'system-settings',
          description: 'Reset system settings to defaults',
          status: 'success',
          ipAddress: ipAddress,
          userAgent: userAgent
        },
        { Authorization: `Bearer ${token}` }
      );
    } catch (auditError) {
      console.error('Audit log creation failed:', auditError);
    }

    return resetResponse.data || resetResponse;
  } catch (error) {
    console.error('Reset system settings error:', error);
    throw new Error(`Failed to reset system settings: ${error.message}`);
  }
};

/**
 * Validate system settings
 * @param {Object} settings - Settings to validate
 * @returns {Object} Validation result
 */
exports.validateSystemSettings = async (settings) => {
  try {
    // Basic validation
    const errors = [];
    const warnings = [];

    // Validate site settings
    if (settings.siteName && settings.siteName.length > 100) {
      errors.push('Site name must be less than 100 characters');
    }

    if (settings.siteDescription && settings.siteDescription.length > 500) {
      warnings.push('Site description is quite long');
    }

    // Validate email settings
    if (settings.emailSettings) {
      if (settings.emailSettings.smtpHost && !settings.emailSettings.smtpHost.includes('.')) {
        errors.push('SMTP host must be a valid domain');
      }

      if (settings.emailSettings.smtpPort && (settings.emailSettings.smtpPort < 1 || settings.emailSettings.smtpPort > 65535)) {
        errors.push('SMTP port must be between 1 and 65535');
      }
    }

    // Validate security settings
    if (settings.securitySettings) {
      if (settings.securitySettings.sessionTimeout && settings.securitySettings.sessionTimeout < 300) {
        warnings.push('Session timeout is very short (less than 5 minutes)');
      }

      if (settings.securitySettings.passwordPolicy) {
        if (settings.securitySettings.passwordPolicy.minLength < 8) {
          warnings.push('Minimum password length is less than 8 characters');
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      settings: settings
    };
  } catch (error) {
    console.error('Validate system settings error:', error);
    throw new Error(`Failed to validate system settings: ${error.message}`);
  }
};

/**
 * Get system health status
 * @returns {Object} Health status
 */
exports.getSystemHealth = async () => {
  try {
    // Check health of all configuration-related services
    const healthChecks = await Promise.all([
      httpRequest(USER_SVC, '/health'),
      httpRequest(NOTIFICATION_SVC, '/health'),
      httpRequest(ANALYTICS_SVC, '/health')
    ]);

    const services = healthChecks.map((check, index) => ({
      service: ['user-service', 'notification-service', 'analytics-service'][index],
      status: check.status === 'UP' ? 'healthy' : 'unhealthy',
      responseTime: check.responseTime || 'unknown',
      lastChecked: new Date()
    }));

    const overallHealth = services.every(service => service.status === 'healthy') ? 'healthy' : 'degraded';

    return {
      status: overallHealth,
      services: services,
      configuration: {
        totalSettings: Object.keys(await exports.getSystemSettings()).length,
        lastUpdated: new Date()
      }
    };
  } catch (error) {
    console.error('Get system health error:', error);
    return {
      status: 'unhealthy',
      error: error.message,
      services: []
    };
  }
};

// Helper functions for default data
function getDefaultSettings() {
  return {
    siteName: 'Agrimaan Admin Dashboard',
    siteDescription: 'Comprehensive agricultural management system',
    siteLogo: '/assets/logo.png',
    contactEmail: 'admin@agrimaan.com',
    contactPhone: '+1-555-0123',
    timezone: 'UTC',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm:ss',
    language: 'en',
    emailSettings: {
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      smtpSecure: false,
      fromEmail: 'noreply@agrimaan.com',
      fromName: 'Agrimaan System'
    },
    securitySettings: {
      sessionTimeout: 1800, // 30 minutes
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true
      },
      maxLoginAttempts: 5,
      lockoutDuration: 900 // 15 minutes
    },
    notificationSettings: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      digestFrequency: 'daily'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

function getDefaultConfiguration() {
  return {
    system: {
      name: 'Agrimaan Admin System',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    },
    features: {
      userManagement: true,
      fieldManagement: true,
      cropManagement: true,
      orderManagement: true,
      sensorManagement: true,
      analytics: true,
      reporting: true,
      notifications: true
    },
    limits: {
      maxUsers: 10000,
      maxFieldsPerUser: 100,
      maxCropsPerField: 50,
      maxOrdersPerUser: 1000,
      maxSensorsPerField: 20
    }
  };
}
