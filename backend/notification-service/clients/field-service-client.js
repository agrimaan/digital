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
