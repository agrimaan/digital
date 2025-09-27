/**
 * User Service Client
 * 
 * This module provides a resilient client for the User Service.
 */

const ResilientHttpClient = require('./resilient-http-client');
const ServiceDiscovery = require('../service-discovery/service-discovery');

class UserServiceClient {
  /**
   * Create a new UserServiceClient instance
   * 
   * @param {Object} [options={}] - Configuration options
   */
  constructor(options = {}) {
    this.discovery = new ServiceDiscovery();
    this.serviceName = 'user-service';
    this.client = null;
    this.options = options;
  }
  
  /**
   * Initialize the client
   * 
   * @returns {Promise<void>}
   */
  async init() {
    try {
      const serviceUrl = await this.discovery.getServiceUrl(this.serviceName);
      
      this.client = new ResilientHttpClient({
        baseURL: serviceUrl,
        timeout: this.options.timeout || 5000,
        retries: this.options.retries || 3,
        circuitBreakerOptions: {
          failureRateThreshold: 50,
          waitDurationInOpenState: 10000,
          slidingWindowSize: 10
        }
      });
      
      console.log(`UserServiceClient initialized with URL: ${serviceUrl}`);
    } catch (error) {
      console.error(`Failed to initialize UserServiceClient: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get a client instance
   * 
   * @returns {Promise<ResilientHttpClient>} HTTP client
   */
  async getClient() {
    if (!this.client) {
      await this.init();
    }
    return this.client;
  }
  
  /**
   * Get user by ID
   * 
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User data
   */
  async getUserById(userId) {
    const client = await this.getClient();
    
    return client.get(`/api/users/${userId}`, {}, (error) => {
      // Fallback implementation
      console.log(`Fallback for getUserById(${userId}): ${error.message}`);
      return { id: userId, name: 'Unknown User', fallback: true };
    });
  }
  
  /**
   * Get all users
   * 
   * @param {Object} [query={}] - Query parameters
   * @returns {Promise<Array>} List of users
   */
  async getUsers(query = {}) {
    const client = await this.getClient();
    
    return client.get('/api/users', { params: query }, (error) => {
      // Fallback implementation
      console.log(`Fallback for getUsers(): ${error.message}`);
      return { users: [], fallback: true };
    });
  }
  
  /**
   * Create a new user
   * 
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData) {
    const client = await this.getClient();
    
    return client.post('/api/users', userData);
  }
  
  /**
   * Update a user
   * 
   * @param {string} userId - User ID
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Updated user
   */
  async updateUser(userId, userData) {
    const client = await this.getClient();
    
    return client.put(`/api/users/${userId}`, userData);
  }
  
  /**
   * Delete a user
   * 
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Result
   */
  async deleteUser(userId) {
    const client = await this.getClient();
    
    return client.delete(`/api/users/${userId}`);
  }
  
  /**
   * Authenticate a user
   * 
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Authentication result
   */
  async authenticate(email, password) {
    const client = await this.getClient();
    
    return client.post('/api/auth/login', { email, password });
  }
}

module.exports = UserServiceClient;