const Admin = require('../models/Admin');
const AuditLog = require('../models/AuditLog');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');

/**
 * Register a new admin
 * @param {Object} adminData - Admin data
 * @param {Object} creatorData - Creator admin data
 * @returns {Object} Registered admin
 */
exports.registerAdmin = async (adminData, creatorData = null) => {
  try {
    // Check if admin with this email already exists
    const existingAdmin = await Admin.findOne({ email: adminData.email });
    
    if (existingAdmin) {
      throw new Error('Admin with this email already exists');
    }
    
    // Create admin
    const admin = await Admin.create({
      ...adminData,
      createdBy: creatorData ? creatorData.id : null
    });
    
    // Log the action if creator data is provided
    if (creatorData) {
      await AuditLog.createLog({
        adminId: creatorData.id,
        adminName: creatorData.name,
        action: 'create',
        resourceType: 'admin',
        resourceId: admin._id.toString(),
        description: `Created new admin account for ${admin.name}`,
        status: 'success',
        ipAddress: creatorData.ipAddress,
        userAgent: creatorData.userAgent
      });
    }
    
    return admin;
  } catch (error) {
    console.error('Admin registration error:', error);
    throw new Error(`Failed to register admin: ${error.message}`);
  }
};

/**
 * Login admin
 * @param {string} email - Admin email
 * @param {string} password - Admin password
 * @param {Object} requestData - Request data for audit logging
 * @returns {Object} Admin data and token
 */
exports.loginAdmin = async (email, password, requestData = {}) => {
  try {
    // Find admin by email and include password field
    const admin = await Admin.findOne({ email }).select('+password');
    
    if (!admin) {
      throw new Error('Invalid credentials');
    }
    
    // Check if admin is active
    if (!admin.active) {
      throw new Error('This account has been deactivated. Please contact a super-admin.');
    }
    
    // Check if password matches
    const isMatch = await admin.matchPassword(password);
    
    if (!isMatch) {
      // Log failed login attempt
      await AuditLog.createLog({
        adminId: admin._id,
        adminName: admin.name,
        action: 'login',
        resourceType: 'admin',
        resourceId: admin._id.toString(),
        description: 'Failed login attempt',
        status: 'failure',
        ipAddress: requestData.ipAddress,
        userAgent: requestData.userAgent
      });
      
      throw new Error('Invalid credentials');
    }
    
    // Update last login time
    admin.lastLogin = Date.now();
    await admin.save();
    
    // Log successful login
    await AuditLog.createLog({
      adminId: admin._id,
      adminName: admin.name,
      action: 'login',
      resourceType: 'admin',
      resourceId: admin._id.toString(),
      description: 'Successful login',
      status: 'success',
      ipAddress: requestData.ipAddress,
      userAgent: requestData.userAgent
    });
    
    // Create token
    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN}
    );    
    // Remove password from response
    admin.password = undefined;
    
    return { admin, token };
  } catch (error) {
    console.error('Admin login error:', error);
    throw new Error(`Failed to login: ${error.message}`);
  }
};

/**
 * Get admin by ID
 * @param {string} id - Admin ID
 * @returns {Object} Admin data
 */
exports.getAdminById = async (id) => {
  try {
    const admin = await Admin.findById(id);
    
    if (!admin) {
      throw new Error('Admin not found');
    }
    
    return admin;
  } catch (error) {
    console.error('Get admin error:', error);
    throw new Error(`Failed to get admin: ${error.message}`);
  }
};

/**
 * Get all admins
 * @param {Object} filter - Filter criteria
 * @param {Object} options - Query options
 * @returns {Array} Admins
 */
exports.getAllAdmins = async (filter = {}, options = {}) => {
  try {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
    
    const admins = await Admin.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);
      
    const total = await Admin.countDocuments(filter);
    
    return {
      admins,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Get all admins error:', error);
    throw new Error(`Failed to get admins: ${error.message}`);
  }
};

/**
 * Update admin
 * @param {string} id - Admin ID
 * @param {Object} updateData - Data to update
 * @param {Object} updaterData - Updater admin data for audit logging
 * @returns {Object} Updated admin
 */
