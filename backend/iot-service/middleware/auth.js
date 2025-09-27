const jwt = require('jsonwebtoken');
const axios = require('axios');

// Protect routes
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallbacksecret');

    // Get user from the token
    // Since this is a microservice, we need to fetch user data from the user service
    try {
      const response = await axios.get(`${process.env.USER_SERVICE_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      req.user = response.data.data;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'User not found or user service unavailable'
      });
    }
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
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// API key authentication for IoT devices
exports.apiKeyAuth = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API key is required'
    });
  }

  try {
    // Find device by API key
    const Device = require('../models/Device');
    const device = await Device.findOne({ apiKey });

    if (!device) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key'
      });
    }

    // Add device to request
    req.device = device;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error authenticating device',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};