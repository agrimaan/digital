
/**
 * Admin User Management Routes
 * 
 * Routes for admin-specific user management functionality
 */

const express = require('express');
const { check } = require('express-validator');
const adminUserController = require('../controllers/adminUserController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require admin authentication
router.use(protect, authorize('admin', 'super-admin'));

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with pagination (admin only)
 * @access  Private/Admin
 */
router.get(
  '/',
  [
    check('page', 'Page must be a number').optional().isInt({ min: 1 }),
    check('limit', 'Limit must be a number').optional().isInt({ min: 1, max: 100 }),
    check('search', 'Search must be a string').optional().isString(),
    check('role', 'Role must be valid').optional().isIn(['admin', 'farmer', 'buyer', 'agronomist', 'investor'])
  ],
  adminUserController.getAllUsers
);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get user by ID (admin only)
 * @access  Private/Admin
 */
router.get('/:id', adminUserController.getUserById);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user (admin only)
 * @access  Private/Admin
 */
router.delete('/:id', adminUserController.deleteUser);

/**
 * @route   GET /api/admin/users/recent
 * @desc    Get recent users (admin only)
 * @access  Private/Admin
 */
router.get('/recent', adminUserController.getRecentUsers);

/**
 * @route   GET /api/admin/users/search
 * @desc    Search users (admin only)
 * @access  Private/Admin
 */
router.get('/search', adminUserController.searchUsers);


   /**
    * @route   POST /api/admin/users
    * @desc    Create new user (admin only)
    * @access  Private/Admin
    */
   router.post('/', adminUserController.createUser);

   /**
    * @route   PUT /api/admin/users/:id
    * @desc    Update user (admin only)
    * @access  Private/Admin
    */
   router.put('/:id', adminUserController.updateUser);


   module.exports = router;
