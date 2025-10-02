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
