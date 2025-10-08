

const ResilientHttpClient = require('./resilient-http-client');
const ServiceDiscovery = require('../service-discovery/service-discovery');

class OrderServiceClient {
  constructor() {
    this.serviceDiscovery = new ServiceDiscovery();
    this.httpClient = new ResilientHttpClient({
      serviceName: 'marketplace-service',
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

  async getOrderStats() {
    try {
      const serviceUrl = await this.serviceDiscovery.getServiceUrl('marketplace-service');
      const response = await this.httpClient.get(`${serviceUrl}/api/admin/order-stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order stats:', error.message);
      return {
        totalOrders: 0,
        ordersByStatus: {},
        totalRevenue: 0
      };
    }
  }

  async getRecentOrders(limit = 5) {
    try {
      const serviceUrl = await this.serviceDiscovery.getServiceUrl('marketplace-service');
      const response = await this.httpClient.get(`${serviceUrl}/api/admin/orders/recent?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recent orders:', error.message);
      return [];
    }
  }

  async getAllOrders() {
    try {
      const serviceUrl = await this.serviceDiscovery.getServiceUrl('marketplace-service');
      const response = await this.httpClient.get(`${serviceUrl}/api/admin/orders`);
      return response.data;
    } catch (error) {
      console.error('Error fetching all orders:', error.message);
      return [];
    }
  }

  async getOrderById(orderId) {
    try {
      const serviceUrl = await this.serviceDiscovery.getServiceUrl('marketplace-service');
      const response = await this.httpClient.get(`${serviceUrl}/api/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get order ${orderId}:`, error.message);
      throw error;
    }
  }
}

module.exports = new OrderServiceClient();
