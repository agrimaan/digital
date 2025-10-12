const { validationResult } = require('express-validator');
const userService = require('../services/userService');
const responseHandler = require('../utils/responseHandler');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    
    return responseHandler.success(res, 200, users, 'Users retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving users', error);
  }
};

/**
   * Get recent users for admin dashboard
   * @param {number} limit - Number of users to return
   * @returns {Promise<Array>} Recent users
   */
exports.getRecentUsers = async (req, res) => {
  try {
    const users = await userService.getRecentUsers(req.query.limit);
    
    return responseHandler.success(res, 200, users, 'Recent Users retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving recent users', error);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
exports.getUser = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    
    if (!user) {
      return responseHandler.notFound(res, 'User not found');
    }

    // Check if user is requesting their own profile or is an admin
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to access this user profile');
    }

    return responseHandler.success(res, 200, user, 'User retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving user', error);
  }
};

// @desc    Create user
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseHandler.badRequest(res, 'Validation error', errors.array());
  }

  try {
    // Check if user already exists
    const userExists = await userService.userExistsByEmail(req.body.email);
    
    if (userExists) {
      return responseHandler.badRequest(res, 'User with this email already exists');
    }

    // Create user
    const user = await userService.createUser(req.body);
    
    return responseHandler.success(res, 201, {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role
    }, 'User created successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error creating user', error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
exports.updateUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseHandler.badRequest(res, 'Validation error', errors.array());
  }

  try {
    let user = await userService.getUserById(req.params.id);
    
    if (!user) {
      return responseHandler.notFound(res, 'User not found');
    }

    // Check if user is updating their own profile or is an admin
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to update this user profile');
    }

    // Remove password from update fields if it exists
    if (req.body.password) {
      delete req.body.password;
    }

    // Update user
    user = await userService.updateUser(req.params.id, req.body);
    
    return responseHandler.success(res, 200, user, 'User updated successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error updating user', error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    
    if (!user) {
      return responseHandler.notFound(res, 'User not found');
    }

    // Only admin can delete users
    if (req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to delete users');
    }

    await userService.deleteUser(req.params.id);
    
    return responseHandler.success(res, 200, {}, 'User deleted successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error deleting user', error);
  }
};