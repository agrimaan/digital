/**
 * Independent Order Service Client for Admin Service
 * 
 * This module provides a resilient client for interacting with the marketplace-service
 * for order-related operations.
 */

const IndependentHttpClient = require('./http-client');
const IndependentServiceDiscovery = require('./service-discovery');

class IndependentOrderServiceClient {
  constructor() {
    this.serviceDiscovery = new IndependentServiceDiscovery();
    this.httpClient = new IndependentHttpClient({
      serviceName: 'marketplace-service',
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
   * Get order by ID
   */
  async getOrderById(orderId) {
    try {
      const response = await this.httpClient.get(`/api/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get order ${orderId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get all orders
   */
  async getAllOrders(params = {}) {
    try {
      const response = await this.httpClient.get('/api/orders', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to get all orders:', error.message);
      throw error;
    }
  }

  /**
   * Get orders by status
   */
  async getOrdersByStatus(status) {
    try {
      const response = await this.httpClient.get(`/api/orders/status/${status}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get orders by status ${status}:`, error.message);
      throw error;
    }
  }

  /**
   * Get orders by buyer
   */
  async getOrdersByBuyer(buyerId) {
    try {
      const response = await this.httpClient.get(`/api/orders/buyer/${buyerId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get orders by buyer ${buyerId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get orders by seller
   */
  async getOrdersBySeller(sellerId) {
    try {
      const response = await this.httpClient.get(`/api/orders/seller/${sellerId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get orders by seller ${sellerId}:`, error.message);
      throw error;
    }
  }

  /**
   * Create order
   */
  async createOrder(orderData) {
    try {
      const response = await this.httpClient.post('/api/orders', orderData);
      return response.data;
    } catch (error) {
      console.error('Failed to create order:', error.message);
      throw error;
    }
  }

  /**
   * Update order
   */
  async updateOrder(orderId, orderData) {
    try {
      const response = await this.httpClient.put(`/api/orders/${orderId}`, orderData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update order ${orderId}:`, error.message);
      throw error;
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId, status) {
    try {
      const response = await this.httpClient.patch(`/api/orders/${orderId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error(`Failed to update order status ${orderId}:`, error.message);
      throw error;
    }
  }

  /**
   * Delete order
   */
  async deleteOrder(orderId) {
    try {
      const response = await this.httpClient.delete(`/api/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to delete order ${orderId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get recent orders
   */
  async getRecentOrders(limit = 10) {
    try {
      const response = await this.httpClient.get('/api/orders/recent', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get recent orders:', error.message);
      // Return empty array instead of throwing to prevent dashboard from breaking
      return [];
    }
  }

  /**
   * Get order statistics
   */
  async getOrderStats() {
    try {
      const response = await this.httpClient.get('/api/orders/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to get order statistics:', error.message);
      // Return default stats instead of throwing
      return {
        totalOrders: 0,
        ordersByStatus: {},
        recentOrders: []
      };
    }
  }
}

module.exports = IndependentOrderServiceClient;