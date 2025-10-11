const jwt = require('jsonwebtoken');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }

  try {
    // Verify token and attach the decoded payload to the request object
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');

    // The entire decoded payload is now on req.user
    req.user = decoded; 

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // req.user is now the decoded token payload
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user ? req.user.role : 'none'} is not authorized to access this route`,
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
