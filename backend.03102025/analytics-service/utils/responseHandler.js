/**
 * Standard success response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {Object|Array} data - Response data
 * @param {string} message - Success message
 * @returns {Object} Response object
 */
exports.success = (res, statusCode = 200, data = {}, message = 'Success') => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Standard error response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Object} error - Error details
 * @returns {Object} Response object
 */
exports.error = (res, statusCode = 500, message = 'Server Error', error = {}) => {
  // Log error for server-side debugging
  console.error(`Error: ${message}`, error);
  
  return res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? error : {}
  });
};

/**
 * Not found response
 * @param {Object} res - Express response object
 * @param {string} message - Not found message
 * @returns {Object} Response object
 */
exports.notFound = (res, message = 'Resource not found') => {
  return exports.error(res, 404, message);
};

/**
 * Unauthorized response
 * @param {Object} res - Express response object
 * @param {string} message - Unauthorized message
 * @returns {Object} Response object
 */
exports.unauthorized = (res, message = 'Not authorized to access this resource') => {
  return exports.error(res, 401, message);
};

/**
 * Forbidden response
 * @param {Object} res - Express response object
 * @param {string} message - Forbidden message
 * @returns {Object} Response object
 */
exports.forbidden = (res, message = 'Forbidden access') => {
  return exports.error(res, 403, message);
};

/**
 * Bad request response
 * @param {Object} res - Express response object
 * @param {string} message - Bad request message
 * @param {Object} errors - Validation errors
 * @returns {Object} Response object
 */
exports.badRequest = (res, message = 'Bad request', errors = {}) => {
  return exports.error(res, 400, message, errors);
};
