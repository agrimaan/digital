/**
 * Field Service Client
 * 
 * This module provides a resilient client for the Field Service.
 */

const ResilientHttpClient = require('./resilient-http-client');
const ServiceDiscovery = require('../service-discovery/service-discovery');

class FieldServiceClient {
  /**
   * Create a new FieldServiceClient instance
   * 
   * @param {Object} [options={}] - Configuration options
   */
  constructor(options = {}) {
    this.discovery = new ServiceDiscovery();
    this.serviceName = 'field-service';
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
      
      console.log(`FieldServiceClient initialized with URL: ${serviceUrl}`);
    } catch (error) {
      console.error(`Failed to initialize FieldServiceClient: ${error.message}`);
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
   * Get field by ID
   * 
   * @param {string} fieldId - Field ID
   * @returns {Promise<Object>} Field data
   */
  async getFieldById(fieldId) {
    const client = await this.getClient();
    
    return client.get(`/api/fields/${fieldId}`, {}, (error) => {
      // Fallback implementation
      console.log(`Fallback for getFieldById(${fieldId}): ${error.message}`);
      return { id: fieldId, name: 'Unknown Field', fallback: true };
    });
  }
  
  /**
   * Get fields by user ID
   * 
   * @param {string} userId - User ID
   * @returns {Promise<Array>} List of fields
   */
  async getFieldsByUserId(userId) {
    const client = await this.getClient();
    
    return client.get('/api/fields', { params: { userId } }, (error) => {
      // Fallback implementation
      console.log(`Fallback for getFieldsByUserId(${userId}): ${error.message}`);
      return { fields: [], fallback: true };
    });
  }
  
  /**
   * Create a new field
   * 
   * @param {Object} fieldData - Field data
   * @returns {Promise<Object>} Created field
   */
  async createField(fieldData) {
    const client = await this.getClient();
    
    return client.post('/api/fields', fieldData);
  }
  
  /**
   * Update a field
   * 
   * @param {string} fieldId - Field ID
   * @param {Object} fieldData - Field data
   * @returns {Promise<Object>} Updated field
   */
  async updateField(fieldId, fieldData) {
    const client = await this.getClient();
    
    return client.put(`/api/fields/${fieldId}`, fieldData);
  }
  
  /**
   * Delete a field
   * 
   * @param {string} fieldId - Field ID
   * @returns {Promise<Object>} Result
   */
  async deleteField(fieldId) {
    const client = await this.getClient();
    
    return client.delete(`/api/fields/${fieldId}`);
  }
  
  /**
   * Get soil data for a field
   * 
   * @param {string} fieldId - Field ID
   * @returns {Promise<Object>} Soil data
   */
  async getSoilData(fieldId) {
    const client = await this.getClient();
    
    return client.get(`/api/soil/${fieldId}`, {}, (error) => {
      // Fallback implementation
      console.log(`Fallback for getSoilData(${fieldId}): ${error.message}`);
      return { fieldId, soilType: 'Unknown', fallback: true };
    });
  }
  
  /**
   * Get field boundaries
   * 
   * @param {string} fieldId - Field ID
   * @returns {Promise<Object>} Field boundaries
   */
  async getFieldBoundaries(fieldId) {
    const client = await this.getClient();
    
    return client.get(`/api/boundaries/${fieldId}`, {}, (error) => {
      // Fallback implementation
      console.log(`Fallback for getFieldBoundaries(${fieldId}): ${error.message}`);
      return { fieldId, boundaries: [], fallback: true };
    });
  }
}

module.exports = FieldServiceClient;