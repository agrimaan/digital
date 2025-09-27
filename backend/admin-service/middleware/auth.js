const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const AuditLog = require('../models/AuditLog');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  let token;

  // Check if auth header exists and has the correct format
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get admin from the token
    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Check if admin is active
    if (!admin.active) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact a super-admin.'
      });
    }

    // Add admin to request object
    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        message: `Admin role ${req.admin.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Check permissions for specific resource
exports.checkPermission = (resource, action) => {
  return (req, res, next) => {
    // Super-admin has all permissions
    if (req.admin.role === 'super-admin') {
      return next();
    }

    // Check if admin has the required permission
    if (
      req.admin.permissions &&
      req.admin.permissions[resource] &&
      req.admin.permissions[resource][action]
    ) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `You don't have permission to ${action} ${resource}`
    });
  };
};

// Log admin actions
exports.logAction = (action, resourceType) => {
  return async (req, res, next) => {
    // Store the original send function
    const originalSend = res.send;

    // Override the send function
    res.send = function (data) {
      // Get the original response
      res.send = originalSend;
      
      // Get the response body
      let body;
      try {
        body = JSON.parse(data);
      } catch (error) {
        body = data;
      }

      // Log the action only if the response is successful
      if (res.statusCode >= 200 && res.statusCode < 400) {
        const logData = {
          adminId: req.admin._id,
          adminName: req.admin.name,
          action,
          resourceType,
          description: `${action} ${resourceType}`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          status: 'success'
        };

        // Add resource ID if available
        if (req.params.id) {
          logData.resourceId = req.params.id;
        } else if (body && body.data && body.data._id) {
          logData.resourceId = body.data._id;
        }

        // Log the action
        AuditLog.createLog(logData).catch(error => {
          console.error('Error logging admin action:', error);
        });
      }

      // Call the original send function
      return res.send(data);
    };

    next();
  };
};