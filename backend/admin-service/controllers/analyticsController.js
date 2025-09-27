const analyticsService = require('../services/analyticsService');
const responseHandler = require('../utils/responseHandler');

/**
 * @desc    Get system overview statistics
 * @route   GET /api/analytics/overview
 * @access  Private/Admin
 */
exports.getSystemOverview = async (req, res) => {
  try {
    const overview = await analyticsService.getSystemOverview();

    return responseHandler.success(
      res,
      200,
      { overview },
      'System overview retrieved successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Get user statistics
 * @route   GET /api/analytics/users
 * @access  Private/Admin
 */
exports.getUserStatistics = async (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      userType: req.query.userType,
      region: req.query.region
    };

    const statistics = await analyticsService.getUserStatistics(filters);

    return responseHandler.success(
      res,
      200,
      { statistics },
      'User statistics retrieved successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Get marketplace statistics
 * @route   GET /api/analytics/marketplace
 * @access  Private/Admin
 */
exports.getMarketplaceStatistics = async (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      productCategory: req.query.productCategory,
      region: req.query.region
    };

    const statistics = await analyticsService.getMarketplaceStatistics(filters);

    return responseHandler.success(
      res,
      200,
      { statistics },
      'Marketplace statistics retrieved successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Get crop statistics
 * @route   GET /api/analytics/crops
 * @access  Private/Admin
 */
exports.getCropStatistics = async (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      cropType: req.query.cropType,
      region: req.query.region
    };

    const statistics = await analyticsService.getCropStatistics(filters);

    return responseHandler.success(
      res,
      200,
      { statistics },
      'Crop statistics retrieved successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Get IoT device statistics
 * @route   GET /api/analytics/iot
 * @access  Private/Admin
 */
exports.getIoTStatistics = async (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      deviceType: req.query.deviceType,
      region: req.query.region
    };

    const statistics = await analyticsService.getIoTStatistics(filters);

    return responseHandler.success(
      res,
      200,
      { statistics },
      'IoT device statistics retrieved successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Get weather statistics
 * @route   GET /api/analytics/weather
 * @access  Private/Admin
 */
exports.getWeatherStatistics = async (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      region: req.query.region
    };

    const statistics = await analyticsService.getWeatherStatistics(filters);

    return responseHandler.success(
      res,
      200,
      { statistics },
      'Weather statistics retrieved successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Get logistics statistics
 * @route   GET /api/analytics/logistics
 * @access  Private/Admin
 */
exports.getLogisticsStatistics = async (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      region: req.query.region
    };

    const statistics = await analyticsService.getLogisticsStatistics(filters);

    return responseHandler.success(
      res,
      200,
      { statistics },
      'Logistics statistics retrieved successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Get revenue statistics
 * @route   GET /api/analytics/revenue
 * @access  Private/Admin
 */
exports.getRevenueStatistics = async (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      interval: req.query.interval || 'day',
      region: req.query.region
    };

    const statistics = await analyticsService.getRevenueStatistics(filters);

    return responseHandler.success(
      res,
      200,
      { statistics },
      'Revenue statistics retrieved successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Get order statistics
 * @route   GET /api/analytics/orders
 * @access  Private/Admin
 */
exports.getOrderStatistics = async (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      status: req.query.status,
      region: req.query.region
    };

    const statistics = await analyticsService.getOrderStatistics(filters);

    return responseHandler.success(
      res,
      200,
      { statistics },
      'Order statistics retrieved successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Get field statistics
 * @route   GET /api/analytics/fields
 * @access  Private/Admin
 */
exports.getFieldStatistics = async (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      region: req.query.region,
      cropType: req.query.cropType
    };

    const statistics = await analyticsService.getFieldStatistics(filters);

    return responseHandler.success(
      res,
      200,
      { statistics },
      'Field statistics retrieved successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Get system health statistics
 * @route   GET /api/analytics/health
 * @access  Private/Admin
 */
exports.getSystemHealth = async (req, res) => {
  try {
    const health = await analyticsService.getSystemHealth();

    return responseHandler.success(
      res,
      200,
      { health },
      'System health retrieved successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};