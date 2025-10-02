const axios = require('axios');

/**
 * Get system overview statistics
 * @returns {Object} System overview statistics
 */
exports.getSystemOverview = async () => {
  try {
    // Get user statistics
    const userStats = await getUserStatistics();
    
    // Get marketplace statistics
    const marketplaceStats = await getMarketplaceStatistics();
    
    // Get crop statistics
    const cropStats = await getCropStatistics();
    
    // Get IoT device statistics
    const iotStats = await getIoTStatistics();
    
    // Get weather statistics
    const weatherStats = await getWeatherStatistics();
    
    // Get logistics statistics
    const logisticsStats = await getLogisticsStatistics();
    
    return {
      users: userStats,
      marketplace: marketplaceStats,
      crops: cropStats,
      iot: iotStats,
      weather: weatherStats,
      logistics: logisticsStats
    };
  } catch (error) {
    console.error('Get system overview error:', error);
    throw new Error(`Failed to get system overview: ${error.message}`);
  }
};

/**
 * Get user statistics
 * @param {Object} filters - Filter criteria
 * @returns {Object} User statistics
 */
exports.getUserStatistics = async (filters = {}) => {
  try {
    return await getUserStatistics(filters);
  } catch (error) {
    console.error('Get user statistics error:', error);
    throw new Error(`Failed to get user statistics: ${error.message}`);
  }
};

/**
 * Get marketplace statistics
 * @param {Object} filters - Filter criteria
 * @returns {Object} Marketplace statistics
 */
exports.getMarketplaceStatistics = async (filters = {}) => {
  try {
    return await getMarketplaceStatistics(filters);
  } catch (error) {
    console.error('Get marketplace statistics error:', error);
    throw new Error(`Failed to get marketplace statistics: ${error.message}`);
  }
};

/**
 * Get crop statistics
 * @param {Object} filters - Filter criteria
 * @returns {Object} Crop statistics
 */
exports.getCropStatistics = async (filters = {}) => {
  try {
    return await getCropStatistics(filters);
  } catch (error) {
    console.error('Get crop statistics error:', error);
    throw new Error(`Failed to get crop statistics: ${error.message}`);
  }
};

/**
 * Get IoT device statistics
 * @param {Object} filters - Filter criteria
 * @returns {Object} IoT device statistics
 */
exports.getIoTStatistics = async (filters = {}) => {
  try {
    return await getIoTStatistics(filters);
  } catch (error) {
    console.error('Get IoT statistics error:', error);
    throw new Error(`Failed to get IoT statistics: ${error.message}`);
  }
};

/**
 * Get weather statistics
 * @param {Object} filters - Filter criteria
 * @returns {Object} Weather statistics
 */
exports.getWeatherStatistics = async (filters = {}) => {
  try {
    return await getWeatherStatistics(filters);
  } catch (error) {
    console.error('Get weather statistics error:', error);
    throw new Error(`Failed to get weather statistics: ${error.message}`);
  }
};

/**
 * Get logistics statistics
 * @param {Object} filters - Filter criteria
 * @returns {Object} Logistics statistics
 */
exports.getLogisticsStatistics = async (filters = {}) => {
  try {
    return await getLogisticsStatistics(filters);
  } catch (error) {
    console.error('Get logistics statistics error:', error);
    throw new Error(`Failed to get logistics statistics: ${error.message}`);
  }
};

/**
 * Get revenue statistics
 * @param {Object} filters - Filter criteria
 * @returns {Object} Revenue statistics
 */
exports.getRevenueStatistics = async (filters = {}) => {
  try {
    // Call marketplace service for revenue data
    const response = await axios.get(`${process.env.MARKETPLACE_SERVICE_URL}/api/analytics/revenue`, {
      params: filters
    });
    
    return response.data;
  } catch (error) {
    console.error('Get revenue statistics error:', error);
    throw new Error(`Failed to get revenue statistics: ${error.message}`);
  }
};

/**
 * Get order statistics
 * @param {Object} filters - Filter criteria
 * @returns {Object} Order statistics
 */
exports.getOrderStatistics = async (filters = {}) => {
  try {
    // Call marketplace service for order data
    const response = await axios.get(`${process.env.MARKETPLACE_SERVICE_URL}/api/analytics/orders`, {
      params: filters
    });
    
    return response.data;
  } catch (error) {
    console.error('Get order statistics error:', error);
    throw new Error(`Failed to get order statistics: ${error.message}`);
  }
};

/**
 * Get field statistics
 * @param {Object} filters - Filter criteria
 * @returns {Object} Field statistics
 */
