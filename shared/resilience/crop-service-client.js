
const ResilientHttpClient = require('./resilient-http-client');
const ServiceDiscovery = require('../service-discovery/service-discovery');


class CropServiceClient {
  constructor() {
    this.serviceDiscovery = new ServiceDiscovery();
    this.httpClient = new ResilientHttpClient({
      serviceName: 'crop-service',
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

  async getCropStats() {
    try {
      const serviceUrl = await this.serviceDiscovery.getServiceUrl('crop-service');
      const response = await this.httpClient.get(`${serviceUrl}/api/admin/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching crop stats:', error.message);
      return {
        totalCrops: 0,
        cropsByType: {},
        cropsByStatus: {}
      };
    }
  }

  async getAllCrops() {
    try {
      const serviceUrl = await this.serviceDiscovery.getServiceUrl('crop-service');
      const response = await this.httpClient.get(`${serviceUrl}/api/admin/crops`);
      return response.data;
    } catch (error) {
      console.error('Error fetching all crops:', error.message);
      return [];
    }
  }

  async getCropById(cropId) {
    try {
      const serviceUrl = await this.serviceDiscovery.getServiceUrl('crop-service');
      const response = await this.httpClient.get(`${serviceUrl}/api/crops/${cropId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get crop ${cropId}:`, error.message);
      throw error;
    }
  }
}

