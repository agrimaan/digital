/**
 * Service Clients
 * 
 * This module exports all service clients for easy importing.
 */

const userServiceClient = require('./user-service-client');
const fieldServiceClient = require('./field-service-client');

module.exports = {
  userServiceClient,
  fieldServiceClient,
};
