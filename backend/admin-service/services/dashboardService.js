const {
  userService,
  fieldService,
  cropService,
  iotService,
  marketplaceService,
  resourceService,
  blockchainService,
  adminService
} = require('./serviceClient');
const logger = require('../utils/logger');

/**
 * Dashboard Service - Aggregates data from multiple services
 */
class DashboardService {
  /**
   * Get complete dashboard statistics
   */
  async getDashboardStats() {
    try {
      logger.info('Fetching dashboard statistics from all services');

      // Fetch data from all services in parallel with error handling
      const [
        usersResult,
        fieldsResult,
        cropsResult,
        sensorsResult,
        ordersResult,
        resourcesResult,
        landTokensResult,
        bulkUploadsResult
      ] = await Promise.allSettled([
        this.getUsersStats(),
        this.getFieldsCount(),
        this.getCropsCount(),
        this.getSensorsCount(),
        this.getOrdersCount(),
        this.getResourcesCount(),
        this.getLandTokensCount(),
        this.getBulkUploadsCount()
      ]);

      // Extract values or use defaults
      const usersStats = usersResult.status === 'fulfilled' ? usersResult.value : { total: 10, byRole: {} };
      console.log("userStats:", usersStats);
      const fieldsCount = fieldsResult.status === 'fulfilled' ? fieldsResult.value : 0;
      const cropsCount = cropsResult.status === 'fulfilled' ? cropsResult.value : 0;
      const sensorsCount = sensorsResult.status === 'fulfilled' ? sensorsResult.value : 0;
      const ordersCount = ordersResult.status === 'fulfilled' ? ordersResult.value : 0;
      const resourcesCount = resourcesResult.status === 'fulfilled' ? resourcesResult.value : 0;
      const landTokensCount = landTokensResult.status === 'fulfilled' ? landTokensResult.value : 0;
      const bulkUploadsCount = bulkUploadsResult.status === 'fulfilled' ? bulkUploadsResult.value : 0;

      // Get verification stats
      const verificationStats = await this.getVerificationStats();

      return {
        users: usersStats.total,
        fields: fieldsCount,
        crops: cropsCount,
        sensors: sensorsCount,
        orders: ordersCount,
        resources: resourcesCount,
        landTokens: landTokensCount,
        bulkUploads: bulkUploadsCount,
        usersByRole: usersStats.byRole,
        verificationStats
      };
    } catch (error) {
      logger.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get users statistics including count by role
   */
  async getUsersStats() {
    try {
      const usersData = await userService.getUsers();
      const users = usersData.data || usersData || [];

      const usersByRole = {
        farmers: 0,
        buyers: 0,
        agronomists: 0,
        investors: 0,
        admins: 0
      };

      users.forEach(user => {
        if (usersByRole.hasOwnProperty(user.role + 's')) {
          usersByRole[user.role + 's']++;
        } else if (usersByRole.hasOwnProperty(user.role)) {
          usersByRole[user.role]++;
        }
      });
      console.log("users.length within DashboardService in admin-service:", users.length);
      return {
        total: users.length,
        byRole: usersByRole
      };
    } catch (error) {
      logger.error('Error fetching users stats:', error);
      return { total: 0, byRole: {} };
    }
  }

  /**
   * Get fields count
   */
  async getFieldsCount() {
    try {
      const response = await fieldService.getFields();
      const fields = response.data || response || [];
      return Array.isArray(fields) ? fields.length : 0;
    } catch (error) {
      logger.error('Error fetching fields count:', error);
      return 0;
    }
  }

  /**
   * Get crops count
   */
  async getCropsCount() {
    try {
      const response = await cropService.getCrops();
      const crops = response.data || response || [];
      return Array.isArray(crops) ? crops.length : 0;
    } catch (error) {
      logger.error('Error fetching crops count:', error);
      return 0;
    }
  }

  /**
   * Get sensors count
   */
  async getSensorsCount() {
    try {
      const response = await iotService.getSensors();
      const sensors = response.data || response || [];
      return Array.isArray(sensors) ? sensors.length : 0;
    } catch (error) {
      logger.error('Error fetching sensors count:', error);
      return 0;
    }
  }

  /**
   * Get orders count
   */
  async getOrdersCount() {
    try {
      const response = await marketplaceService.getOrders();
      const orders = response.data || response || [];
      return Array.isArray(orders) ? orders.length : 0;
    } catch (error) {
      logger.error('Error fetching orders count:', error);
      return 0;
    }
  }

  /**
   * Get resources count
   */
  async getResourcesCount() {
    try {
      const response = await resourceService.getResources();
      const resources = response.data || response || [];
      return Array.isArray(resources) ? resources.length : 0;
    } catch (error) {
      logger.error('Error fetching resources count:', error);
      return 0;
    }
  }

  /**
   * Get land tokens count
   */
  async getLandTokensCount() {
    try {
      const response = await blockchainService.getLandTokens({ tokenType: 'Fields' });
      const tokens = response.data || response || [];
      return Array.isArray(tokens) ? tokens.length : 0;
    } catch (error) {
      logger.error('Error fetching land tokens count:', error);
      return 0;
    }
  }

  /**
   * Get bulk uploads count
   */
  async getBulkUploadsCount() {
    try {
      const response = await adminService.getBulkUploads();
      const uploads = response.data || response || [];
      return Array.isArray(uploads) ? uploads.length : 0;
    } catch (error) {
      logger.error('Error fetching bulk uploads count:', error);
      return 0;
    }
  }

  /**
   * Get recent users
   */
  async getRecentUsers(limit = 10) {
    try {
      const response = await userService.getRecentUsers(limit);
      return response.data || response || [];
    } catch (error) {
      logger.error('Error fetching recent users:', error);
      return [];
    }
  }

  /**
   * Get recent orders
   */
  async getRecentOrders(limit = 10) {
    try {
      const response = await marketplaceService.getRecentOrders(limit);
      return response.data || response || [];
    } catch (error) {
      logger.error('Error fetching recent orders:', error);
      return [];
    }
  }

  /**
   * Get verification statistics
   */
  async getVerificationStats() {
    try {
      const [usersData, landTokensData, bulkUploadsData] = await Promise.allSettled([
        userService.getUsers(),
        blockchainService.getLandTokens({ tokenType: 'Fields' }),
        adminService.getBulkUploads()
      ]);

      let pendingUsers = 0;
      let pendingLandTokens = 0;
      let pendingBulkUploads = 0;

      // Count pending users
      if (usersData.status === 'fulfilled') {
        const users = usersData.value.data || usersData.value || [];
        pendingUsers = users.filter(u => u.verificationStatus === 'pending').length;
      }

      // Count pending land tokens
      if (landTokensData.status === 'fulfilled') {
        const tokens = landTokensData.value.data || landTokensData.value || [];
        pendingLandTokens = tokens.filter(t => t.verification?.status === 'pending').length;
      }

      // Count pending bulk uploads
      if (bulkUploadsData.status === 'fulfilled') {
        const uploads = bulkUploadsData.value.data || bulkUploadsData.value || [];
        pendingBulkUploads = uploads.filter(u => u.status === 'pending').length;
      }

      return {
        pendingUsers,
        pendingLandTokens,
        pendingBulkUploads
      };
    } catch (error) {
      logger.error('Error fetching verification stats:', error);
      return {
        pendingUsers: 0,
        pendingLandTokens: 0,
        pendingBulkUploads: 0
      };
    }
  }

  /**
   * Get system health status
   */
  async getSystemHealth() {
    try {
      const response = await adminService.getSystemHealth();
      return response.data || response || {
        otpEnabled: false,
        emailConfigured: false,
        smsConfigured: false,
        oauthConfigured: false
      };
    } catch (error) {
      logger.error('Error fetching system health:', error);
      return {
        otpEnabled: false,
        emailConfigured: false,
        smsConfigured: false,
        oauthConfigured: false
      };
    }
  }

  /**
   * Get all resources
   */
  async getResources() {
    try {
      const response = await resourceService.getResources();
      return response.data || response || [];
    } catch (error) {
      logger.error('Error fetching resources:', error);
      return [];
    }
  }

  /**
   * Get all land tokens
   */
  async getLandTokens() {
    try {
      const response = await blockchainService.getLandTokens({ tokenType: 'Fields' });
      return response.data || response || [];
    } catch (error) {
      logger.error('Error fetching land tokens:', error);
      return [];
    }
  }

  /**
   * Get all bulk uploads
   */
  async getBulkUploads() {
    try {
      const response = await adminService.getBulkUploads();
      return response.data || response || [];
    } catch (error) {
      logger.error('Error fetching bulk uploads:', error);
      return [];
    }
  }
}

module.exports = new DashboardService();