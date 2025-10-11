
/**
 * User Service Client
 * 
 * This module provides a resilient client for interacting with the user-service.
 * It uses circuit breaker and retry mechanisms for improved reliability.
 */

const  ResilientHttpClient  = require('./resilient-http-client');
const ServiceDiscovery  = require('../service-discovery/service-discovery');

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
      const serviceUrl = await this.serviceDiscovery.getServiceUrl('admin-service');
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
      const serviceUrl = await this.serviceDiscovery.getServiceUrl('admin-service');
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
      const serviceUrl = await this.serviceDiscovery.getServiceUrl('admin-service');
      const response = await this.httpClient.post(`${serviceUrl}/api/auth/verify`, { token });
      return response.data;
    } catch (error) {
      console.error('Failed to verify token:', error.message);
      throw error;
    }
  }

  /**
   * Get user statistics for admin dashboard
   * @returns {Promise<Object>} User statistics
   */
  async getUserStats() {
    try {
      const serviceUrl = await this.serviceDiscovery.getServiceUrl('admin-service');
      const response = await this.httpClient.get(`${serviceUrl}/api/admin/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user stats:', error.message);
      return {
        totalUsers: 0,
        usersByRole: {
          farmers: 0,
          buyers: 0,
          agronomists: 0,
          investors: 0,
          admins: 0
        }
      };
    }
  }

  /**
   * Get recent users for admin dashboard
   * @param {number} limit - Number of users to return
   * @returns {Promise<Array>} Recent users
   */
  async getRecentUsers(limit = 5) {
    try {
      const serviceUrl = await this.serviceDiscovery.getServiceUrl('admin-service');
      const response = await this.httpClient.get(`${serviceUrl}/api/admin/users/recent?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recent users:', error.message);
      return [];
    }
  }

  /**
   * Get verification statistics
   * @returns {Promise<Object>} Verification statistics
   */
  async getVerificationStats() {
    try {
      const serviceUrl = await this.serviceDiscovery.getServiceUrl('admin-service');
      const response = await this.httpClient.get(`${serviceUrl}/api/admin/verification/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching verification stats:', error.message);
      return {
        pendingUsers: 0,
        pendingLandTokens: 0,
        pendingBulkUploads: 0
      };
    }
  }

  /**
   * Get pending verifications
   * @returns {Promise<Object>} Pending verifications
   */
  async getPendingVerifications() {
    try {
      const serviceUrl = await this.serviceDiscovery.getServiceUrl('admin-service');
      const response = await this.httpClient.get(`${serviceUrl}/api/admin/verification/pending`);
      return response.data;
    } catch (error) {
      console.error('Error fetching pending verifications:', error.message);
      return {
        pendingUsers: [],
        pendingLandTokens: [],
        pendingBulkUploads: []
      };
    }
  }
}

