
/**
 * Independent Land Token Service Client for Admin Service
 * 
 * This module provides a resilient client for interacting with the blockchain-service
 * without depending on the shared project.
 */

const IndependentHttpClient = require('./http-client');
const IndependentServiceDiscovery = require('./service-discovery');

class IndependentLandTokenServiceClient {
  constructor() {
    this.serviceDiscovery = new IndependentServiceDiscovery();
    this.httpClient = new IndependentHttpClient({
      serviceName: 'blockchain-service',
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
   * Get land token by ID
   */
  async getLandTokenById(tokenId) {
    try {
      const response = await this.httpClient.get(`/api/land-tokens/${tokenId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get land token ${tokenId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get land tokens by field
   */
  async getLandTokensByField(fieldId) {
    try {
      const response = await this.httpClient.get(`/api/land-tokens/field/${fieldId}`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return [];
      }
      console.error(`Failed to get land tokens by field ${fieldId}:`, error.message);
      throw error;
    }
  }

  /**
   * Create land token
   */
  async createLandToken(tokenData) {
    try {
      const response = await this.httpClient.post('/api/land-tokens', tokenData);
      return response.data;
    } catch (error) {
      console.error('Failed to create land token:', error.message);
      throw error;
    }
  }

  /**
   * Update land token
   */
  async updateLandToken(tokenId, tokenData) {
    try {
      const response = await this.httpClient.put(`/api/land-tokens/${tokenId}`, tokenData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update land token ${tokenId}:`, error.message);
      throw error;
    }
  }

  /**
   * Delete land token
   */
  async deleteLandToken(tokenId) {
    try {
      const response = await this.httpClient.delete(`/api/land-tokens/${tokenId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to delete land token ${tokenId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get all land tokens
   */
  async getAllLandTokens() {
    try {
      const response = await this.httpClient.get('/api/land-tokens');
      return response.data;
    } catch (error) {
      console.error('Failed to get all land tokens:', error.message);
      throw error;
    }
  }

  /**
   * Get land tokens by owner
   */
  async getLandTokensByOwner(ownerId) {
    try {
      const response = await this.httpClient.get(`/api/land-tokens/owner/${ownerId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get land tokens by owner ${ownerId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get land token transactions
   */
  async getLandTokenTransactions(tokenId) {
    try {
      const response = await this.httpClient.get(`/api/land-tokens/${tokenId}/transactions`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get land token transactions for ${tokenId}:`, error.message);
      throw error;
    }
  }

  /**
   * Transfer land token
   */
  async transferLandToken(tokenId, transferData) {
    try {
      const response = await this.httpClient.post(`/api/land-tokens/${tokenId}/transfer`, transferData);
      return response.data;
    } catch (error) {
      console.error(`Failed to transfer land token ${tokenId}:`, error.message);
      throw error;
    }
  }

  /**
   * Search land tokens
   */
  async searchLandTokens(query) {
    try {
      const response = await this.httpClient.get('/api/land-tokens/search', {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to search land tokens with query ${query}:`, error.message);
      throw error;
    }
  }
}

module.exports = IndependentLandTokenServiceClient;
