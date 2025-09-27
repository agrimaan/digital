const dashboardService = require('../services/dashboardService');
const responseHandler = require('../utils/responseHandler');
const { validationResult } = require('express-validator');

/**
 * @desc    Get default dashboard for an admin
 * @route   GET /api/dashboards/default
 * @access  Private
 */
exports.getDefaultDashboard = async (req, res) => {
  try {
    const dashboard = await dashboardService.getDefaultDashboard(req.admin.id);

    return responseHandler.success(
      res,
      200,
      { dashboard },
      'Default dashboard retrieved successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Get dashboard by ID
 * @route   GET /api/dashboards/:id
 * @access  Private
 */
exports.getDashboardById = async (req, res) => {
  try {
    const dashboard = await dashboardService.getDashboardById(req.params.id, req.admin.id);

    if (!dashboard) {
      return responseHandler.notFound(res, 'Dashboard not found');
    }

    return responseHandler.success(
      res,
      200,
      { dashboard },
      'Dashboard retrieved successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Get all dashboards for an admin
 * @route   GET /api/dashboards
 * @access  Private
 */
exports.getAllDashboards = async (req, res) => {
  try {
    const dashboards = await dashboardService.getAllDashboards(req.admin.id);

    return responseHandler.success(
      res,
      200,
      { dashboards },
      'Dashboards retrieved successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Create a new dashboard
 * @route   POST /api/dashboards
 * @access  Private
 */
exports.createDashboard = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return responseHandler.badRequest(res, 'Validation error', errors.array());
    }

    const dashboardData = {
      name: req.body.name,
      isDefault: req.body.isDefault || false,
      layout: req.body.layout || [],
      filters: req.body.filters || {},
      refreshInterval: req.body.refreshInterval || 0
    };

    const adminData = {
      id: req.admin.id,
      name: req.admin.name,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    };

    const dashboard = await dashboardService.createDashboard(dashboardData, adminData);

    return responseHandler.success(
      res,
      201,
      { dashboard },
      'Dashboard created successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Update a dashboard
 * @route   PUT /api/dashboards/:id
 * @access  Private
 */
exports.updateDashboard = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return responseHandler.badRequest(res, 'Validation error', errors.array());
    }

    const updateData = {
      name: req.body.name,
      isDefault: req.body.isDefault,
      layout: req.body.layout,
      filters: req.body.filters,
      refreshInterval: req.body.refreshInterval
    };

    const adminData = {
      id: req.admin.id,
      name: req.admin.name,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    };

    const dashboard = await dashboardService.updateDashboard(req.params.id, updateData, adminData);

    return responseHandler.success(
      res,
      200,
      { dashboard },
      'Dashboard updated successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Delete a dashboard
 * @route   DELETE /api/dashboards/:id
 * @access  Private
 */
exports.deleteDashboard = async (req, res) => {
  try {
    const adminData = {
      id: req.admin.id,
      name: req.admin.name,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    };

    const dashboard = await dashboardService.deleteDashboard(req.params.id, adminData);

    return responseHandler.success(
      res,
      200,
      { dashboard },
      'Dashboard deleted successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Set a dashboard as default
 * @route   PUT /api/dashboards/:id/default
 * @access  Private
 */
exports.setDefaultDashboard = async (req, res) => {
  try {
    const adminData = {
      id: req.admin.id,
      name: req.admin.name,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    };

    const dashboard = await dashboardService.setDefaultDashboard(req.params.id, adminData);

    return responseHandler.success(
      res,
      200,
      { dashboard },
      'Dashboard set as default successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Get dashboard data
 * @route   GET /api/dashboards/:id/data
 * @access  Private
 */
exports.getDashboardData = async (req, res) => {
  try {
    const dashboardWithData = await dashboardService.getDashboardData(req.params.id, req.admin.id);

    return responseHandler.success(
      res,
      200,
      { dashboard: dashboardWithData },
      'Dashboard data retrieved successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};