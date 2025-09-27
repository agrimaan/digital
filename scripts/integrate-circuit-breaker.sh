#!/bin/bash

# Script to integrate circuit breaker pattern with all backend microservices
# This script creates service clients using the resilient HTTP client

# Define the backend services directory
BACKEND_DIR="./backend"

# Create a directory for service clients in each service
for SERVICE_DIR in $BACKEND_DIR/*-service; do
  SERVICE_NAME=$(basename $SERVICE_DIR)
  echo "Integrating circuit breaker with $SERVICE_NAME..."
  
  # Create a clients directory if it doesn't exist
  CLIENTS_DIR="$SERVICE_DIR/clients"
  if [ ! -d "$CLIENTS_DIR" ]; then
    mkdir -p "$CLIENTS_DIR"
    echo "Created clients directory in $SERVICE_NAME"
  fi
  
  # Update package.json to include required dependencies
  echo "Updating package.json..."
  # Check if @agrimaan/shared is already in dependencies
  if ! grep -q "@agrimaan/shared" $SERVICE_DIR/package.json; then
    # Use sed to add the dependency before the first dependency
    sed -i '/"dependencies": {/a \    "@agrimaan/shared": "^1.0.0",' $SERVICE_DIR/package.json
  fi
  
  # Check if axios is already in dependencies
  if ! grep -q "axios" $SERVICE_DIR/package.json; then
    # Use sed to add the dependency before the first dependency
    sed -i '/"dependencies": {/a \    "axios": "^1.4.0",' $SERVICE_DIR/package.json
  fi
  
  # Check if resilience4j is already in dependencies
  if ! grep -q "resilience4j" $SERVICE_DIR/package.json; then
    # Use sed to add the dependency before the first dependency
    sed -i '/"dependencies": {/a \    "resilience4j": "^0.14.0",' $SERVICE_DIR/package.json
  fi
  
  # Create service client files for commonly used services
  # We'll create user-service-client.js and field-service-client.js as examples
  
  # Create user-service-client.js if the current service is not user-service
  if [ "$SERVICE_NAME" != "user-service" ]; then
    echo "Creating user-service-client.js..."
    cat > "$CLIENTS_DIR/user-service-client.js" << 'EOL'
/**
 * User Service Client
 * 
 * This module provides a resilient client for interacting with the user-service.
 * It uses circuit breaker and retry mechanisms for improved reliability.
 */

const { ResilientHttpClient } = require('@agrimaan/shared/resilience');
const { ServiceDiscovery } = require('@agrimaan/shared/service-discovery');

class UserServiceClient {
  constructor() {
    this.serviceDiscovery = new ServiceDiscovery();
    this.httpClient = new ResilientHttpClient({
      serviceName: 'user-service',
      circuitBreakerOptions: {
        failureRateThreshold: 50,
        waitDurationInOpenState: 10000,
        slidingWindowSize: 10
      },
      retryOptions: {
        maxRetryAttempts: 3,
        retryDelay: 1000
      }
    });
  }

