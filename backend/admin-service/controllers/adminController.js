const adminService = require('../services/adminService');
const responseHandler = require('../utils/responseHandler');
const { validationResult } = require('express-validator');

/**
 * @desc    Register a new admin
 * @route   POST /api/admins/register
 * @access  Private/SuperAdmin
 */
exports.registerAdmin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return responseHandler.badRequest(res, 'Validation error', errors.array());
    }

    const adminData = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      password: req.body.password,
      role: req.body.role || 'admin',
      permissions: req.body.permissions
    };

    const creatorData = {
      id: req.admin.id,
      name: req.admin.name,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    };

    const admin = await adminService.registerAdmin(adminData, creatorData);

    return responseHandler.success(
      res,
      201,
      { admin },
      'Admin registered successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Login admin
 * @route   POST /api/admins/login
 * @access  Public
 */
exports.loginAdmin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return responseHandler.badRequest(res, 'Validation error', errors.array());
    }

    const { email, password } = req.body;
    const requestData = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    };

    const { admin, token } = await adminService.loginAdmin(email, password, requestData);

    return responseHandler.success(
      res,
      200,
      { admin, token },
      'Admin logged in successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 401, error.message);
  }
};

/**
 * @desc    Get current admin profile
 * @route   GET /api/admins/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
  try {
    const admin = await adminService.getAdminById(req.admin.id);

    return responseHandler.success(
      res,
      200,
      { admin },
      'Admin profile retrieved successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Get all admins
 * @route   GET /api/admins
 * @access  Private/SuperAdmin
 */
exports.getAllAdmins = async (req, res) => {
  try {
    const { page, limit, role, active } = req.query;
    
    const filter = {};
    if (role) filter.role = role;
    if (active !== undefined) filter.active = active === 'true';
    
    const options = {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10
    };
    
    const result = await adminService.getAllAdmins(filter, options);

    return responseHandler.success(
      res,
      200,
      result,
      'Admins retrieved successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Get admin by ID
 * @route   GET /api/admins/:id
 * @access  Private/SuperAdmin
 */
exports.getAdminById = async (req, res) => {
  try {
    const admin = await adminService.getAdminById(req.params.id);
    console.log("admin object within getAdminById:" & admin);

    return responseHandler.success(
      res,
      200,
      { admin },
      'Admin retrieved successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Update admin
 * @route   PUT /api/admins/:id
 * @access  Private/SuperAdmin
 */
exports.updateAdmin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return responseHandler.badRequest(res, 'Validation error', errors.array());
    }

    const updateData = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      role: req.body.role
    };

    const updaterData = {
      id: req.admin.id,
      name: req.admin.name,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    };

    const admin = await adminService.updateAdmin(req.params.id, updateData, updaterData);

    return responseHandler.success(
      res,
      200,
      { admin },
      'Admin updated successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Delete admin
 * @route   DELETE /api/admins/:id
 * @access  Private/SuperAdmin
 */
exports.deleteAdmin = async (req, res) => {
  try {
    const deleterData = {
      id: req.admin.id,
      name: req.admin.name,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    };

    const admin = await adminService.deleteAdmin(req.params.id, deleterData);

    return responseHandler.success(
      res,
      200,
      { admin },
      'Admin deleted successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Update admin permissions
 * @route   PUT /api/admins/:id/permissions
 * @access  Private/SuperAdmin
 */
exports.updateAdminPermissions = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return responseHandler.badRequest(res, 'Validation error', errors.array());
    }

    const { permissions } = req.body;

    const updaterData = {
      id: req.admin.id,
      name: req.admin.name,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    };

    const admin = await adminService.updateAdminPermissions(req.params.id, permissions, updaterData);

    return responseHandler.success(
      res,
      200,
      { admin },
      'Admin permissions updated successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Activate or deactivate admin
 * @route   PUT /api/admins/:id/status
 * @access  Private/SuperAdmin
 */
exports.setAdminActiveStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return responseHandler.badRequest(res, 'Validation error', errors.array());
    }

    const { active } = req.body;

    const updaterData = {
      id: req.admin.id,
      name: req.admin.name,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    };

    const admin = await adminService.setAdminActiveStatus(req.params.id, active, updaterData);

    return responseHandler.success(
      res,
      200,
      { admin },
      active ? 'Admin activated successfully' : 'Admin deactivated successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Change admin password
 * @route   POST /api/admins/change-password
 * @access  Private
 */
exports.changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return responseHandler.badRequest(res, 'Validation error', errors.array());
    }

    const { currentPassword, newPassword } = req.body;

    const result = await adminService.changePassword(req.admin.id, currentPassword, newPassword);

    return responseHandler.success(
      res,
      200,
      result,
      'Password changed successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Forgot password
 * @route   POST /api/admins/forgot-password
 * @access  Public
 */
exports.forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return responseHandler.badRequest(res, 'Validation error', errors.array());
    }

    const { email } = req.body;

    const resetToken = await adminService.forgotPassword(email);

    // In a real implementation, you would send an email with the reset token
    // For this example, we'll just return it in the response
    return responseHandler.success(
      res,
      200,
      { resetToken },
      'Password reset token generated'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Reset password
 * @route   POST /api/admins/reset-password
 * @access  Public
 */
exports.resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return responseHandler.badRequest(res, 'Validation error', errors.array());
    }

    const { resetToken, password } = req.body;

    const result = await adminService.resetPassword(resetToken, password);

    return responseHandler.success(
      res,
      200,
      result,
      'Password reset successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Get admin activity logs
 * @route   GET /api/admins/:id/activity
 * @access  Private/SuperAdmin
 */
exports.getAdminActivityLogs = async (req, res) => {
  try {
    const { page, limit } = req.query;
    
    const options = {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20
    };
    
    const result = await adminService.getAdminActivityLogs(req.params.id, options);

    return responseHandler.success(
      res,
      200,
      result,
      'Admin activity logs retrieved successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};