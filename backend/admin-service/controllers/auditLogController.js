const auditLogService = require('../services/auditLogService');
const responseHandler = require('../utils/responseHandler');
const { validationResult } = require('express-validator');

/**
 * @desc    Create a new audit log entry
 * @route   POST /api/audit-logs
 * @access  Private/Admin
 */
exports.createLog = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return responseHandler.badRequest(res, 'Validation error', errors.array());
    }

    const logData = {
      adminId: req.body.adminId || req.admin.id,
      adminName: req.body.adminName || req.admin.name,
      action: req.body.action,
      resourceType: req.body.resourceType,
      resourceId: req.body.resourceId,
      description: req.body.description,
      details: req.body.details,
      previousState: req.body.previousState,
      newState: req.body.newState,
      ipAddress: req.body.ipAddress || req.ip,
      userAgent: req.body.userAgent || req.headers['user-agent'],
      status: req.body.status || 'success'
    };

    const log = await auditLogService.createLog(logData);

    return responseHandler.success(
      res,
      201,
      { log },
      'Audit log created successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Get audit logs by admin
 * @route   GET /api/audit-logs/admin/:adminId
 * @access  Private/Admin
 */
exports.getLogsByAdmin = async (req, res) => {
  try {
    const { page, limit } = req.query;
    
    const options = {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20
    };
    
    const result = await auditLogService.getLogsByAdmin(req.params.adminId, options);

    return responseHandler.success(
      res,
      200,
      result,
      'Audit logs retrieved successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Get audit logs by resource
 * @route   GET /api/audit-logs/resource/:resourceType/:resourceId?
 * @access  Private/Admin
 */
exports.getLogsByResource = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const { resourceType, resourceId } = req.params;
    
    const options = {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20
    };
    
    const result = await auditLogService.getLogsByResource(resourceType, resourceId, options);

    return responseHandler.success(
      res,
      200,
      result,
      'Audit logs retrieved successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Get audit logs by action
 * @route   GET /api/audit-logs/action/:action
 * @access  Private/Admin
 */
exports.getLogsByAction = async (req, res) => {
  try {
    const { page, limit } = req.query;
    
    const options = {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20
    };
    
    const result = await auditLogService.getLogsByAction(req.params.action, options);

    return responseHandler.success(
      res,
      200,
      result,
      'Audit logs retrieved successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Get audit logs by date range
 * @route   GET /api/audit-logs/date-range
 * @access  Private/Admin
 */
exports.getLogsByDateRange = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return responseHandler.badRequest(res, 'Validation error', errors.array());
    }

    const { startDate, endDate, page, limit } = req.query;
    
    if (!startDate || !endDate) {
      return responseHandler.badRequest(res, 'Start date and end date are required');
    }
    
    const options = {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20
    };
    
    const result = await auditLogService.getLogsByDateRange(
      new Date(startDate),
      new Date(endDate),
      options
    );

    return responseHandler.success(
      res,
      200,
      result,
      'Audit logs retrieved successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Get all audit logs with filtering
 * @route   GET /api/audit-logs
 * @access  Private/Admin
 */
exports.getAllLogs = async (req, res) => {
  try {
    const {
      adminId,
      action,
      resourceType,
      resourceId,
      status,
      startDate,
      endDate,
      search,
      page,
      limit
    } = req.query;
    
    const filter = {};
    if (adminId) filter.adminId = adminId;
    if (action) filter.action = action;
    if (resourceType) filter.resourceType = resourceType;
    if (resourceId) filter.resourceId = resourceId;
    if (status) filter.status = status;
    if (startDate) filter.startDate = startDate;
    if (endDate) filter.endDate = endDate;
    if (search) filter.search = search;
    
    const options = {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20
    };
    
    const result = await auditLogService.getAllLogs(filter, options);

    return responseHandler.success(
      res,
      200,
      result,
      'Audit logs retrieved successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Get audit log statistics
 * @route   GET /api/audit-logs/statistics
 * @access  Private/Admin
 */
exports.getLogStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return responseHandler.badRequest(res, 'Start date and end date are required');
    }
    
    const statistics = await auditLogService.getLogStatistics(
      new Date(startDate),
      new Date(endDate)
    );

    return responseHandler.success(
      res,
      200,
      { statistics },
      'Audit log statistics retrieved successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Delete old audit logs
 * @route   DELETE /api/audit-logs/old/:days
 * @access  Private/SuperAdmin
 */
exports.deleteOldLogs = async (req, res) => {
  try {
    const days = parseInt(req.params.days, 10);
    
    if (isNaN(days) || days <= 0) {
      return responseHandler.badRequest(res, 'Days must be a positive number');
    }
    
    const olderThan = new Date();
    olderThan.setDate(olderThan.getDate() - days);
    
    const deletedCount = await auditLogService.deleteOldLogs(olderThan);

    return responseHandler.success(
      res,
      200,
      { deletedCount },
      `Deleted ${deletedCount} audit logs older than ${days} days`
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};