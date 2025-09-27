/**
 * Dynamic Proxy Middleware
 * 
 * This middleware creates dynamic proxies for services using service discovery.
 * It handles routing requests to the appropriate service instance.
 */

const { createProxyMiddleware } = require('http-proxy-middleware');
const ServiceDiscovery = require('./service-discovery');

/**
 * Handle proxy errors
 * 
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const handleProxyError = (err, req, res, next) => {
  console.error('Proxy Error:', err);
  
  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({ 
      message: 'Service unavailable',
      error: 'The requested service is currently unavailable. Please try again later.'
    });
  }
  
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
};

/**
 * Create a dynamic proxy middleware for a service
 * 
 * @param {string} serviceName - Name of the service to proxy to
 * @param {string} pathPrefix - Path prefix to rewrite
 * @param {Object} [options={}] - Additional options for the proxy
 * @returns {Function} Express middleware function
 */
const createDynamicProxy = (serviceName, pathPrefix, options = {}) => {
  const discovery = new ServiceDiscovery();
  
  return async (req, res, next) => {
    try {
      // Get service URL from service discovery
      const serviceUrl = await discovery.getServiceUrl(serviceName);
      
      // Create proxy middleware
      const proxy = createProxyMiddleware({
        target: serviceUrl,
        changeOrigin: true,
        pathRewrite: {
          [`^${pathPrefix}`]: ''
        },
        onError: handleProxyError,
        ...options
      });
      
      // Apply proxy middleware
      return proxy(req, res, next);
    } catch (error) {
      console.error(`Service discovery error for ${serviceName}:`, error);
      return res.status(503).json({
        message: 'Service unavailable',
        error: 'The requested service is currently unavailable. Please try again later.'
      });
    }
  };
};

module.exports = createDynamicProxy;