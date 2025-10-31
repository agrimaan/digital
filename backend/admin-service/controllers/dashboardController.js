const asyncHandler = require('express-async-handler');
const dashboardService = require('../services/dashboardService');
const logger = require('../utils/logger');

/**
 * @desc    Get complete dashboard data
 * @route   GET /api/bff/dashboard
 * @access  Private/Admin
 */
const getDashboard = asyncHandler(async (req, res) => {
  logger.info('Getting complete dashboard data');

  const stats = await dashboardService.getDashboardStats();

  res.json({
    success: true,
    data: stats
  });
});

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/bff/dashboard/stats
 * @access  Private/Admin
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  logger.info('Getting dashboard statistics');

  const stats = await dashboardService.getDashboardStats();

  res.json({
    success: true,
    data: stats
  });
});

/**
 * @desc    Get recent users
 * @route   GET /api/bff/dashboard/users/recent
 * @access  Private/Admin
 */
const getRecentUsers = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  
  logger.info(`Getting recent users (limit: ${limit})`);

  const users = await dashboardService.getRecentUsers(limit);

  res.json({
    success: true,
    data: users
  });
});

/**
 * @desc    Get recent orders
 * @route   GET /api/bff/dashboard/orders/recent
 * @access  Private/Admin
 */
const getRecentOrders = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  
  logger.info(`Getting recent orders (limit: ${limit})`);

  const orders = await dashboardService.getRecentOrders(limit);

  res.json({
    success: true,
    data: orders
  });
});

/**
 * @desc    Get verification statistics
 * @route   GET /api/bff/dashboard/verification/pending
 * @access  Private/Admin
 */
const getPendingVerifications = asyncHandler(async (req, res) => {
  logger.info('Getting pending verifications');

  const verificationStats = await dashboardService.getVerificationStats();

  res.json({
    success: true,
    data: verificationStats
  });
});

/**
 * @desc    Get system health
 * @route   GET /api/bff/dashboard/system/health
 * @access  Private/Admin
 */
const getSystemHealth = asyncHandler(async (req, res) => {
  logger.info('Getting system health');

  const health = await dashboardService.getSystemHealth();

  res.json({
    success: true,
    data: health
  });
});

/**
 * @desc    Get all resources
 * @route   GET /api/bff/dashboard/resources
 * @access  Private/Admin
 */
const getResources = asyncHandler(async (req, res) => {
  logger.info('Getting all resources');

  const resources = await dashboardService.getResources();

  res.json({
    success: true,
    data: resources
  });
});

/**
 * @desc    Get all land tokens
 * @route   GET /api/bff/dashboard/land-tokens
 * @access  Private/Admin
 */
const getLandTokens = asyncHandler(async (req, res) => {
  logger.info('Getting all land tokens');

  const landTokens = await dashboardService.getLandTokens();

  res.json({
    success: true,
    data: landTokens
  });
});

/**
 * @desc    Get all bulk uploads
 * @route   GET /api/bff/dashboard/bulk-uploads
 * @access  Private/Admin
 */
const getBulkUploads = asyncHandler(async (req, res) => {
  logger.info('Getting all bulk uploads');

  const bulkUploads = await dashboardService.getBulkUploads();

  res.json({
    success: true,
    data: bulkUploads
  });
});

module.exports = {
  getDashboard,
  getDashboardStats,
  getRecentUsers,
  getRecentOrders,
  getPendingVerifications,
  getSystemHealth,
  getResources,
  getLandTokens,
  getBulkUploads
};