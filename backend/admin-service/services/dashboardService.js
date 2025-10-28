const axios = require('axios');

// Service URLs with fallbacks - now using API gateway
const API_GATEWAY = process.env.API_GATEWAY_URL || 'http://localhost:3000';
const USER_SVC = process.env.USER_SERVICE_URL || 'http://localhost:3002';
const FIELD_SVC = process.env.FIELD_SERVICE_URL || 'http://localhost:3003';
const CROP_SVC = process.env.CROP_SERVICE_URL || 'http://localhost:3005';
const MARKETPLACE_SVC = process.env.MARKETPLACE_SERVICE_URL || 'http://localhost:3006';
const IOT_SVC = process.env.IOT_SERVICE_URL || 'http://localhost:3004';
const ANALYTICS_SVC = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3009';
const RESOURCE_SVC = process.env.RESOURCE_SERVICE_URL || 'http://localhost:3014';

// Helper function for HTTP requests via API gateway
const httpRequest = async (serviceUrl, endpoint, method = 'GET', data = null, headers = {}) => {
  try {
    // Use API gateway URL for all requests
    const gatewayEndpoint = `/api${endpoint}`;
    
    const config = {
      method,
      url: `${API_GATEWAY}${gatewayEndpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: 8000
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`HTTP request failed: ${method} ${API_GATEWAY}${endpoint}`, error.message);
    throw new Error(`Service request failed: ${error.message}`);
  }
};

// Helper to get aggregated data from multiple services
const getAggregatedData = async (requests) => {
  try {
    const results = await Promise.allSettled(requests);
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`Request ${index} failed:`, result.reason);
        return { error: result.reason.message, data: null };
      }
    });
  } catch (error) {
    console.error('Aggregation error:', error);
    throw new Error(`Data aggregation failed: ${error.message}`);
  }
};

/**
 * Get dashboard statistics from various services
 * @returns {Object} Aggregated dashboard statistics
 */
exports.getDashboardStats = async () => {
  try {
    // Parallel requests to all services for dashboard statistics
    const [
      userStats,
      fieldStats,
      cropStats,
      orderStats,
      sensorStats,
      resourceStats
    ] = await getAggregatedData([
      httpRequest(API_GATEWAY, '/api/users'),
      httpRequest(FIELD_SVC, '/api/fields'),
      httpRequest(CROP_SVC, '/api/crops'),
      httpRequest(MARKETPLACE_SVC, '/api/orders'),
      httpRequest(IOT_SVC, '/api/devices'),
      httpRequest(RESOURCE_SVC, '/api/resources')
    ]);

    // Extract counts from service data
    const usersCount = userStats.data?.totalUsers || 0;
    const fieldsCount = fieldStats.data?.totalFields || 0;
    const cropsCount = cropStats.data?.totalCrops || 0;
    const ordersCount = orderStats.data?.totalOrders || 0;
    const sensorsCount = sensorStats.data?.totalSensors || 0;
    const resourcesCount = resourceStats.data?.count || 0;

    // Construct dashboard stats object
    const dashboardStats = {
      users: usersCount,
      fields: fieldsCount,
      crops: cropsCount,
      orders: ordersCount,
      sensors: sensorsCount,
      resources: resourcesCount,
      usersByRole: userStats.data?.usersByRole || {
        farmers: 0,
        buyers: 0,
        agronomists: 0,
        investors: 0,
        admins: 0
      },
      verificationStats: userStats.data?.verificationStats || {
        pendingUsers: 0,
        pendingLandTokens: 0,
        pendingBulkUploads: 0
      }
    };

    return dashboardStats;
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    // Return fallback dashboard stats with empty data
    return {
      users: 0,
      fields: 0,
      crops: 0,
      orders: 0,
      sensors: 0,
      resources: 0,
      usersByRole: {
        farmers: 0,
        buyers: 0,
        agronomists: 0,
        investors: 0,
        admins: 0
      },
      verificationStats: {
        pendingUsers: 0,
        pendingLandTokens: 0,
        pendingBulkUploads: 0
      }
    };
  }
};

/**
 * Get recent users
 * @param {number} limit - Number of recent users to retrieve
 * @returns {Array} List of recent users
 */
exports.getRecentUsers = async (limit = 10) => {
  try {
    const response = await httpRequest(USER_SVC, `/api/users/recent?limit=${limit}`);
    return response.data?.users || response.users || [];
  } catch (error) {
    console.error(`Get recent users error:`, error);
    return [];
  }
};

/**
 * Get recent orders
 * @param {number} limit - Number of recent orders to retrieve
 * @returns {Array} List of recent orders
 */
exports.getRecentOrders = async (limit = 10) => {
  try {
    const response = await httpRequest(MARKETPLACE_SVC, `/api/marketplace/orders/recent?limit=${limit}`);
    return response.data?.orders || response.orders || [];
  } catch (error) {
    console.error(`Get recent orders error:`, error);
    return [];
  }
};

/**
 * Get system health status
 * @returns {Object} System health information
 */
exports.getSystemHealth = async () => {
  try {
    const response = await httpRequest(ANALYTICS_SVC, '/api/analytics/health');
    return response.data?.health || response.health || { status: 'unknown', services: [] };
  } catch (error) {
    console.error('Get system health error:', error);
    return { status: 'unknown', services: [] };
  }
};