exports.updateAdmin = async (id, updateData, updaterData = null) => {
  try {
    // Get admin before update for audit log
    const adminBefore = await Admin.findById(id);
    
    if (!adminBefore) {
      throw new Error('Admin not found');
    }
    
    // If updating password, hash it
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }
    
    // Update admin
    const admin = await Admin.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });
    
    // Log the action if updater data is provided
    if (updaterData) {
      await AuditLog.createLog({
        adminId: updaterData.id,
        adminName: updaterData.name,
        action: 'update',
        resourceType: 'admin',
        resourceId: admin._id.toString(),
        description: `Updated admin account for ${admin.name}`,
        previousState: {
          name: adminBefore.name,
          email: adminBefore.email,
          role: adminBefore.role,
          active: adminBefore.active,
          permissions: adminBefore.permissions
        },
        newState: {
          name: admin.name,
          email: admin.email,
          role: admin.role,
          active: admin.active,
          permissions: admin.permissions
        },
        status: 'success',
        ipAddress: updaterData.ipAddress,
        userAgent: updaterData.userAgent
      });
    }
    
    return admin;
  } catch (error) {
    console.error('Update admin error:', error);
    throw new Error(`Failed to update admin: ${error.message}`);
  }
};

/**
 * Delete admin
 * @param {string} id - Admin ID
 * @param {Object} deleterData - Deleter admin data for audit logging
 * @returns {Object} Deleted admin
 */
exports.deleteAdmin = async (id, deleterData = null) => {
  try {
    const admin = await Admin.findById(id);
    
    if (!admin) {
      throw new Error('Admin not found');
    }
    
    // Super-admins cannot be deleted
    if (admin.role === 'super-admin') {
      throw new Error('Super-admin accounts cannot be deleted');
    }
    
    await admin.remove();
    
    // Log the action if deleter data is provided
    if (deleterData) {
      await AuditLog.createLog({
        adminId: deleterData.id,
        adminName: deleterData.name,
        action: 'delete',
        resourceType: 'admin',
        resourceId: id,
        description: `Deleted admin account for ${admin.name}`,
        previousState: {
          name: admin.name,
          email: admin.email,
          role: admin.role
        },
        status: 'success',
        ipAddress: deleterData.ipAddress,
        userAgent: deleterData.userAgent
      });
    }
    
    return admin;
  } catch (error) {
    console.error('Delete admin error:', error);
    throw new Error(`Failed to delete admin: ${error.message}`);
  }
};

/**
 * Update admin permissions
 * @param {string} id - Admin ID
 * @param {Object} permissions - Permissions to update
 * @param {Object} updaterData - Updater admin data for audit logging
 * @returns {Object} Updated admin
 */
exports.updateAdminPermissions = async (id, permissions, updaterData = null) => {
  try {
    // Get admin before update for audit log
    const adminBefore = await Admin.findById(id);
    
    if (!adminBefore) {
      throw new Error('Admin not found');
    }
    
    // Update permissions
    const admin = await Admin.findByIdAndUpdate(
      id,
      { permissions },
      { new: true, runValidators: true }
    );
    
    // Log the action if updater data is provided
    if (updaterData) {
      await AuditLog.createLog({
        adminId: updaterData.id,
        adminName: updaterData.name,
        action: 'update',
        resourceType: 'admin',
        resourceId: admin._id.toString(),
        description: `Updated permissions for admin ${admin.name}`,
        previousState: { permissions: adminBefore.permissions },
        newState: { permissions: admin.permissions },
        status: 'success',
        ipAddress: updaterData.ipAddress,
        userAgent: updaterData.userAgent
      });
    }
    
    return admin;
  } catch (error) {
    console.error('Update admin permissions error:', error);
    throw new Error(`Failed to update admin permissions: ${error.message}`);
  }
};

/**
 * Activate or deactivate admin
 * @param {string} id - Admin ID
 * @param {boolean} active - Active status
 * @param {Object} updaterData - Updater admin data for audit logging
 * @returns {Object} Updated admin
 */
