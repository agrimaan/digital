

const ResilientHttpClient = require('./resilient-http-client');
const ServiceDiscovery = require('../service-discovery/service-discovery');

class BulkUploadServiceClient {
  constructor() {
    this.serviceDiscovery = new ServiceDiscovery();
    this.httpClient = new ResilientHttpClient({
      serviceName: 'user-service', // Assuming bulk uploads are handled by user service
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

  async getBulkUploadStats() {
    try {
      const serviceUrl = await this.serviceDiscovery.getServiceUrl('user-service');
      const response = await this.httpClient.get(`${serviceUrl}/api/admin/bulk-upload-stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching bulk upload stats:', error.message);
      return {
        totalUploads: 0,
        uploadsByStatus: {},
        totalRecords: 0
      };
    }
  }

  async getAllBulkUploads() {
    try {
      const serviceUrl = await this.serviceDiscovery.getServiceUrl('user-service');
      const response = await this.httpClient.get(`${serviceUrl}/api/admin/bulk-uploads`);
      return response.data;
    } catch (error) {
      console.error('Error fetching all bulk uploads:', error.message);
      return [];
    }
  }

  async getBulkUploadById(uploadId) {
    try {
      const serviceUrl = await this.serviceDiscovery.getServiceUrl('user-service');
      const response = await this.httpClient.get(`${serviceUrl}/api/admin/bulk-uploads/${uploadId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get bulk upload ${uploadId}:`, error.message);
      throw error;
    }
  }
}
