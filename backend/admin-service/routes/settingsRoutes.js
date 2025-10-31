const express = require('express');
const { check } = require('express-validator');
const settingsController = require('../controllers/settingsController');
const { protect, authorize, logAction, checkPermission } = require('@agrimaan/shared').middleware;
//const { protect, authorize, logAction, checkPermission } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Admin access for viewing settings
router.use(authorize('admin', 'super-admin'));

// Get system settings
router.get('/', checkPermission('settings', 'view'), settingsController.getSystemSettings);

// SuperAdmin only for updating settings
router.use(authorize('super-admin'));

// Update system settings
router.put(
  '/',
  [
    check('siteName', 'Site name is required').optional(),
    check('siteDescription', 'Site description is required').optional(),
    check('logo', 'Logo must be a valid URL').optional().isURL(),
    check('favicon', 'Favicon must be a valid URL').optional().isURL(),
    check('theme', 'Theme must be an object').optional().isObject(),
    check('contact', 'Contact must be an object').optional().isObject(),
    check('social', 'Social must be an object').optional().isObject()
  ],
  logAction('update', 'settings'),
  settingsController.updateSystemSettings
);

// Update email settings
router.put(
  '/email',
  [
    check('smtpHost', 'SMTP host is required').not().isEmpty(),
    check('smtpPort', 'SMTP port must be a number').isNumeric(),
    check('smtpUser', 'SMTP user is required').not().isEmpty(),
    check('smtpPass', 'SMTP password is required').not().isEmpty(),
    check('fromEmail', 'From email is required').isEmail(),
    check('fromName', 'From name is required').not().isEmpty()
  ],
  logAction('update', 'settings'),
  settingsController.updateEmailSettings
);

// Update SMS settings
router.put(
  '/sms',
  [
    check('provider', 'Provider is required').isIn(['twilio', 'aws-sns', 'nexmo', 'none']),
    check('apiKey', 'API key is required').optional(),
    check('apiSecret', 'API secret is required').optional(),
    check('fromNumber', 'From number is required').optional()
  ],
  logAction('update', 'settings'),
  settingsController.updateSmsSettings
);

// Update payment settings
router.put(
  '/payment',
  [
    check('currency', 'Currency is required').not().isEmpty(),
    check('providers', 'Providers must be an object').isObject()
  ],
  logAction('update', 'settings'),
  settingsController.updatePaymentSettings
);

// Update security settings
router.put(
  '/security',
  [
    check('maxLoginAttempts', 'Max login attempts must be a number').optional().isNumeric(),
    check('lockoutTime', 'Lockout time must be a number').optional().isNumeric(),
    check('passwordPolicy', 'Password policy must be an object').optional().isObject(),
    check('twoFactorAuth', 'Two-factor auth must be an object').optional().isObject()
  ],
  logAction('update', 'settings'),
  settingsController.updateSecuritySettings
);

// Update maintenance mode
router.put(
  '/maintenance',
  [
    check('maintenanceMode', 'Maintenance mode must be a boolean').isBoolean(),
    check('maintenanceMessage', 'Maintenance message is required').optional(),
    check('plannedStartTime', 'Planned start time must be a valid date').optional().isISO8601(),
    check('plannedEndTime', 'Planned end time must be a valid date').optional().isISO8601()
  ],
  logAction('update', 'settings'),
  settingsController.updateMaintenanceMode
);

// Update API settings
router.put(
  '/api',
  [
    check('rateLimit', 'Rate limit must be an object').optional().isObject(),
    check('corsOrigins', 'CORS origins must be an array').optional().isArray()
  ],
  logAction('update', 'settings'),
  settingsController.updateApiSettings
);

// Test email configuration
router.post(
  '/test-email',
  [
    check('smtpHost', 'SMTP host is required').not().isEmpty(),
    check('smtpPort', 'SMTP port must be a number').isNumeric(),
    check('smtpUser', 'SMTP user is required').not().isEmpty(),
    check('smtpPass', 'SMTP password is required').not().isEmpty()
  ],
  settingsController.testEmailConfiguration
);

// Test SMS configuration
router.post(
  '/test-sms',
  [
    check('provider', 'Provider is required').isIn(['twilio', 'aws-sns', 'nexmo', 'none']),
    check('apiKey', 'API key is required').not().isEmpty(),
    check('apiSecret', 'API secret is required').not().isEmpty(),
    check('fromNumber', 'From number is required').not().isEmpty()
  ],
  settingsController.testSmsConfiguration
);

module.exports = router;