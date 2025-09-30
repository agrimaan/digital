/**
 * Agrimaan Shared Components
 * 
 * This module exports all shared components for Agrimaan microservices.
 */

const serviceDiscovery = require('./service-discovery');
const logging = require('./logging');
const tracing = require('./tracing');
const metrics = require('./metrics');
const resilience = require('./resilience');
// Add other shared components here as needed



module.exports = {
  serviceDiscovery,
  logging,
  tracing,
  metrics,
  resilience
};