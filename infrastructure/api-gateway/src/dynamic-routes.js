/**
 * Dynamic Routes for API Gateway
 * 
 * This file defines routes for the API Gateway using service discovery.
 */

const jwt = require('jsonwebtoken');
const createDynamicProxy = require('../../shared/service-discovery/dynamic-proxy-middleware');

// Authentication middleware
const authenticate = (req, res, next) => {
  // Skip authentication for login and register routes
  if (
    req.path === '/api/auth/login' || 
    req.path === '/api/auth/register' ||
    req.path === '/health' ||
    req.path.startsWith('/api/public')
  ) {
    return next();
  }

  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallbacksecret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = (app) => {
  // Apply authentication middleware
  app.use(authenticate);
  
  // User Service Routes
  app.use('/api/auth', createDynamicProxy('user-service', '/api/auth'));
  app.use('/api/users', createDynamicProxy('user-service', '/api/users'));
  
  // Field Service Routes
  app.use('/api/fields', createDynamicProxy('field-service', '/api/fields'));
  app.use('/api/soil', createDynamicProxy('field-service', '/api/soil'));
  app.use('/api/boundaries', createDynamicProxy('field-service', '/api/boundaries'));
  
  // IoT Service Routes
  app.use('/api/devices', createDynamicProxy('iot-service', '/api/devices'));
  app.use('/api/telemetry', createDynamicProxy('iot-service', '/api/telemetry'));
  app.use('/api/alerts', createDynamicProxy('iot-service', '/api/alerts'));
  
  // Crop Service Routes
  app.use('/api/crops', createDynamicProxy('crop-service', '/api/crops'));
  app.use('/api/plantings', createDynamicProxy('crop-service', '/api/plantings'));
  
  // Marketplace Service Routes
  app.use('/api/products', createDynamicProxy('marketplace-service', '/api/products'));
  app.use('/api/orders', createDynamicProxy('marketplace-service', '/api/orders'));
  
  // Logistics Service Routes
  app.use('/api/shipments', createDynamicProxy('logistics-service', '/api/shipments'));
  app.use('/api/vehicles', createDynamicProxy('logistics-service', '/api/vehicles'));
  
  // Weather Service Routes
  app.use('/api/weather', createDynamicProxy('weather-service', '/api/weather'));
  app.use('/api/forecasts', createDynamicProxy('weather-service', '/api/forecasts'));
  
  // Analytics Service Routes
  app.use('/api/analytics', createDynamicProxy('analytics-service', '/api/analytics'));
  app.use('/api/reports', createDynamicProxy('analytics-service', '/api/reports'));
  
  // Notification Service Routes
  app.use('/api/notifications', createDynamicProxy('notification-service', '/api/notifications'));
  
  // Blockchain Service Routes
  app.use('/api/blockchain', createDynamicProxy('blockchain-service', '/api/blockchain'));
  app.use('/api/tokens', createDynamicProxy('blockchain-service', '/api/tokens'));
  
  // Admin Service Routes
  app.use('/api/admin', createDynamicProxy('admin-service', '/api/admin'));
};