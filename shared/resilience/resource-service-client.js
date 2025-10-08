

const ResilientHttpClient = require('./resilient-http-client');
const ServiceDiscovery = require('../service-discovery/service-discovery');

class ResourceServiceClient {
  constructor() {
    this.serviceDiscovery = new ServiceDiscovery();
    this.httpClient = new ResilientHttpClient({
      serviceName: 'resource-service', // Assuming there's a resource service
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

  async getResourceStats() {
    try {
      const serviceUrl = await this.serviceDiscovery.getServiceUrl('resource-service');
      const response = await this.httpClient.get(`${serviceUrl}/api/admin/resource-stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching resource stats:', error.message);
      return {
        totalResources: 0,
        resourcesByType: {},
        resourcesByStatus: {}
      };
    }
  }

  async getAllResources() {
    try {
      const serviceUrl = await this.serviceDiscovery.getServiceUrl('resource-service');
      const response = await this.httpClient.get(`${serviceUrl}/api/admin/resources`);
      return response.data;
    } catch (error) {
      console.error('Error fetching all resources:', error.message);
      return [];
    }
  }

  async getResourceById(resourceId) {
    try {
      const serviceUrl = await this.serviceDiscovery.getServiceUrl('resource-service');
      const response = await this.httpClient.get(`${serviceUrl}/api/resources/${resourceId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get resource ${resourceId}:`, error.message);
      throw error;
    }
  }

  async createResource(resourceData) {
    try {
      const serviceUrl = await this.serviceDiscovery.getServiceUrl('resource-service');
      const response = await this.httpClient.post(`${serviceUrl}/api/resources`, resourceData);
      return response.data;
    } catch (error) {
      console.error('Error creating resource:', error.message);
      throw error;
    }
  }

  async updateResource(resourceId, resourceData) {
    try {
      const serviceUrl = await this.serviceDiscovery.getServiceUrl('resource-service');
      const response = await this.httpClient.put(`${serviceUrl}/api/resources/${resourceId}`, resourceData);
      return response.data;
    } catch (error) {
      console.error(`Error updating resource ${resourceId}:`, error.message);
      throw error;
    }
  }

  async deleteResource(resourceId) {
    try {
      const serviceUrl = await this.serviceDiscovery.getServiceUrl('resource-service');
      const response = await this.httpClient.delete(`${serviceUrl}/api/resources/${resourceId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting resource ${resourceId}:`, error.message);
      throw error;
    }
  }
}

module.exports = new ResourceServiceClient();
