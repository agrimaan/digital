/**
 * Agrimaan Shared Components
 * 
 * This module exports all shared components for Agrimaan microservices.
 */
const logging = require('./logging');
const messaging = require('./messaging');
const metrics = require('./metrics');
const middleware = require('./middleware');
const resilience = require('./resilience');
const serviceDiscovery = require('./service-discovery');
const tracing = require('./tracing');
const utils = require('./utils');
// Add other shared components here as needed



module.exports = {
  logging,
  messaging,
  metrics,
  middleware,
  resilience,
  serviceDiscovery,
  tracing,
  utils
};