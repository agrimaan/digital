/**
 * Service Discovery Module
 * 
 * This module exports all service discovery components.
 */

const ServiceRegistry = require('./service-registry');
const ServiceDiscovery = require('./service-discovery');
const createDynamicProxy = require('./dynamic-proxy-middleware');
const healthCheck = require('./health-check-middleware');

module.exports = {
  ServiceRegistry,
  ServiceDiscovery,
  createDynamicProxy,
  healthCheck
};