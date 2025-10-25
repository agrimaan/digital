
/**
 * Independent Dashboard Statistics Controller
 * 
 * Uses independent service clients instead of shared dependencies
 */

const asyncHandler = require('express-async-handler');
const IndependentUserServiceClient = require('../utils/user-service-client');
const IndependentFieldServiceClient = require('../utils/field-service-client');
const IndependentCropServiceClient = require('../utils/crop-service-client');
const IndependentSensorServiceClient = require('../utils/sensor-service-client');
const IndependentOrderServiceClient = require('../utils/order-service-client');
const bulkUploadService = require('../services/bulkUploadService');
const Settings = require('../models/SystemSettings');

// Initialize service clients
const userServiceClient = new IndependentUserServiceClient();
const fieldServiceClient = new IndependentFieldServiceClient();
const cropServiceClient = new IndependentCropServiceClient();
const sensorServiceClient = new IndependentSensorServiceClient();
const orderServiceClient = new IndependentOrderServiceClient();


// @desc    Get comprehensive dashboard statistics
// @route   GET /api/admin/dashboard/stats
// @access  Private/Admin
exports.getDashboardStats = asyncHandler(async (req, res, next) => {
  try {
    // Fetch data from all microservices in parallel
    const [
      userStats,
      fieldStats,
      cropStats,
      sensorStats,
      orderStats,
      bulkUploadStats
    ] = await Promise.all([
      getUserStats(),
      getFieldStats(),
      getCropStats(),
      getSensorStats(),
      getOrderStats(),
      bulkUploadService.getBulkUploadStats()
    ]);

    // Combine all statistics
    const dashboardStats = {
      counts: {
        users: userStats.totalUsers || 0,
        fields: fieldStats.totalFields || 0,
        crops: cropStats.totalCrops || 0,
        sensors: sensorStats.totalSensors || 0,
        orders: orderStats.totalOrders || 0,
        bulkUploads: bulkUploadStats.totalUploads || 0
      },
      usersByRole: userStats.usersByRole || {},
      fieldsByLocation: fieldStats.fieldsByLocation || {},
      cropsByStatus: cropStats.cropsByStatus || {},
      sensorsByType: sensorStats.sensorsByType || {},
      sensorsByStatus: sensorStats.sensorsByStatus || {},
      ordersByStatus: orderStats.ordersByStatus || {},
      recentUsers: userStats.recentUsers || [],
      recentFields: fieldStats.recentFields || [],
      recentCrops: cropStats.recentCrops || [],
      recentSensors: sensorStats.recentSensors || [],
      recentOrders: orderStats.recentOrders || [],
      recentUploads: bulkUploadStats.recentUploads || [],
      systemStatus: 'healthy',
      lastUpdated: new Date()
    };

    res.status(200).json({
      success: true,
      data: dashboardStats
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Helper function to get user statistics
async function getUserStats() {
  try {
    const response = await userServiceClient.getAllUsers();
    // Handle different response formats
    const users = Array.isArray(response) ? response : 
                  (response.data ? (Array.isArray(response.data) ? response.data : response.data.users || []) : 
                  (response.users || []));
    
    const totalUsers = users.length;
    const usersByRole = {};
    
    users.forEach(user => {
      const role = user.role || 'unknown';
      usersByRole[role] = (usersByRole[role] || 0) + 1;
    });

    return {
      totalUsers,
      usersByRole,
      recentUsers: users.slice(0, 5).map(user => ({
        id: user._id,
        name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown',
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }))
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return { totalUsers: 0, usersByRole: {}, recentUsers: [] };
  }
}

// Helper function to get field statistics
async function getFieldStats() {
  try {
    const response = await fieldServiceClient.getAllFields();
    // Handle different response formats
    const fields = Array.isArray(response) ? response : 
                   (response.data ? (Array.isArray(response.data) ? response.data : response.data.fields || []) : 
                   (response.fields || []));
    
    const totalFields = fields.length;
    const fieldsByLocation = {};
    
    fields.forEach(field => {
      const location = field.location || field.address?.city || 'Unknown';
      fieldsByLocation[location] = (fieldsByLocation[location] || 0) + 1;
    });

    return {
      totalFields,
      fieldsByLocation,
      recentFields: fields.slice(0, 5).map(field => ({
        id: field._id,
        name: field.name,
        location: field.location || field.address?.city || 'Unknown',
        area: field.area,
        createdAt: field.createdAt
      }))
    };
  } catch (error) {
    console.error('Error fetching field stats:', error);
    return { totalFields: 0, fieldsByLocation: {}, recentFields: [] };
  }
}

// Helper function to get crop statistics
async function getCropStats() {
  try {
    const response = await cropServiceClient.getAllCrops();
    // Handle different response formats
    const crops = Array.isArray(response) ? response : 
                  (response.data ? (Array.isArray(response.data) ? response.data : response.data.crops || []) : 
                  (response.crops || []));
    
    const totalCrops = crops.length;
    const cropsByStatus = {};
    
    crops.forEach(crop => {
      const status = crop.status || 'unknown';
      cropsByStatus[status] = (cropsByStatus[status] || 0) + 1;
    });

    return {
      totalCrops,
      cropsByStatus,
      recentCrops: crops.slice(0, 5).map(crop => ({
        id: crop._id,
        name: crop.name || crop.cropType,
        field: crop.field,
        status: crop.status,
        plantingDate: crop.plantingDate
      }))
    };
  } catch (error) {
    console.error('Error fetching crop stats:', error);
    return { totalCrops: 0, cropsByStatus: {}, recentCrops: [] };
  }
}

// Helper function to get sensor statistics
async function getSensorStats() {
  try {
    const response = await sensorServiceClient.getAllSensors();
    // Handle different response formats
    const sensors = Array.isArray(response) ? response : 
                    (response.data ? (Array.isArray(response.data) ? response.data : response.data.sensors || []) : 
                    (response.sensors || []));
    
    const totalSensors = sensors.length;
    const sensorsByType = {};
    const sensorsByStatus = {};
    
    sensors.forEach(sensor => {
      const type = sensor.type || 'unknown';
      const status = sensor.status || 'unknown';
      sensorsByType[type] = (sensorsByType[type] || 0) + 1;
      sensorsByStatus[status] = (sensorsByStatus[status] || 0) + 1;
    });

    return {
      totalSensors,
      sensorsByType,
      sensorsByStatus,
      recentSensors: sensors.slice(0, 5).map(sensor => ({
        id: sensor._id,
        name: sensor.name || sensor.deviceId,
        type: sensor.type,
        status: sensor.status,
        location: sensor.location || sensor.field
      }))
    };
  } catch (error) {
    console.error('Error fetching sensor stats:', error);
    return { totalSensors: 0, sensorsByType: {}, sensorsByStatus: {}, recentSensors: [] };
  }
}

// @desc    Get user statistics
// @route   GET /api/admin/dashboard/users/stats
// @access  Private/Admin
exports.getUserStats = asyncHandler(async (req, res, next) => {
  try {
    const userStats = await getUserStats();
    res.status(200).json({
      success: true,
      data: userStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user statistics'
    });
  }
});

// @desc    Get field statistics
// @route   GET /api/admin/dashboard/fields/stats
// @access  Private/Admin
exports.getFieldStats = asyncHandler(async (req, res, next) => {
  try {
    const fieldStats = await getFieldStats();
    res.status(200).json({
      success: true,
      data: fieldStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching field statistics'
    });
  }
});

// @desc    Get crop statistics
// @route   GET /api/admin/dashboard/crops/stats
// @access  Private/Admin
exports.getCropStats = asyncHandler(async (req, res, next) => {
  try {
    const cropStats = await getCropStats();
    res.status(200).json({
      success: true,
      data: cropStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching crop statistics'
    });
  }
});

// @desc    Get sensor statistics
// @route   GET /api/admin/dashboard/sensors/stats
// @access  Private/Admin
exports.getSensorStats = asyncHandler(async (req, res, next) => {
  try {
    const sensorStats = await getSensorStats();
    res.status(200).json({
      success: true,
      data: sensorStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sensor statistics'
    });
  }
});

// @desc    Get system health status
// @route   GET /api/admin/dashboard/system/health
// @access  Private/Admin
exports.getSystemHealth = asyncHandler(async (req, res, next) => {
  try {
    console.log('Fetching system health...');
    const healthStatus = {
      status: 'healthy',
      services: {
        userService: 'operational',
        fieldService: 'operational',
        cropService: 'operational',
        sensorService: 'operational',
        adminService: 'operational'
      },
      timestamp: new Date(),
      uptime: process.uptime()
    };

    res.status(200).json({
      success: true,
      data: healthStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching system health'
    });
  }
});

// @desc    Get bulk upload statistics
// @route   GET /api/admin/dashboard/bulk-uploads/stats
// @access  Private/Admin
exports.getBulkUploadStats = asyncHandler(async (req, res, next) => {
  try {
    const stats = await bulkUploadService.getBulkUploadStats();
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching bulk upload statistics'
    });
  }
});

// @desc    Get order statistics
// @route   GET /api/admin/dashboard/orders/stats
// @access  Private/Admin
exports.getOrderStats = asyncHandler(async (req, res, next) => {
  try {
    const orderStats = await getOrderStats();
    res.status(200).json({
      success: true,
      data: orderStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching order statistics'
    });
  }
});

// Helper function to get order statistics
async function getOrderStats() {
  try {
    const response = await orderServiceClient.getAllOrders();
    // Handle different response formats
    const orders = Array.isArray(response) ? response : 
                   (response.data ? (Array.isArray(response.data) ? response.data : response.data.orders || []) : 
                   (response.orders || []));
    
    const totalOrders = orders.length;
    const ordersByStatus = {};
    
    orders.forEach(order => {
      const status = order.status || 'unknown';
      ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;
    });

    return {
      totalOrders,
      ordersByStatus,
      recentOrders: orders.slice(0, 5).map(order => ({
        id: order._id,
        buyer: order.buyer,
        seller: order.seller,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt
      }))
    };
  } catch (error) {
    console.error('Error fetching order stats:', error);
    return { totalOrders: 0, ordersByStatus: {}, recentOrders: [] };
  }
}

// @desc    Get recent users
// @route   GET /api/admin/dashboard/users/recent
// @access  Private/Admin
exports.getRecentUsers = asyncHandler(async (req, res, next) => {
  try {
    const userStats = await getUserStats();
    res.status(200).json({
      success: true,
      data: userStats.recentUsers || []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching recent users'
    });
  }
});

// @desc    Get recent orders
// @route   GET /api/admin/dashboard/orders/recent
// @access  Private/Admin
exports.getRecentOrders = asyncHandler(async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const response = await orderServiceClient.getRecentOrders(limit);
    
    // Handle different response formats
    const orders = Array.isArray(response) ? response : 
                   (response.data ? (Array.isArray(response.data) ? response.data : response.data.orders || []) : 
                   (response.orders || []));
    
    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    res.status(200).json({
      success: true,
      data: []
    });
  }
});

// @desc    Get pending verifications
// @route   GET /api/admin/dashboard/verification/pending
// @access  Private/Admin
exports.getPendingVerifications = asyncHandler(async (req, res, next) => {
  try {
    // Get users with pending verification status
    const users = await userServiceClient.getAllUsers();
    const pendingVerifications = users.filter(user => 
      user.verificationStatus === 'pending' || !user.isVerified
    ).slice(0, 10).map(user => ({
      id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
      verificationStatus: user.verificationStatus,
      createdAt: user.createdAt
    }));

    res.status(200).json({
      success: true,
      data: pendingVerifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pending verifications'
    });
  }
});
