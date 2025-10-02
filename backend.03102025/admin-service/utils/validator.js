const { validationResult } = require('express-validator');
const responseHandler = require('./responseHandler');

/**
 * Validate request using express-validator
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {Object|void} Error response or next()
 */
exports.validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseHandler.badRequest(res, 'Validation error', errors.array());
  }
  next();
};

/**
 * Validate MongoDB ObjectId
 * @param {string} id - ID to validate
 * @returns {boolean} Whether ID is valid
 */
exports.isValidObjectId = (id) => {
  const mongoose = require('mongoose');
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Whether email is valid
 */
exports.isValidEmail = (email) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result
 */
exports.validatePasswordStrength = (password) => {
  const result = {
    isValid: false,
    errors: []
  };
  
  // Check length
  if (password.length < 8) {
    result.errors.push('Password must be at least 8 characters long');
  }
  
  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    result.errors.push('Password must contain at least one uppercase letter');
  }
  
  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    result.errors.push('Password must contain at least one lowercase letter');
  }
  
  // Check for number
  if (!/[0-9]/.test(password)) {
    result.errors.push('Password must contain at least one number');
  }
  
  // Check for special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    result.errors.push('Password must contain at least one special character');
  }
  
  // Set isValid if no errors
  result.isValid = result.errors.length === 0;
  
  return result;
};

/**
 * Sanitize object by removing specified fields
 * @param {Object} obj - Object to sanitize
 * @param {Array} fields - Fields to remove
 * @returns {Object} Sanitized object
 */
exports.sanitizeObject = (obj, fields = []) => {
  const sanitized = { ...obj };
  fields.forEach(field => {
    delete sanitized[field];
  });
  return sanitized;
};

/**
 * Validate date format (YYYY-MM-DD)
 * @param {string} date - Date to validate
 * @returns {boolean} Whether date is valid
 */
exports.isValidDate = (date) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return false;
  }
  
  const d = new Date(date);
  const dNum = d.getTime();
  if (!dNum && dNum !== 0) {
    return false;
  }
  
  return d.toISOString().slice(0, 10) === date;
};

/**
 * Validate time format (HH:MM)
 * @param {string} time - Time to validate
 * @returns {boolean} Whether time is valid
 */
exports.isValidTime = (time) => {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(time);
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} Whether URL is valid
 */
exports.isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Whether phone number is valid
 */
exports.isValidPhone = (phone) => {
  // Basic international phone number validation
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate color hex code
 * @param {string} color - Color hex code to validate
 * @returns {boolean} Whether color is valid
 */
exports.isValidHexColor = (color) => {
  const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return colorRegex.test(color);
};