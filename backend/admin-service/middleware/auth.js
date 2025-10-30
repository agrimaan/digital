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

    // First, try to find an admin with this ID
    let admin = await Admin.findById(decoded.id);
    console.log('Decoded JWT:', decoded);

    // If no admin found, check if it's a regular user with admin role
    if (!admin && decoded.role === 'admin') {
      // Create a mock admin object from the user data
      admin = {
        _id: decoded.id,
        role: decoded.role,
        name: 'Agrimaan Admin',
        email: decoded.email || 'admin@agrimaan.io',
        active: true,
        permissions: {
          users: { read: true, write: true, delete: true },
          fields: { read: true, write: true, delete: true },
          crops: { read: true, write: true, delete: true },
          sensors: { read: true, write: true, delete: true },
          orders: { read: true, write: true, delete: true },
          analytics: { read: true, write: true, delete: true },
          reports: { read: true, write: true, delete: true },
          settings: { read: true, write: true, delete: true }
        }
      };
      console.log('Mock Admin from User JWT:', admin)

    }

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Check if admin is active
    if (admin.active === false) {
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
    console.log('Roles:', roles);
    //console.log('Request:', req);
   console.log('Admin Role:', req.admin.role);
  /*
   if (!roles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        message: `Admin role ${req.admin.role} is not authorized to access this route`
      });
    }
    */
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

// Log admin actions - FIXED VERSION
exports.logAction = (action, resourceType) => {
  return async (req, res, next) => {
    // Store the original send function
    const originalSend = res.send;

    // Override the send function
    res.send = function (data) {
      // Get the response body before calling original send
      let body;
      try {
        body = JSON.parse(data);
      } catch (error) {
        body = data;
      }

      // Call the original send function first
      const result = originalSend.call(this, data);

      // Log the action only if the response is successful (async, doesn't block response)
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

        // Log the action (async, doesn't affect response)
        AuditLog.createLog(logData).catch(error => {
          console.error('Error logging admin action:', error);
        });
      }

      return result;
    };

    next();
  };
};
