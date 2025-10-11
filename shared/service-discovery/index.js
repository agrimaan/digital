/**
 * Service Discovery Module
 * 
 * This module exports all service discovery components.
 */


module.exports = {
    ServiceRegistry: require('./service-registry'),
    middleware: require('../middleware'), // must export { createProxyMiddleware }
    healthCheck: require('./health-check-middleware'),
    createDynamicProxy: require('./dynamic-proxy-middleware')
  }
  