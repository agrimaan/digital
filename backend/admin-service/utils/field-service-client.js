
/**
 * Independent Field Service Client for Admin Service
 * 
 * This module provides a resilient client for interacting with the field-service
 * without depending on the shared project.
 */

const IndependentHttpClient = require('./http-client');
const IndependentServiceDiscovery = require('./service-discovery');

class IndependentFieldServiceClient {
  constructor() {
    this.serviceDiscovery = new IndependentServiceDiscovery();
    this.httpClient = new IndependentHttpClient({
      serviceName: 'field-service',
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
   * Get field by ID
   */
  async getFieldById(fieldId) {
    try {
      const response = await this.httpClient.get(`/api/fields/${fieldId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get field ${fieldId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get fields by location
   */
  async getFieldsByLocation(location) {
    try {
      const response = await this.httpClient.get(`/api/fields/location/${encodeURIComponent(location)}`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return [];
      }
      console.error(`Failed to get fields by location ${location}:`, error.message);
      throw error;
    }
  }

  /**
   * Create field
   */
  async createField(fieldData) {
    try {
      const response = await this.httpClient.post('/api/fields', fieldData);
      return response.data;
    } catch (error) {
      console.error('Failed to create field:', error.message);
      throw error;
    }
  }

  /**
   * Update field
   */
  async updateField(fieldId, fieldData) {
    try {
      const response = await this.httpClient.put(`/api/fields/${fieldId}`, fieldData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update field ${fieldId}:`, error.message);
      throw error;
    }
  }

  /**
   * Delete field
   */
  async deleteField(fieldId) {
    try {
      const response = await this.httpClient.delete(`/api/fields/${fieldId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to delete field ${fieldId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get all fields
   */
  async getAllFields() {
    try {
      const response = await this.httpClient.get('/api/fields');
      return response.data;
    } catch (error) {
      console.error('Failed to get all fields:', error.message);
      throw error;
    }
  }

  /**
   * Get fields by user
   */
  async getFieldsByUser(userId) {
    try {
      const response = await this.httpClient.get(`/api/fields/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get fields by user ${userId}:`, error.message);
      throw error;
    }
  }

  /**
   * Search fields
   */
  async searchFields(query) {
    try {
      const response = await this.httpClient.get('/api/fields/search', {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to search fields with query ${query}:`, error.message);
      throw error;
    }
  }
}

module.exports = IndependentFieldServiceClient;
