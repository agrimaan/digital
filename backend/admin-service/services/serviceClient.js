const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Base service client with common functionality
 */
class BaseServiceClient {
  constructor(baseURL, serviceName) {
    this.serviceName = serviceName;
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.info(`${serviceName} request:`, {
          method: config.method,
          url: config.url
        });
        return config;
      },
      (error) => {
        logger.error(`${serviceName} request error:`, error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.info(`${serviceName} response:`, {
          status: response.status,
          url: response.config.url
        });
        return response;
      },
      (error) => {
        logger.error(`${serviceName} response error:`, {
          message: error.message,
          status: error.response?.status,
          url: error.config?.url
        });
        return Promise.reject(error);
      }
    );
  }

  async get(url, config = {}) {
    try {
      const response = await this.client.get(url, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async post(url, data, config = {}) {
    try {
      const response = await this.client.post(url, data, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async put(url, data, config = {}) {
    try {
      const response = await this.client.put(url, data, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async delete(url, config = {}) {
    try {
      const response = await this.client.delete(url, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response) {
      // Server responded with error status
      throw {
        service: this.serviceName,
        status: error.response.status,
        message: error.response.data?.message || 'Service error',
        data: error.response.data
      };
    } else if (error.request) {
      // Request made but no response
      throw {
        service: this.serviceName,
        message: `${this.serviceName} is unavailable`,
        error: 'SERVICE_UNAVAILABLE'
      };
    } else {
      // Error in request setup
      throw {
        service: this.serviceName,
        message: error.message,
        error: 'REQUEST_ERROR'
      };
    }
  }
}

/**
 * User Service Client
 */
class UserServiceClient extends BaseServiceClient {
  constructor() {
    super(process.env.USER_SERVICE_URL, 'user-service');
  }

  async getUsers(params = {}) {
    return this.get('/api/internal/users', { params });
  }

  async getUserById(userId) {
    return this.get(`/api/internal/users/${userId}`);
  }

  async getUsersCount() {
    return this.get('/api/internal/users/count');
  }

  async getUsersByRole(role) {
    return this.get(`/api/internal/users/role/${role}`);
  }

  async getRecentUsers(limit = 10) {
    return this.get('/api/internal/users/recent', { params: { limit } });
  }

  async updateUser(userId, data) {
    return this.put(`/api/internal/users/${userId}`, data);
  }

  async deleteUser(userId) {
    return this.delete(`/api/internal/users/${userId}`);
  }
}

/**
 * Field Service Client
 */
class FieldServiceClient extends BaseServiceClient {
  constructor() {
    super(process.env.FIELD_SERVICE_URL, 'field-service');
  }

  async getFields(params = {}) {
    return this.get('/api/fields', { params });
  }

  async getFieldsCount() {
    return this.get('/api/fields/count');
  }

  async getFieldById(fieldId) {
    return this.get(`/api/fields/${fieldId}`);
  }
}

/**
 * Crop Service Client
 */
class CropServiceClient extends BaseServiceClient {
  constructor() {
    super(process.env.CROP_SERVICE_URL, 'crop-service');
  }

  async getCrops(params = {}) {
    return this.get('/api/crops', { params });
  }

  async getCropsCount() {
    return this.get('/api/crops/count');
  }

  async getCropById(cropId) {
    return this.get(`/api/crops/${cropId}`);
  }
}

/**
 * IoT Service Client
 */
class IoTServiceClient extends BaseServiceClient {
  constructor() {
    super(process.env.IOT_SERVICE_URL, 'iot-service');
  }

  async getSensors(params = {}) {
    return this.get('/api/sensors', { params });
  }

  async getSensorsCount() {
    return this.get('/api/sensors/count');
  }

  async getSensorById(sensorId) {
    return this.get(`/api/sensors/${sensorId}`);
  }
}

/**
 * Marketplace Service Client
 */
class MarketplaceServiceClient extends BaseServiceClient {
  constructor() {
    super(process.env.MARKETPLACE_SERVICE_URL, 'marketplace-service');
  }

  async getOrders(params = {}) {
    return this.get('/api/marketplace/orders', { params });
  }

  async getOrdersCount() {
    return this.get('/api/marketplace/orders/count');
  }

  async getRecentOrders(limit = 10) {
    return this.get('/api/marketplace/orders/recent', { params: { limit } });
  }

  async getOrderById(orderId) {
    return this.get(`/api/marketplace/orders/${orderId}`);
  }
}

/**
 * Resource Service Client
 */
class ResourceServiceClient extends BaseServiceClient {
  constructor() {
    super(process.env.RESOURCE_SERVICE_URL, 'resource-service');
  }

  async getResources(params = {}) {
    return this.get('/api/resources', { params });
  }

  async getResourcesCount() {
    return this.get('/api/resources/count');
  }

  async getResourceById(resourceId) {
    return this.get(`/api/resources/${resourceId}`);
  }

  async createResource(data) {
    return this.post('/api/resources', data);
  }

  async updateResource(resourceId, data) {
    return this.put(`/api/resources/${resourceId}`, data);
  }

  async deleteResource(resourceId) {
    return this.delete(`/api/resources/${resourceId}`);
  }
}

/**
 * Blockchain Service Client
 */
class BlockchainServiceClient extends BaseServiceClient {
  constructor() {
    super(process.env.BLOCKCHAIN_SERVICE_URL, 'blockchain-service');
  }

  async getLandTokens(params = {}) {
    return this.get('/api/blockchain/tokens', { params });
  }

  async getLandTokensCount() {
    return this.get('/api/blockchain/tokens/count');
  }

  async getLandTokenById(tokenId) {
    return this.get(`/api/blockchain/tokens/${tokenId}`);
  }
}

/**
 * Admin Service Client
 */
class AdminServiceClient extends BaseServiceClient {
  constructor() {
    super(process.env.ADMIN_SERVICE_URL, 'admin-service');
  }

  async getBulkUploads(params = {}) {
    return this.get('/api/admin/bulk-uploads', { params });
  }

  async getBulkUploadsCount() {
    return this.get('/api/admin/bulk-uploads/count');
  }

  async getSystemHealth() {
    return this.get('/api/admin/system/health');
  }
}

// Create singleton instances
const userService = new UserServiceClient();
const fieldService = new FieldServiceClient();
const cropService = new CropServiceClient();
const iotService = new IoTServiceClient();
const marketplaceService = new MarketplaceServiceClient();
const resourceService = new ResourceServiceClient();
const blockchainService = new BlockchainServiceClient();
const adminService = new AdminServiceClient();

module.exports = {
  userService,
  fieldService,
  cropService,
  iotService,
  marketplaceService,
  resourceService,
  blockchainService,
  adminService
};