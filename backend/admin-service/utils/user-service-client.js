
/**
 * Independent User Service Client for Admin Service
 * 
 * This module provides a resilient client for interacting with the user-service
 * without depending on the shared project.
 */

const IndependentHttpClient = require('./http-client');
const IndependentServiceDiscovery = require('./service-discovery');

class IndependentUserServiceClient {
  constructor() {
    this.serviceDiscovery = new IndependentServiceDiscovery();
    this.httpClient = new IndependentHttpClient({
      serviceName: 'user-service',
      circuitBreakerOptions: {
        failureRateThreshold: 50,
        waitDurationInOpenState: 10000,
        slidingWindowSize: 10
      },
      retryOptions: {
        maxRetryAttempts: 3,
        retryDelay: 1000
      },
      serviceDiscovery: this.serviceDiscovery
    });
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    try {
      const response = await this.httpClient.get(`/api/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get user ${userId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email) {
    try {
      const response = await this.httpClient.get(`/api/users/email/${email}`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        // User not found, return null instead of throwing
        return null;
      }
      console.error(`Failed to get user by email ${email}:`, error.message);
      throw error;
    }
  }

  /**
   * Create user
   */
  async createUser(userData) {
    try {
      const response = await this.httpClient.post('/api/users', userData);
      return response.data;
    } catch (error) {
      console.error('Failed to create user:', error.message);
      throw error;
    }
  }

  /**
   * Update user
   */
  async updateUser(userId, userData) {
    try {
      const response = await this.httpClient.put(`/api/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update user ${userId}:`, error.message);
      throw error;
    }
  }

  /**
   * Delete user
   */
  async deleteUser(userId) {
    try {
      const response = await this.httpClient.delete(`/api/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to delete user ${userId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role) {
    try {
      const response = await this.httpClient.get(`/api/users/role/${role}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get users by role ${role}:`, error.message);
      throw error;
    }
  }

  /**
   * Get all users
   */
  async getAllUsers() {
    try {
      const response = await this.httpClient.get('/api/users');
      return response.data;
    } catch (error) {
      console.error('Failed to get all users:', error.message);
      throw error;
    }
  }

  /**
   * Search users
   */
  async searchUsers(query) {
    try {
      const response = await this.httpClient.get('/api/users/search', {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to search users with query ${query}:`, error.message);
      throw error;
    }
  }
}

module.exports = IndependentUserServiceClient;
