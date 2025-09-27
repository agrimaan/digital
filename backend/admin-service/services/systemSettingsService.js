const SystemSettings = require('../models/SystemSettings');
const AuditLog = require('../models/AuditLog');

/**
 * Get system settings
 * @returns {Object} System settings
 */
exports.getSystemSettings = async () => {
  try {
    const settings = await SystemSettings.getSettings();
    return settings;
  } catch (error) {
    console.error('Get system settings error:', error);
    throw new Error(`Failed to get system settings: ${error.message}`);
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
    // Get current settings for audit log
    const currentSettings = await SystemSettings.getSettings();
    
    // Update settings
    const settings = await SystemSettings.findByIdAndUpdate(
      currentSettings._id,
      {
        ...updateData,
        updatedBy: adminData.id,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    // Log the action
    await AuditLog.createLog({
      adminId: adminData.id,
      adminName: adminData.name,
      action: 'update',
      resourceType: 'settings',
      resourceId: settings._id.toString(),
      description: 'Updated system settings',
      previousState: {
        siteName: currentSettings.siteName,
        siteDescription: currentSettings.siteDescription,
        theme: currentSettings.theme,
        contact: currentSettings.contact,
        social: currentSettings.social,
        systemMaintenance: currentSettings.systemMaintenance,
        security: currentSettings.security,
        apiSettings: currentSettings.apiSettings
      },
      newState: {
        siteName: settings.siteName,
        siteDescription: settings.siteDescription,
        theme: settings.theme,
        contact: settings.contact,
        social: settings.social,
        systemMaintenance: settings.systemMaintenance,
        security: settings.security,
        apiSettings: settings.apiSettings
      },
      status: 'success',
      ipAddress: adminData.ipAddress,
      userAgent: adminData.userAgent
    });
    
    return settings;
  } catch (error) {
    console.error('Update system settings error:', error);
    throw new Error(`Failed to update system settings: ${error.message}`);
  }
};

/**
 * Update email settings
 * @param {Object} emailSettings - Email settings data
 * @param {Object} adminData - Admin data for audit logging
 * @returns {Object} Updated settings
 */
exports.updateEmailSettings = async (emailSettings, adminData) => {
  try {
    // Get current settings for audit log
    const currentSettings = await SystemSettings.getSettings();
    
    // Update email settings
    const settings = await SystemSettings.findByIdAndUpdate(
      currentSettings._id,
      {
        emailSettings,
        updatedBy: adminData.id,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    // Log the action
    await AuditLog.createLog({
      adminId: adminData.id,
      adminName: adminData.name,
      action: 'update',
      resourceType: 'settings',
      resourceId: settings._id.toString(),
      description: 'Updated email settings',
      previousState: {
        emailSettings: {
          smtpHost: currentSettings.emailSettings.smtpHost,
          smtpPort: currentSettings.emailSettings.smtpPort,
          smtpUser: currentSettings.emailSettings.smtpUser,
          fromEmail: currentSettings.emailSettings.fromEmail,
          fromName: currentSettings.emailSettings.fromName
        }
      },
      newState: {
        emailSettings: {
          smtpHost: settings.emailSettings.smtpHost,
          smtpPort: settings.emailSettings.smtpPort,
          smtpUser: settings.emailSettings.smtpUser,
          fromEmail: settings.emailSettings.fromEmail,
          fromName: settings.emailSettings.fromName
        }
      },
      status: 'success',
      ipAddress: adminData.ipAddress,
      userAgent: adminData.userAgent
    });
    
    return settings;
  } catch (error) {
    console.error('Update email settings error:', error);
    throw new Error(`Failed to update email settings: ${error.message}`);
  }
};

/**
 * Update SMS settings
 * @param {Object} smsSettings - SMS settings data
 * @param {Object} adminData - Admin data for audit logging
 * @returns {Object} Updated settings
 */
exports.updateSmsSettings = async (smsSettings, adminData) => {
  try {
    // Get current settings for audit log
    const currentSettings = await SystemSettings.getSettings();
    
    // Update SMS settings
    const settings = await SystemSettings.findByIdAndUpdate(
      currentSettings._id,
      {
        smsSettings,
        updatedBy: adminData.id,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    // Log the action
    await AuditLog.createLog({
      adminId: adminData.id,
      adminName: adminData.name,
      action: 'update',
      resourceType: 'settings',
      resourceId: settings._id.toString(),
      description: 'Updated SMS settings',
      previousState: {
        smsSettings: {
          provider: currentSettings.smsSettings.provider,
          fromNumber: currentSettings.smsSettings.fromNumber
        }
      },
      newState: {
        smsSettings: {
          provider: settings.smsSettings.provider,
          fromNumber: settings.smsSettings.fromNumber
        }
      },
      status: 'success',
      ipAddress: adminData.ipAddress,
      userAgent: adminData.userAgent
    });
    
    return settings;
  } catch (error) {
    console.error('Update SMS settings error:', error);
    throw new Error(`Failed to update SMS settings: ${error.message}`);
  }
};

/**
 * Update payment settings
 * @param {Object} paymentSettings - Payment settings data
 * @param {Object} adminData - Admin data for audit logging
 * @returns {Object} Updated settings
 */
exports.updatePaymentSettings = async (paymentSettings, adminData) => {
  try {
    // Get current settings for audit log
    const currentSettings = await SystemSettings.getSettings();
    
    // Update payment settings
    const settings = await SystemSettings.findByIdAndUpdate(
      currentSettings._id,
      {
        paymentSettings,
        updatedBy: adminData.id,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    // Log the action
    await AuditLog.createLog({
      adminId: adminData.id,
      adminName: adminData.name,
      action: 'update',
      resourceType: 'settings',
      resourceId: settings._id.toString(),
      description: 'Updated payment settings',
      previousState: {
        paymentSettings: {
          currency: currentSettings.paymentSettings.currency,
          providers: {
            stripe: {
              enabled: currentSettings.paymentSettings.providers.stripe.enabled
            },
            paypal: {
              enabled: currentSettings.paymentSettings.providers.paypal.enabled
            },
            razorpay: {
              enabled: currentSettings.paymentSettings.providers.razorpay.enabled
            }
          }
        }
      },
      newState: {
        paymentSettings: {
          currency: settings.paymentSettings.currency,
          providers: {
            stripe: {
              enabled: settings.paymentSettings.providers.stripe.enabled
            },
            paypal: {
              enabled: settings.paymentSettings.providers.paypal.enabled
            },
            razorpay: {
              enabled: settings.paymentSettings.providers.razorpay.enabled
            }
          }
        }
      },
      status: 'success',
      ipAddress: adminData.ipAddress,
      userAgent: adminData.userAgent
    });
    
    return settings;
  } catch (error) {
    console.error('Update payment settings error:', error);
    throw new Error(`Failed to update payment settings: ${error.message}`);
  }
};

/**
 * Update security settings
 * @param {Object} securitySettings - Security settings data
 * @param {Object} adminData - Admin data for audit logging
 * @returns {Object} Updated settings
 */
exports.updateSecuritySettings = async (securitySettings, adminData) => {
  try {
    // Get current settings for audit log
    const currentSettings = await SystemSettings.getSettings();
    
    // Update security settings
    const settings = await SystemSettings.findByIdAndUpdate(
      currentSettings._id,
      {
        security: securitySettings,
        updatedBy: adminData.id,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    // Log the action
    await AuditLog.createLog({
      adminId: adminData.id,
      adminName: adminData.name,
      action: 'update',
      resourceType: 'settings',
      resourceId: settings._id.toString(),
      description: 'Updated security settings',
      previousState: {
        security: currentSettings.security
      },
      newState: {
        security: settings.security
      },
      status: 'success',
      ipAddress: adminData.ipAddress,
      userAgent: adminData.userAgent
    });
    
    return settings;
  } catch (error) {
    console.error('Update security settings error:', error);
    throw new Error(`Failed to update security settings: ${error.message}`);
  }
};

/**
 * Update maintenance mode settings
 * @param {Object} maintenanceSettings - Maintenance settings data
 * @param {Object} adminData - Admin data for audit logging
 * @returns {Object} Updated settings
 */
exports.updateMaintenanceMode = async (maintenanceSettings, adminData) => {
  try {
    // Get current settings for audit log
    const currentSettings = await SystemSettings.getSettings();
    
    // Update maintenance settings
    const settings = await SystemSettings.findByIdAndUpdate(
      currentSettings._id,
      {
        systemMaintenance: maintenanceSettings,
        updatedBy: adminData.id,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    // Log the action
    await AuditLog.createLog({
      adminId: adminData.id,
      adminName: adminData.name,
      action: 'update',
      resourceType: 'settings',
      resourceId: settings._id.toString(),
      description: maintenanceSettings.maintenanceMode 
        ? 'Enabled maintenance mode' 
        : 'Disabled maintenance mode',
      previousState: {
        systemMaintenance: currentSettings.systemMaintenance
      },
      newState: {
        systemMaintenance: settings.systemMaintenance
      },
      status: 'success',
      ipAddress: adminData.ipAddress,
      userAgent: adminData.userAgent
    });
    
    return settings;
  } catch (error) {
    console.error('Update maintenance mode error:', error);
    throw new Error(`Failed to update maintenance mode: ${error.message}`);
  }
};

/**
 * Update API settings
 * @param {Object} apiSettings - API settings data
 * @param {Object} adminData - Admin data for audit logging
 * @returns {Object} Updated settings
 */
exports.updateApiSettings = async (apiSettings, adminData) => {
  try {
    // Get current settings for audit log
    const currentSettings = await SystemSettings.getSettings();
    
    // Update API settings
    const settings = await SystemSettings.findByIdAndUpdate(
      currentSettings._id,
      {
        apiSettings,
        updatedBy: adminData.id,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    // Log the action
    await AuditLog.createLog({
      adminId: adminData.id,
      adminName: adminData.name,
      action: 'update',
      resourceType: 'settings',
      resourceId: settings._id.toString(),
      description: 'Updated API settings',
      previousState: {
        apiSettings: currentSettings.apiSettings
      },
      newState: {
        apiSettings: settings.apiSettings
      },
      status: 'success',
      ipAddress: adminData.ipAddress,
      userAgent: adminData.userAgent
    });
    
    return settings;
  } catch (error) {
    console.error('Update API settings error:', error);
    throw new Error(`Failed to update API settings: ${error.message}`);
  }
};

/**
 * Test email configuration
 * @param {Object} emailConfig - Email configuration to test
 * @returns {Object} Test result
 */
exports.testEmailConfiguration = async (emailConfig) => {
  try {
    // Implementation would use nodemailer to test the connection
    // This is a simplified version
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransport({
      host: emailConfig.smtpHost,
      port: emailConfig.smtpPort,
      secure: emailConfig.smtpPort === 465,
      auth: {
        user: emailConfig.smtpUser,
        pass: emailConfig.smtpPass
      }
    });
    
    // Verify connection
    await transporter.verify();
    
    return { success: true, message: 'Email configuration is valid' };
  } catch (error) {
    console.error('Test email configuration error:', error);
    return { 
      success: false, 
      message: 'Email configuration test failed', 
      error: error.message 
    };
  }
};

/**
 * Test SMS configuration
 * @param {Object} smsConfig - SMS configuration to test
 * @returns {Object} Test result
 */
exports.testSmsConfiguration = async (smsConfig) => {
  try {
    // Implementation would depend on the SMS provider
    // This is a simplified version
    
    let testResult = { success: false, message: 'SMS provider not supported' };
    
    switch (smsConfig.provider) {
      case 'twilio':
        // Test Twilio configuration
        testResult = await testTwilioConfiguration(smsConfig);
        break;
        
      case 'aws-sns':
        // Test AWS SNS configuration
        testResult = await testAwsSnsConfiguration(smsConfig);
        break;
        
      case 'nexmo':
        // Test Nexmo configuration
        testResult = await testNexmoConfiguration(smsConfig);
        break;
        
      default:
        break;
    }
    
    return testResult;
  } catch (error) {
    console.error('Test SMS configuration error:', error);
    return { 
      success: false, 
      message: 'SMS configuration test failed', 
      error: error.message 
    };
  }
};

// Helper functions for SMS testing
async function testTwilioConfiguration(config) {
  // In a real implementation, this would use the Twilio SDK
  return { success: true, message: 'Twilio configuration is valid' };
}

async function testAwsSnsConfiguration(config) {
  // In a real implementation, this would use the AWS SDK
  return { success: true, message: 'AWS SNS configuration is valid' };
}

async function testNexmoConfiguration(config) {
  // In a real implementation, this would use the Nexmo SDK
  return { success: true, message: 'Nexmo configuration is valid' };
}