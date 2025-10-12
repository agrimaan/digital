const asyncHandler = require('express-async-handler');
const UserServiceClient = require('@agrimaan/shared').UserServiceClient
const FieldServiceClient = require('@agrimaan/shared').FieldServiceClient;
const CropServiceClient = require('@agrimaan/shared').CropServiceClient;
const SensorServiceClient = require('@agrimaan/shared').SensorServiceClient;
const OrderServiceClient = require('@agrimaan/shared').OrderServiceClient;
const LandTokenServiceClient = require('@agrimaan/shared').LandTokenServiceClient;
const BulkUploadServiceClient = require('@agrimaan/shared').BulkUploadServiceClient;
const ResourceServiceClient = require('@agrimaan/shared').ResourceServiceClient;
const Settings = require('../models/SystemSettings');

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
      landTokenStats,
      bulkUploadStats,
      resourceStats
    ] = await Promise.all([
      UserServiceClient.getUserStats(),
      FieldServiceClient.getFieldStats(),
      CropServiceClient.getCropStats(),
      SensorServiceClient.getSensorStats(),
      OrderServiceClient.getOrderStats(),
      LandTokenServiceClient.getLandTokenStats(),
      BulkUploadServiceClient.getBulkUploadStats(),
      ResourceServiceClient.getResourceStats()
    ]);

    // Get verification statistics
    const verificationStats = await UserServiceClient.getVerificationStats();

    // Combine all statistics
    const dashboardStats = {
      users: userStats.totalUsers || 0,
      fields: fieldStats.totalFields || 0,
      crops: cropStats.totalCrops || 0,
      sensors: sensorStats.totalSensors || 0,
      orders: orderStats.totalOrders || 0,
      landTokens: landTokenStats.totalLandTokens || 0,
      bulkUploads: bulkUploadStats.totalUploads || 0,
      resources: resourceStats.totalResources || 0,
      usersByRole: userStats.usersByRole || {
        farmers: 0,
        buyers: 0,
        agronomists: 0,
        investors: 0,
        admins: 0
      },
      verificationStats: verificationStats || {
        pendingUsers: 0,
        pendingLandTokens: 0,
        pendingBulkUploads: 0
      }
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
      error: error.message
    });
  }
});

// @desc    Get user statistics
// @route   GET /api/admin/dashboard/users/stats
// @access  Private/Admin
exports.getUserStats = asyncHandler(async (req, res, next) => {
  try {
    const userStats = await UserServiceClient.getUserStats();
    
    res.status(200).json({
      success: true,
      data: userStats
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user statistics',
      error: error.message
    });
  }
});

// @desc    Get field statistics
// @route   GET /api/admin/dashboard/fields/stats
// @access  Private/Admin
exports.getFieldStats = asyncHandler(async (req, res, next) => {
  try {
    const fieldStats = await FieldServiceClient.getFieldStats();
    
    res.status(200).json({
      success: true,
      data: fieldStats
    });
  } catch (error) {
    console.error('Error fetching field stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching field statistics',
      error: error.message
    });
  }
});

// @desc    Get crop statistics
// @route   GET /api/admin/dashboard/crops/stats
// @access  Private/Admin
exports.getCropStats = asyncHandler(async (req, res, next) => {
  try {
    const cropStats = await CropServiceClient.getCropStats();
    
    res.status(200).json({
      success: true,
      data: cropStats
    });
  } catch (error) {
    console.error('Error fetching crop stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching crop statistics',
      error: error.message
    });
  }
});

// @desc    Get sensor statistics
// @route   GET /api/admin/dashboard/sensors/stats
// @access  Private/Admin
exports.getSensorStats = asyncHandler(async (req, res, next) => {
  try {
    const sensorStats = await SensorServiceClient.getSensorStats();
    
    res.status(200).json({
      success: true,
      data: sensorStats
    });
  } catch (error) {
    console.error('Error fetching sensor stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sensor statistics',
      error: error.message
    });
  }
});

// @desc    Get order statistics
// @route   GET /api/admin/dashboard/orders/stats
// @access  Private/Admin
exports.getOrderStats = asyncHandler(async (req, res, next) => {
  try {
    const orderStats = await OrderServiceClient.getOrderStats();
    
    res.status(200).json({
      success: true,
      data: orderStats
    });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order statistics',
      error: error.message
    });
  }
});

// @desc    Get recent users
// @route   GET /api/admin/dashboard/users/recent
// @access  Private/Admin
exports.getRecentUsers = asyncHandler(async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const recentUsers = await UserServiceClient.getRecentUsers(limit);
    
    res.status(200).json({
      success: true,
      data: recentUsers
    });
  } catch (error) {
    console.error('Error fetching recent users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent users',
      error: error.message
    });
  }
});

// @desc    Get recent orders
// @route   GET /api/orders/recent
// @access  Private/Admin
exports.getRecentOrders = asyncHandler(async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const recentOrders = await OrderServiceClient.getRecentOrders(limit);
    
    res.status(200).json({
      success: true,
      data: recentOrders
    });
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent orders',
      error: error.message
    });
  }
});

// @desc    Get system health status
// @route   GET /api/admin/dashboard/system/health
// @access  Private/Admin
exports.getSystemHealth = asyncHandler(async (req, res, next) => {
  try {
    // Get system settings
    const settings = await Settings.findOne();
    
    const systemHealth = {
      otpEnabled: settings?.security?.otpEnabled || false,
      emailConfigured: settings?.email?.configured || false,
      smsConfigured: settings?.sms?.configured || false,
      oauthConfigured: settings?.oauth?.enabled || false
    };

    res.status(200).json({
      success: true,
      data: systemHealth
    });
  } catch (error) {
    console.error('Error fetching system health:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching system health',
      error: error.message
    });
  }
});

// @desc    Get pending verifications
// @route   GET /api/admin/dashboard/verification/pending
// @access  Private/Admin
exports.getPendingVerifications = asyncHandler(async (req, res, next) => {
  try {
    const pendingVerifications = await UserServiceClient.getPendingVerifications();
    
    res.status(200).json({
      success: true,
      data: pendingVerifications
    });
  } catch (error) {
    console.error('Error fetching pending verifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending verifications',
      error: error.message
    });
  }
});
