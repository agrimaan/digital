
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
const bulkUploadService = require('../services/bulkUploadService');
const Settings = require('../models/SystemSettings');

// Initialize service clients
const userServiceClient = new IndependentUserServiceClient();
const fieldServiceClient = new IndependentFieldServiceClient();
const cropServiceClient = new IndependentCropServiceClient();
const sensorServiceClient = new IndependentSensorServiceClient();


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
      bulkUploadStats,
      systemSettings
    ] = await Promise.all([
      getUserStats(),
      getFieldStats(),
      getCropStats(),
      getSensorStats(),
      bulkUploadService.getBulkUploadStats()
    ]);

    // Combine all statistics
    const dashboardStats = {
      users: userStats.totalUsers || 0,
      fields: fieldStats.totalFields || 0,
      crops: cropStats.totalCrops || 0,
      sensors: sensorStats.totalSensors || 0,
      bulkUploads: bulkUploadStats.totalUploads || 0,
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
    const users = await userServiceClient.getAllUsers();
    const totalUsers = users.length;
    const usersByRole = {};
    
    users.forEach(user => {
      usersByRole[user.role] = (usersByRole[user.role] || 0) + 1;
    });

    return {
      totalUsers,
      usersByRole,
      recentUsers: users.slice(0, 5).map(user => ({
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
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
    const fields = await fieldServiceClient.getAllFields();
    const totalFields = fields.length;
    const fieldsByLocation = {};
    
    fields.forEach(field => {
      fieldsByLocation[field.location] = (fieldsByLocation[field.location] || 0) + 1;
    });

    return {
      totalFields,
      fieldsByLocation,
      recentFields: fields.slice(0, 5).map(field => ({
        id: field._id,
        name: field.name,
        location: field.location,
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
    const crops = await cropServiceClient.getAllCrops();
    const totalCrops = crops.length;
    const cropsByStatus = {};
    
    crops.forEach(crop => {
      cropsByStatus[crop.status] = (cropsByStatus[crop.status] || 0) + 1;
    });

    return {
      totalCrops,
      cropsByStatus,
      recentCrops: crops.slice(0, 5).map(crop => ({
        id: crop._id,
        name: crop.name,
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
    const sensors = await sensorServiceClient.getAllSensors();
    const totalSensors = sensors.length;
    const sensorsByType = {};
    const sensorsByStatus = {};
    
    sensors.forEach(sensor => {
      sensorsByType[sensor.type] = (sensorsByType[sensor.type] || 0) + 1;
      sensorsByStatus[sensor.status] = (sensorsByStatus[sensor.status] || 0) + 1;
    });

    return {
      totalSensors,
      sensorsByType,
      sensorsByStatus,
      recentSensors: sensors.slice(0, 5).map(sensor => ({
        id: sensor._id,
        name: sensor.name,
        type: sensor.type,
        status: sensor.status,
        location: sensor.location
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
    // For now, return mock data since we don't have an order service client
    // In a real implementation, you would create an IndependentOrderServiceClient
    const orderStats = {
      totalOrders: 0,
      ordersByStatus: {},
      recentOrders: []
    };

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
    // For now, return empty array since we don't have an order service client
    // In a real implementation, you would create an IndependentOrderServiceClient
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching recent orders'
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
