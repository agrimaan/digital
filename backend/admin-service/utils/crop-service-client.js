
/**
 * Independent Crop Service Client for Admin Service
 * 
 * This module provides a resilient client for interacting with the crop-service
 * without depending on the shared project.
 */

const IndependentHttpClient = require('./http-client');
const IndependentServiceDiscovery = require('./service-discovery');

class IndependentCropServiceClient {
  constructor() {
    this.serviceDiscovery = new IndependentServiceDiscovery();
    this.httpClient = new IndependentHttpClient({
      serviceName: 'crop-service',
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
   * Get crop by ID
   */
  async getCropById(cropId) {
    try {
      const response = await this.httpClient.get(`/api/crops/${cropId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get crop ${cropId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get crops by field
   */
  async getCropsByField(fieldId) {
    try {
      const response = await this.httpClient.get(`/api/crops/field/${fieldId}`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return [];
      }
      console.error(`Failed to get crops by field ${fieldId}:`, error.message);
      throw error;
    }
  }

  /**
   * Create crop
   */
  async createCrop(cropData) {
    try {
      const response = await this.httpClient.post('/api/crops', cropData);
      return response.data;
    } catch (error) {
      console.error('Failed to create crop:', error.message);
      throw error;
    }
  }

  /**
   * Update crop
   */
  async updateCrop(cropId, cropData) {
    try {
      const response = await this.httpClient.put(`/api/crops/${cropId}`, cropData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update crop ${cropId}:`, error.message);
      throw error;
    }
  }

  /**
   * Delete crop
   */
  async deleteCrop(cropId) {
    try {
      const response = await this.httpClient.delete(`/api/crops/${cropId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to delete crop ${cropId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get all crops
   */
  async getAllCrops() {
    try {
      const response = await this.httpClient.get('/api/crops');
      return response.data;
    } catch (error) {
      console.error('Failed to get all crops:', error.message);
      throw error;
    }
  }

  /**
   * Get crops by status
   */
  async getCropsByStatus(status) {
    try {
      const response = await this.httpClient.get(`/api/crops/status/${status}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get crops by status ${status}:`, error.message);
      throw error;
    }
  }

  /**
   * Search crops
   */
  async searchCrops(query) {
    try {
      const response = await this.httpClient.get('/api/crops/search', {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to search crops with query ${query}:`, error.message);
      throw error;
    }
  }
}

module.exports = IndependentCropServiceClient;
