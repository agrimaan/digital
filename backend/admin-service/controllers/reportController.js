const reportService = require('../services/reportService');
const responseHandler = require('../utils/responseHandler');
const { validationResult } = require('express-validator');

/**
 * @desc    Create a new report
 * @route   POST /api/reports
 * @access  Private
 */
exports.createReport = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return responseHandler.badRequest(res, 'Validation error', errors.array());
    }

    const reportData = {
      name: req.body.name,
      description: req.body.description,
      type: req.body.type,
      format: req.body.format,
      schedule: req.body.schedule,
      filters: req.body.filters,
      columns: req.body.columns,
      sortBy: req.body.sortBy,
      groupBy: req.body.groupBy,
      chartOptions: req.body.chartOptions,
      recipients: req.body.recipients,
      isTemplate: req.body.isTemplate || false,
      createdBy: req.admin.id
    };

    const adminData = {
      id: req.admin.id,
      name: req.admin.name,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    };

    const report = await reportService.createReport(reportData, adminData);

    return responseHandler.success(
      res,
      201,
      { report },
      'Report created successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Get a report by ID
 * @route   GET /api/reports/:id
 * @access  Private
 */
exports.getReportById = async (req, res) => {
  try {
    const report = await reportService.getReportById(req.params.id);

    if (!report) {
      return responseHandler.notFound(res, 'Report not found');
    }

    return responseHandler.success(
      res,
      200,
      { report },
      'Report retrieved successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Get all reports
 * @route   GET /api/reports
 * @access  Private
 */
exports.getAllReports = async (req, res) => {
  try {
    const { page, limit, type, isTemplate } = req.query;
    
    const filter = {};
    if (type) filter.type = type;
    if (isTemplate !== undefined) filter.isTemplate = isTemplate === 'true';
    
    // If not admin or super-admin, only show reports created by the user
    if (req.admin.role !== 'admin' && req.admin.role !== 'super-admin') {
      filter.createdBy = req.admin.id;
    }
    
    const options = {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10
    };
    
    const result = await reportService.getAllReports(filter, options);

    return responseHandler.success(
      res,
      200,
      result,
      'Reports retrieved successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Update a report
 * @route   PUT /api/reports/:id
 * @access  Private
 */
exports.updateReport = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return responseHandler.badRequest(res, 'Validation error', errors.array());
    }

    const updateData = {
      name: req.body.name,
      description: req.body.description,
      type: req.body.type,
      format: req.body.format,
      schedule: req.body.schedule,
      filters: req.body.filters,
      columns: req.body.columns,
      sortBy: req.body.sortBy,
      groupBy: req.body.groupBy,
      chartOptions: req.body.chartOptions,
      recipients: req.body.recipients,
      isTemplate: req.body.isTemplate
    };

    const adminData = {
      id: req.admin.id,
      name: req.admin.name,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    };

    const report = await reportService.updateReport(req.params.id, updateData, adminData);

    return responseHandler.success(
      res,
      200,
      { report },
      'Report updated successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Delete a report
 * @route   DELETE /api/reports/:id
 * @access  Private
 */
exports.deleteReport = async (req, res) => {
  try {
    const adminData = {
      id: req.admin.id,
      name: req.admin.name,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    };

    const report = await reportService.deleteReport(req.params.id, adminData);

    return responseHandler.success(
      res,
      200,
      { report },
      'Report deleted successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Generate a report
 * @route   POST /api/reports/:id/generate
 * @access  Private
 */
exports.generateReport = async (req, res) => {
  try {
    const adminData = {
      id: req.admin.id,
      name: req.admin.name,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    };

    const result = await reportService.generateReport(req.params.id, adminData);

    return responseHandler.success(
      res,
      200,
      result,
      'Report generated successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Get report templates
 * @route   GET /api/reports/templates
 * @access  Private
 */
exports.getReportTemplates = async (req, res) => {
  try {
    const templates = await reportService.getReportTemplates();

    return responseHandler.success(
      res,
      200,
      { templates },
      'Report templates retrieved successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Create report from template
 * @route   POST /api/reports/templates/:id
 * @access  Private
 */
exports.createReportFromTemplate = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return responseHandler.badRequest(res, 'Validation error', errors.array());
    }

    const reportData = {
      name: req.body.name,
      description: req.body.description,
      format: req.body.format,
      schedule: req.body.schedule,
      filters: req.body.filters,
      recipients: req.body.recipients
    };

    const adminData = {
      id: req.admin.id,
      name: req.admin.name,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    };

    const report = await reportService.createReportFromTemplate(req.params.id, reportData, adminData);

    return responseHandler.success(
      res,
      201,
      { report },
      'Report created from template successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};

/**
 * @desc    Process scheduled reports (for cron job)
 * @route   POST /api/reports/process-scheduled
 * @access  Private/Admin
 */
exports.processScheduledReports = async (req, res) => {
  try {
    const processedCount = await reportService.processScheduledReports();

    return responseHandler.success(
      res,
      200,
      { processedCount },
      `Processed ${processedCount} scheduled reports`
    );
  } catch (error) {
    return responseHandler.error(res, 500, error.message);
  }
};