exports.getFieldStatistics = async (filters = {}) => {
  try {
    // Call field service for field data
    const response = await axios.get(`${process.env.FIELD_SERVICE_URL}/api/analytics/fields`, {
      params: filters
    });
    
    return response.data;
  } catch (error) {
    console.error('Get field statistics error:', error);
    throw new Error(`Failed to get field statistics: ${error.message}`);
  }
};

/**
 * Get system health statistics
 * @returns {Object} System health statistics
 */
exports.getSystemHealth = async () => {
  try {
    // Check health of all services
    const services = [
      { name: 'user-service', url: process.env.USER_SERVICE_URL },
      { name: 'field-service', url: process.env.FIELD_SERVICE_URL },
      { name: 'iot-service', url: process.env.IOT_SERVICE_URL },
      { name: 'crop-service', url: process.env.CROP_SERVICE_URL },
      { name: 'marketplace-service', url: process.env.MARKETPLACE_SERVICE_URL },
      { name: 'logistics-service', url: process.env.LOGISTICS_SERVICE_URL },
      { name: 'weather-service', url: process.env.WEATHER_SERVICE_URL },
      { name: 'analytics-service', url: process.env.ANALYTICS_SERVICE_URL },
      { name: 'notification-service', url: process.env.NOTIFICATION_SERVICE_URL },
      { name: 'blockchain-service', url: process.env.BLOCKCHAIN_SERVICE_URL }
    ];
    
    const healthChecks = await Promise.all(
      services.map(async (service) => {
        try {
          const response = await axios.get(`${service.url}/health`, { timeout: 5000 });
          return {
            service: service.name,
            status: response.data.status || 'UP',
            details: response.data
          };
        } catch (error) {
          return {
            service: service.name,
            status: 'DOWN',
            error: error.message
          };
        }
      })
    );
    
    // Calculate overall status
    const overallStatus = healthChecks.every(check => check.status === 'UP') ? 'UP' : 'DEGRADED';
    
    return {
      status: overallStatus,
      timestamp: new Date(),
      services: healthChecks
    };
  } catch (error) {
    console.error('Get system health error:', error);
    throw new Error(`Failed to get system health: ${error.message}`);
  }
};

// Helper functions to fetch data from other services

async function getUserStatistics(filters = {}) {
  try {
    const response = await axios.get(`${process.env.USER_SERVICE_URL}/api/analytics/users`, {
      params: filters
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    return {
      error: 'Failed to fetch user statistics',
      totalUsers: 0,
      newUsers: 0,
      activeUsers: 0,
      userTypes: {}
    };
  }
}

async function getMarketplaceStatistics(filters = {}) {
  try {
    const response = await axios.get(`${process.env.MARKETPLACE_SERVICE_URL}/api/analytics/overview`, {
      params: filters
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching marketplace statistics:', error);
    return {
      error: 'Failed to fetch marketplace statistics',
      totalOrders: 0,
      totalRevenue: 0,
      totalProducts: 0,
      averageOrderValue: 0
    };
  }
}

async function getCropStatistics(filters = {}) {
  try {
    const response = await axios.get(`${process.env.CROP_SERVICE_URL}/api/analytics/overview`, {
      params: filters
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching crop statistics:', error);
    return {
      error: 'Failed to fetch crop statistics',
      totalCrops: 0,
      activeCrops: 0,
      cropTypes: {}
    };
  }
}

async function getIoTStatistics(filters = {}) {
  try {
    const response = await axios.get(`${process.env.IOT_SERVICE_URL}/api/analytics/overview`, {
      params: filters
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching IoT statistics:', error);
    return {
      error: 'Failed to fetch IoT statistics',
      totalDevices: 0,
      activeDevices: 0,
      deviceTypes: {}
    };
  }
}

async function getWeatherStatistics(filters = {}) {
  try {
    const response = await axios.get(`${process.env.WEATHER_SERVICE_URL}/api/analytics/overview`, {
      params: filters
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching weather statistics:', error);
    return {
      error: 'Failed to fetch weather statistics',
      weatherAlerts: 0,
      regions: {}
    };
  }
}

async function getLogisticsStatistics(filters = {}) {
  try {
    const response = await axios.get(`${process.env.LOGISTICS_SERVICE_URL}/api/analytics/overview`, {
      params: filters
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching logistics statistics:', error);
    return {
      error: 'Failed to fetch logistics statistics',
      totalShipments: 0,
      activeShipments: 0,
      deliveredShipments: 0,
      averageDeliveryTime: 0
    };
  }
}