exports.setAdminActiveStatus = async (id, active, updaterData = null) => {
  try {
    const admin = await Admin.findById(id);
    
    if (!admin) {
      throw new Error('Admin not found');
    }
    
    // Super-admins cannot be deactivated
    if (admin.role === 'super-admin' && !active) {
      throw new Error('Super-admin accounts cannot be deactivated');
    }
    
    admin.active = active;
    await admin.save();
    
    // Log the action if updater data is provided
    if (updaterData) {
      await AuditLog.createLog({
        adminId: updaterData.id,
        adminName: updaterData.name,
        action: 'update',
        resourceType: 'admin',
        resourceId: admin._id.toString(),
        description: active 
          ? `Activated admin account for ${admin.name}` 
          : `Deactivated admin account for ${admin.name}`,
        previousState: { active: !active },
        newState: { active },
        status: 'success',
        ipAddress: updaterData.ipAddress,
        userAgent: updaterData.userAgent
      });
    }
    
    return admin;
  } catch (error) {
    console.error('Set admin active status error:', error);
    throw new Error(`Failed to update admin status: ${error.message}`);
  }
};

/**
 * Change admin password
 * @param {string} id - Admin ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Object} Updated admin
 */
exports.changePassword = async (id, currentPassword, newPassword) => {
  try {
    // Get admin with password
    const admin = await Admin.findById(id).select('+password');
    
    if (!admin) {
      throw new Error('Admin not found');
    }
    
    // Check if current password matches
    const isMatch = await admin.matchPassword(currentPassword);
    
    if (!isMatch) {
      throw new Error('Current password is incorrect');
    }
    
    // Update password
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);
    admin.updatedAt = Date.now();
    
    await admin.save();
    
    // Log the action
    await AuditLog.createLog({
      adminId: admin._id,
      adminName: admin.name,
      action: 'update',
      resourceType: 'admin',
      resourceId: admin._id.toString(),
      description: 'Changed password',
      status: 'success'
    });
    
    return { success: true };
  } catch (error) {
    console.error('Change password error:', error);
    throw new Error(`Failed to change password: ${error.message}`);
  }
};

/**
 * Forgot password - generate reset token
 * @param {string} email - Admin email
 * @returns {string} Reset token
 */
exports.forgotPassword = async (email) => {
  try {
    const admin = await Admin.findOne({ email });
    
    if (!admin) {
      throw new Error('No admin found with that email');
    }
    
    // Generate reset token
    const resetToken = admin.getResetPasswordToken();
    
    await admin.save({ validateBeforeSave: false });
    
    return resetToken;
  } catch (error) {
    console.error('Forgot password error:', error);
    throw new Error(`Failed to process forgot password: ${error.message}`);
  }
};

/**
 * Reset password
 * @param {string} resetToken - Reset token
 * @param {string} password - New password
 * @returns {Object} Updated admin
 */
exports.resetPassword = async (resetToken, password) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    const admin = await Admin.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!admin) {
      throw new Error('Invalid or expired token');
    }
    
    // Set new password
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(password, salt);
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpire = undefined;
    admin.updatedAt = Date.now();
    
    await admin.save();
    
    // Log the action
    await AuditLog.createLog({
      adminId: admin._id,
      adminName: admin.name,
      action: 'update',
      resourceType: 'admin',
      resourceId: admin._id.toString(),
      description: 'Reset password',
      status: 'success'
    });
    
    return { success: true };
  } catch (error) {
    console.error('Reset password error:', error);
    throw new Error(`Failed to reset password: ${error.message}`);
  }
};

/**
 * Get admin activity logs
 * @param {string} adminId - Admin ID
 * @param {Object} options - Query options
 * @returns {Array} Activity logs
 */
exports.getAdminActivityLogs = async (adminId, options = {}) => {
  try {
    const { page = 1, limit = 20, sort = { timestamp: -1 } } = options;
    
    const logs = await AuditLog.find({ adminId })
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);
      
    const total = await AuditLog.countDocuments({ adminId });
    
    return {
      logs,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Get admin activity logs error:', error);
    throw new Error(`Failed to get activity logs: ${error.message}`);
  }
};