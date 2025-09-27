const systemSettingsService = require('../services/systemSettingsService');
const responseHandler = require('../utils/responseHandler');
const { validationResult } = require('express-validator');

/**
 * @desc    Get system settings
 * @route   GET /api/settings
 * @access  Private/Admin
 */
exports.getSystemSettings = async (req, res) => {
  try {
    const settings = await systemSettingsService.getSystemSettings();

    return responseHandler.success(
      res,
      200,
      { settings },
      'System settings retrieved successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Update system settings
 * @route   PUT /api/settings
 * @access  Private/SuperAdmin
 */
exports.updateSystemSettings = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return responseHandler.badRequest(res, 'Validation error', errors.array());
    }

    const updateData = {
      siteName: req.body.siteName,
      siteDescription: req.body.siteDescription,
      logo: req.body.logo,
      favicon: req.body.favicon,
      theme: req.body.theme,
      contact: req.body.contact,
      social: req.body.social
    };

    const adminData = {
      id: req.admin.id,
      name: req.admin.name,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    };

    const settings = await systemSettingsService.updateSystemSettings(updateData, adminData);

    return responseHandler.success(
      res,
      200,
      { settings },
      'System settings updated successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Update email settings
 * @route   PUT /api/settings/email
 * @access  Private/SuperAdmin
 */
exports.updateEmailSettings = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return responseHandler.badRequest(res, 'Validation error', errors.array());
    }

    const emailSettings = {
      smtpHost: req.body.smtpHost,
      smtpPort: req.body.smtpPort,
      smtpUser: req.body.smtpUser,
      smtpPass: req.body.smtpPass,
      fromEmail: req.body.fromEmail,
      fromName: req.body.fromName
    };

    const adminData = {
      id: req.admin.id,
      name: req.admin.name,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    };

    const settings = await systemSettingsService.updateEmailSettings(emailSettings, adminData);

    return responseHandler.success(
      res,
      200,
      { settings },
      'Email settings updated successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Update SMS settings
 * @route   PUT /api/settings/sms
 * @access  Private/SuperAdmin
 */
exports.updateSmsSettings = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return responseHandler.badRequest(res, 'Validation error', errors.array());
    }

    const smsSettings = {
      provider: req.body.provider,
      apiKey: req.body.apiKey,
      apiSecret: req.body.apiSecret,
      fromNumber: req.body.fromNumber
    };

    const adminData = {
      id: req.admin.id,
      name: req.admin.name,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    };

    const settings = await systemSettingsService.updateSmsSettings(smsSettings, adminData);

    return responseHandler.success(
      res,
      200,
      { settings },
      'SMS settings updated successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Update payment settings
 * @route   PUT /api/settings/payment
 * @access  Private/SuperAdmin
 */
exports.updatePaymentSettings = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return responseHandler.badRequest(res, 'Validation error', errors.array());
    }

    const paymentSettings = {
      currency: req.body.currency,
      providers: req.body.providers
    };

    const adminData = {
      id: req.admin.id,
      name: req.admin.name,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    };

    const settings = await systemSettingsService.updatePaymentSettings(paymentSettings, adminData);

    return responseHandler.success(
      res,
      200,
      { settings },
      'Payment settings updated successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Update security settings
 * @route   PUT /api/settings/security
 * @access  Private/SuperAdmin
 */
exports.updateSecuritySettings = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return responseHandler.badRequest(res, 'Validation error', errors.array());
    }

    const securitySettings = {
      maxLoginAttempts: req.body.maxLoginAttempts,
      lockoutTime: req.body.lockoutTime,
      passwordPolicy: req.body.passwordPolicy,
      twoFactorAuth: req.body.twoFactorAuth
    };

    const adminData = {
      id: req.admin.id,
      name: req.admin.name,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    };

    const settings = await systemSettingsService.updateSecuritySettings(securitySettings, adminData);

    return responseHandler.success(
      res,
      200,
      { settings },
      'Security settings updated successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Update maintenance mode settings
 * @route   PUT /api/settings/maintenance
 * @access  Private/SuperAdmin
 */
exports.updateMaintenanceMode = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return responseHandler.badRequest(res, 'Validation error', errors.array());
    }

    const maintenanceSettings = {
      maintenanceMode: req.body.maintenanceMode,
      maintenanceMessage: req.body.maintenanceMessage,
      plannedStartTime: req.body.plannedStartTime,
      plannedEndTime: req.body.plannedEndTime
    };

    const adminData = {
      id: req.admin.id,
      name: req.admin.name,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    };

    const settings = await systemSettingsService.updateMaintenanceMode(maintenanceSettings, adminData);

    return responseHandler.success(
      res,
      200,
      { settings },
      'Maintenance mode settings updated successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Update API settings
 * @route   PUT /api/settings/api
 * @access  Private/SuperAdmin
 */
exports.updateApiSettings = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return responseHandler.badRequest(res, 'Validation error', errors.array());
    }

    const apiSettings = {
      rateLimit: req.body.rateLimit,
      corsOrigins: req.body.corsOrigins
    };

    const adminData = {
      id: req.admin.id,
      name: req.admin.name,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    };

    const settings = await systemSettingsService.updateApiSettings(apiSettings, adminData);

    return responseHandler.success(
      res,
      200,
      { settings },
      'API settings updated successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Test email configuration
 * @route   POST /api/settings/test-email
 * @access  Private/SuperAdmin
 */
exports.testEmailConfiguration = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return responseHandler.badRequest(res, 'Validation error', errors.array());
    }

    const emailConfig = {
      smtpHost: req.body.smtpHost,
      smtpPort: req.body.smtpPort,
      smtpUser: req.body.smtpUser,
      smtpPass: req.body.smtpPass
    };

    const result = await systemSettingsService.testEmailConfiguration(emailConfig);

    if (result.success) {
      return responseHandler.success(
        res,
        200,
        result,
        'Email configuration test successful'
      );
    } else {
      return responseHandler.error(
        res,
        400,
        'Email configuration test failed',
        { error: result.error }
      );
    }
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Test SMS configuration
 * @route   POST /api/settings/test-sms
 * @access  Private/SuperAdmin
 */
exports.testSmsConfiguration = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return responseHandler.badRequest(res, 'Validation error', errors.array());
    }

    const smsConfig = {
      provider: req.body.provider,
      apiKey: req.body.apiKey,
      apiSecret: req.body.apiSecret,
      fromNumber: req.body.fromNumber
    };

    const result = await systemSettingsService.testSmsConfiguration(smsConfig);

    if (result.success) {
      return responseHandler.success(
        res,
        200,
        result,
        'SMS configuration test successful'
      );
    } else {
      return responseHandler.error(
        res,
        400,
        'SMS configuration test failed',
        { error: result.error }
      );
    }
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};