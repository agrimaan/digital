const logger = require('./logger');

/**
 * Custom error class for API errors
 */
class APIError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Create a new API error
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Object} details - Additional error details
 * @returns {APIError} - New API error
 */
const createError = (statusCode, message, details = null) => {
  return new APIError(statusCode, message, details);
};

/**
 * Handle errors in Express routes
 * @param {Object} res - Express response object
 * @param {Error} error - Error object
 */
const handleError = (res, error) => {
  // Default error status and message
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details = null;

  // Handle custom API errors
  if (error instanceof APIError) {
    statusCode = error.statusCode;
    message = error.message;
    details = error.details;
  } 
  // Handle Mongoose validation errors
  else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    details = Object.values(error.errors).map(err => err.message);
  } 
  // Handle Mongoose cast errors (e.g., invalid ObjectId)
  else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid Data Format';
    details = `Invalid ${error.path}: ${error.value}`;
  } 
  // Handle Mongoose duplicate key errors
  else if (error.code === 11000) {
    statusCode = 409;
    message = 'Duplicate Key Error';
    details = error.keyValue;
  } 
  // Handle JWT errors
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid Token';
  } 
  // Handle JWT expiration
  else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token Expired';
  } 
  // Handle other errors
  else {
    message = error.message || message;
  }

  // Log the error
  if (statusCode >= 500) {
    logger.error(`[${statusCode}] ${message}`, {
      stack: error.stack,
      details
    });
  } else {
    logger.warn(`[${statusCode}] ${message}`, {
      details
    });
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      details: details || undefined,
      // Include stack trace in development environment only
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }
  });
};

/**
 * Express middleware for handling async route handlers
 * @param {Function} fn - Async route handler function
 * @returns {Function} - Middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    handleError(res, error);
  });
};

/**
 * Express middleware for handling 404 errors
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const notFoundHandler = (req, res) => {
  logger.warn(`Route not found: ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: {
      message: `Route not found: ${req.originalUrl}`
    }
  });
};

module.exports = {
  createError,
  handleError,
  asyncHandler,
  notFoundHandler,
  APIError
};