  /**
   * Get user by ID
   * 
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} User data
   */
  async getUserById(userId) {
    try {
      const serviceUrl = await this.serviceDiscovery.getServiceUrl('user-service');
      const response = await this.httpClient.get(`${serviceUrl}/api/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get user ${userId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get users by role
   * 
   * @param {string} role - User role (e.g., 'farmer', 'buyer')
   * @returns {Promise<Array>} List of users with the specified role
   */
  async getUsersByRole(role) {
    try {
      const serviceUrl = await this.serviceDiscovery.getServiceUrl('user-service');
      const response = await this.httpClient.get(`${serviceUrl}/api/users/role/${role}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get users with role ${role}:`, error.message);
      throw error;
    }
  }

  /**
   * Verify user token
   * 
   * @param {string} token - JWT token
   * @returns {Promise<Object>} Decoded token data
   */
  async verifyToken(token) {
    try {
      const serviceUrl = await this.serviceDiscovery.getServiceUrl('user-service');
      const response = await this.httpClient.post(`${serviceUrl}/api/auth/verify`, { token });
      return response.data;
    } catch (error) {
      console.error('Failed to verify token:', error.message);
      throw error;
    }
  }
}

module.exports = new UserServiceClient();
EOL
  fi
  
  # Create field-service-client.js if the current service is not field-service
  if [ "$SERVICE_NAME" != "field-service" ]; then
    echo "Creating field-service-client.js..."
    cat > "$CLIENTS_DIR/field-service-client.js" << 'EOL'
/**
 * Field Service Client
 * 
 * This module provides a resilient client for interacting with the field-service.
 * It uses circuit breaker and retry mechanisms for improved reliability.
 */

const { ResilientHttpClient } = require('@agrimaan/shared/resilience');
const { ServiceDiscovery } = require('@agrimaan/shared/service-discovery');

class FieldServiceClient {
  constructor() {
    this.serviceDiscovery = new ServiceDiscovery();
    this.httpClient = new ResilientHttpClient({
      serviceName: 'field-service',
      circuitBreakerOptions: {
        failureRateThreshold: 50,
        waitDurationInOpenState: 10000,
        slidingWindowSize: 10
      },
      retryOptions: {
        maxRetryAttempts: 3,
        retryDelay: 1000
      }
    });
  }

  /**
   * Get field by ID
   * 
   * @param {string} fieldId - The field ID
   * @returns {Promise<Object>} Field data
   */
  async getFieldById(fieldId) {
    try {
      const serviceUrl = await this.serviceDiscovery.getServiceUrl('field-service');
      const response = await this.httpClient.get(`${serviceUrl}/api/fields/${fieldId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get field ${fieldId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get fields by owner ID
   * 
   * @param {string} ownerId - The owner ID
   * @returns {Promise<Array>} List of fields owned by the user
   */
  async getFieldsByOwnerId(ownerId) {
    try {
      const serviceUrl = await this.serviceDiscovery.getServiceUrl('field-service');
      const response = await this.httpClient.get(`${serviceUrl}/api/fields/owner/${ownerId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get fields for owner ${ownerId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get fields by location
   * 
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   * @param {number} radius - Search radius in kilometers
   * @returns {Promise<Array>} List of fields within the specified radius
   */
  async getFieldsByLocation(latitude, longitude, radius = 10) {
    try {
      const serviceUrl = await this.serviceDiscovery.getServiceUrl('field-service');
      const response = await this.httpClient.get(
        `${serviceUrl}/api/fields/location?lat=${latitude}&lng=${longitude}&radius=${radius}`
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to get fields by location:`, error.message);
      throw error;
    }
  }
}

module.exports = new FieldServiceClient();
EOL
  fi
  
  # Create an index.js file in the clients directory to export all clients
  echo "Creating clients/index.js..."
  
  # Start with an empty file
  echo "/**" > "$CLIENTS_DIR/index.js"
  echo " * Service Clients" >> "$CLIENTS_DIR/index.js"
  echo " * " >> "$CLIENTS_DIR/index.js"
  echo " * This module exports all service clients for easy importing." >> "$CLIENTS_DIR/index.js"
  echo " */" >> "$CLIENTS_DIR/index.js"
  echo "" >> "$CLIENTS_DIR/index.js"
  
  # Add exports for each client file
  if [ "$SERVICE_NAME" != "user-service" ] && [ -f "$CLIENTS_DIR/user-service-client.js" ]; then
    echo "const userServiceClient = require('./user-service-client');" >> "$CLIENTS_DIR/index.js"
  fi
  
  if [ "$SERVICE_NAME" != "field-service" ] && [ -f "$CLIENTS_DIR/field-service-client.js" ]; then
    echo "const fieldServiceClient = require('./field-service-client');" >> "$CLIENTS_DIR/index.js"
  fi
  
  echo "" >> "$CLIENTS_DIR/index.js"
  echo "module.exports = {" >> "$CLIENTS_DIR/index.js"
  
  if [ "$SERVICE_NAME" != "user-service" ] && [ -f "$CLIENTS_DIR/user-service-client.js" ]; then
    echo "  userServiceClient," >> "$CLIENTS_DIR/index.js"
  fi
  
  if [ "$SERVICE_NAME" != "field-service" ] && [ -f "$CLIENTS_DIR/field-service-client.js" ]; then
    echo "  fieldServiceClient," >> "$CLIENTS_DIR/index.js"
  fi
  
  echo "};" >> "$CLIENTS_DIR/index.js"
  
  echo "Circuit breaker integration completed for $SERVICE_NAME"
  echo "---------------------------------------------------"
done

echo "Circuit breaker integration completed for all services!"