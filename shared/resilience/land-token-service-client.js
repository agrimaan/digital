

const ResilientHttpClient = require('./resilient-http-client');
const ServiceDiscovery = require('../service-discovery/service-discovery');

class LandTokenServiceClient {
  constructor() {
    this.serviceDiscovery = new ServiceDiscovery();
    this.httpClient = new ResilientHttpClient({
      serviceName: 'blockchain-service',
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

  async getLandTokenStats() {
    try {
      const serviceUrl = await this.serviceDiscovery.getServiceUrl('blockchain-service');
      const response = await this.httpClient.get(`${serviceUrl}/api/admin/land-token-stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching land token stats:', error.message);
      return {
        totalLandTokens: 0,
        landTokensByStatus: {},
        verifiedLandTokens: 0
      };
    }
  }

  async getPendingTokens() {
    try {
      const serviceUrl = await this.serviceDiscovery.getServiceUrl('blockchain-service');
      const response = await this.httpClient.get(`${serviceUrl}/api/admin/land-tokens/pending`);
      return response.data;
    } catch (error) {
      console.error('Error fetching pending tokens:', error.message);
      return [];
    }
  }

  async getAllTokens() {
    try {
      const serviceUrl = await this.serviceDiscovery.getServiceUrl('blockchain-service');
      const response = await this.httpClient.get(`${serviceUrl}/api/admin/land-tokens`);
      return response.data;
    } catch (error) {
      console.error('Error fetching all tokens:', error.message);
      return [];
    }
  }

  async getTokenById(tokenId) {
    try {
      const serviceUrl = await this.serviceDiscovery.getServiceUrl('blockchain-service');
      const response = await this.httpClient.get(`${serviceUrl}/api/land-tokens/${tokenId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get token ${tokenId}:`, error.message);
      throw error;
    }
  }
}
