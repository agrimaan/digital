const express = require('express');
const { check } = require('express-validator');
const adminController = require('../controllers/adminController');
const { protect, authorize, logAction } = require('@agrimaan/shared').middleware;

const router = express.Router();

// Public routes
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  adminController.loginAdmin
);

router.post(
  '/forgot-password',
  [
    check('email', 'Please include a valid email').isEmail()
  ],
  adminController.forgotPassword
);

router.post(
  '/reset-password',
  [
    check('resetToken', 'Reset token is required').not().isEmpty(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
  ],
  adminController.resetPassword
);

// Protected routes
router.use(protect);
router.get('/me', protect, authorize('superadmin', 'admin'), adminController.getMe);


router.post(
  '/change-password',
  [
    check('currentPassword', 'Current password is required').not().isEmpty(),
    check('newPassword', 'New password must be at least 6 characters').isLength({ min: 6 })
  ],
  adminController.changePassword
);

// Admin/SuperAdmin only routes
router.use(authorize('admin', 'super-admin'));

router.get('/', adminController.getAllAdmins);

router.get('/:id', adminController.getAdminById);

router.get('/:id/activity', adminController.getAdminActivityLogs);

// SuperAdmin only routes
router.use(authorize('super-admin'));

router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
    check('role', 'Role must be valid').optional().isIn(['super-admin', 'admin', 'moderator', 'support'])
  ],
  logAction('create', 'admin'),
  adminController.registerAdmin
);

router.put(
  '/:id',
  [
    check('name', 'Name is required').optional(),
    check('email', 'Please include a valid email').optional().isEmail(),
    check('role', 'Role must be valid').optional().isIn(['super-admin', 'admin', 'moderator', 'support'])
  ],
  logAction('update', 'admin'),
  adminController.updateAdmin
);

router.delete('/:id', logAction('delete', 'admin'), adminController.deleteAdmin);

router.put(
  '/:id/permissions',
  [
    check('permissions', 'Permissions are required').not().isEmpty()
  ],
  logAction('update', 'admin'),
  adminController.updateAdminPermissions
);

router.put(
  '/:id/status',
  [
    check('active', 'Active status must be a boolean').isBoolean()
  ],
  logAction('update', 'admin'),
  adminController.setAdminActiveStatus
);

module.exports = router;