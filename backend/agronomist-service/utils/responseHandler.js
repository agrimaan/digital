/**
 * Success response handler
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {Object} data - Response data
 * @param {string} message - Success message
 */
exports.success = (res, statusCode, data, message) => {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  };
  
  /**
   * Error response handler
   * @param {Object} res - Express response object
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @param {Object} error - Error details
   */
  exports.error = (res, statusCode, message, error) => {
    return res.status(statusCode).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  };
  
  /**
   * Bad request response handler
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @param {Array} errors - Validation errors
   */
  exports.badRequest = (res, message, errors) => {
    return res.status(400).json({
      success: false,
      message,
      errors
    });
  };
  
  /**
   * Not found response handler
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  exports.notFound = (res, message) => {
    return res.status(404).json({
      success: false,
      message
    });
  };
  
  /**
   * Unauthorized response handler
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  exports.unauthorized = (res, message) => {
    return res.status(401).json({
      success: false,
      message
    });
  };
  
  /**
   * Forbidden response handler
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  exports.forbidden = (res, message) => {
    return res.status(403).json({
      success: false,
      message
    });
  };