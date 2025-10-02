const jwt = require('jsonwebtoken');
const { createError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

/**
 * Middleware to authenticate JWT tokens
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateJWT = (req, res, next) => {
  try {
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw createError(401, 'Authorization header missing');
    }
    
    // Check if the header has the correct format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw createError(401, 'Authorization header must be in format: Bearer [token]');
    }
    
    const token = parts[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user info to request object
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };
    
    logger.debug(`Authenticated user: ${req.user.email} (${req.user.id})`);
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid token'
        }
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Token expired'
        }
      });
    }
    
    logger.error(`Authentication error: ${error.message}`);
    next(error);
  }
};

/**
 * Middleware to check if user has required role
 * @param {string|Array} roles - Required role(s)
 * @returns {Function} - Express middleware function
 */
const authorizeRole = (roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw createError(401, 'User not authenticated');
      }
      
      // Convert roles to array if it's a single string
      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      
      if (!allowedRoles.includes(req.user.role)) {
        throw createError(403, 'Access denied: Insufficient permissions');
      }
      
      next();
    } catch (error) {
      logger.error(`Authorization error: ${error.message}`);
      next(error);
    }
  };
};

/**
 * Middleware to check if user is the owner of a resource
 * @param {Function} getResourceOwnerId - Function to get resource owner ID from request
 * @returns {Function} - Express middleware function
 */
const authorizeOwner = (getResourceOwnerId) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw createError(401, 'User not authenticated');
      }
      
      // Get the owner ID of the resource
      const ownerId = await getResourceOwnerId(req);
      
      // Check if the authenticated user is the owner
      if (req.user.id !== ownerId.toString()) {
        // Allow admin users to bypass ownership check
        if (req.user.role === 'admin') {
          logger.info(`Admin user ${req.user.id} accessing resource owned by ${ownerId}`);
          return next();
        }
        
        throw createError(403, 'Access denied: You do not own this resource');
      }
      
      next();
    } catch (error) {
      logger.error(`Owner authorization error: ${error.message}`);
      next(error);
    }
  };
};

/**
 * Middleware to check if a service-to-service API key is valid
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateServiceApiKey = (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      throw createError(401, 'API key missing');
    }
    
    // In a real implementation, you would validate the API key against a list of valid keys
    // For now, we'll use a simple environment variable check
    const validApiKeys = process.env.SERVICE_API_KEYS ? process.env.SERVICE_API_KEYS.split(',') : [];
    
    if (!validApiKeys.includes(apiKey)) {
      throw createError(401, 'Invalid API key');
    }
    
    // Optionally identify the service
    const serviceId = req.headers['x-service-id'];
    if (serviceId) {
      req.service = { id: serviceId };
      logger.debug(`Authenticated service: ${serviceId}`);
    } else {
      logger.debug('Authenticated service with API key (no service ID provided)');
    }
    
    next();
  } catch (error) {
    logger.error(`Service authentication error: ${error.message}`);
    next(error);
  }
};

module.exports = {
  authenticateJWT,
  authorizeRole,
  authorizeOwner,
  authenticateServiceApiKey
};