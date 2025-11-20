const { validationResult } = require('express-validator');
const crypto = require('crypto');
const authService = require('../services/authService');
const userService = require('../services/userService');
const responseHandler = require('../utils/responseHandler');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseHandler.badRequest(res, 'Validation error', errors.array());
  }

  const { firstName, lastName, email, password, role, phoneNumber, address } = req.body;

  try {
    // Check if user already exists
    const userExists = await userService.userExistsByEmail(email);

    if (userExists) {
      return responseHandler.badRequest(res, 'User already exists');
    }

    // Create user
    const userData = {
      firstName,
      lastName,
      email,
      password,
      role: role || 'farmer',
      phoneNumber,
      address
    };

    const result = await authService.registerUser(userData);
    return responseHandler.success(res, 201, {
      token: result.token,
      user: result.user
    }, 'User registered successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error registering user', error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseHandler.badRequest(res, 'Validation error', errors.array());
  }

  const { email, password } = req.body;

  try {
    // Authenticate user
    const result = await authService.loginUser(email, password);

    if (!result) {
      return responseHandler.unauthorized(res, 'Invalid credentials');
    }

    return responseHandler.success(res, 200, {
      token: result.token,
      user: result.user
    }, 'Login successful');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error logging in', error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await userService.getUserById(req.user.id);

    if (!user) {
      return responseHandler.notFound(res, 'User not found');
    }

    return responseHandler.success(res, 200, user, 'User profile retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving user profile', error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const resetToken = await authService.generatePasswordResetToken(req.body.email);

    if (!resetToken) {
      return responseHandler.notFound(res, 'No user with that email');
    }

    // In a real application, you would send an email with the reset token
    // For now, we'll just return it in the response
    return responseHandler.success(res, 200, { resetToken }, 'Password reset token generated');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error generating reset token', error);
  }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const result = await authService.resetPassword(req.params.resettoken, req.body.password);

    if (!result) {
      return responseHandler.badRequest(res, 'Invalid or expired token');
    }

    return responseHandler.success(res, 200, {
      token: result.token
    }, 'Password reset successful');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error resetting password', error);
  }
};