const express = require('express');
const { check } = require('express-validator');
const reportController = require('../controllers/reportController');
const { protect, authorize, logAction } = require('@agrimaan/shared').middleware;
const router = express.Router();

// Protect all routes
router.use(protect);

// Admin/SuperAdmin only routes
router.use(authorize('admin', 'super-admin'));

// Get report templates
router.get('/templates', reportController.getReportTemplates);

// Create report from template
router.post(
  '/templates/:id',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('description', 'Description is required').optional(),
    check('format', 'Format must be valid').optional().isIn(['pdf', 'csv', 'excel', 'json', 'html']),
    check('schedule', 'Schedule must be an object').optional().isObject(),
    check('filters', 'Filters must be an object').optional().isObject(),
    check('recipients', 'Recipients must be an object').optional().isObject()
  ],
  logAction('create', 'report'),
  reportController.createReportFromTemplate
);

// Process scheduled reports (admin only)
router.post(
  '/process-scheduled',
  authorize('admin', 'super-admin'),
  reportController.processScheduledReports
);

// Get all reports
router.get('/', reportController.getAllReports);

// Get a report by ID
router.get('/:id', reportController.getReportById);

// Create a new report
router.post(
  '/',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('type', 'Type is required').not().isEmpty(),
    check('format', 'Format must be valid').isIn(['pdf', 'csv', 'excel', 'json', 'html']),
    check('schedule', 'Schedule must be an object').optional().isObject(),
    check('filters', 'Filters must be an object').optional().isObject(),
    check('columns', 'Columns must be an array').optional().isArray(),
    check('sortBy', 'SortBy must be an object').optional().isObject(),
    check('groupBy', 'GroupBy must be a string').optional(),
    check('chartOptions', 'ChartOptions must be an object').optional().isObject(),
    check('recipients', 'Recipients must be an object').optional().isObject(),
    check('isTemplate', 'IsTemplate must be a boolean').optional().isBoolean()
  ],
  logAction('create', 'report'),
  reportController.createReport
);

// Update a report
router.put(
  '/:id',
  [
    check('name', 'Name is required').optional(),
    check('description', 'Description is required').optional(),
    check('type', 'Type is required').optional(),
    check('format', 'Format must be valid').optional().isIn(['pdf', 'csv', 'excel', 'json', 'html']),
    check('schedule', 'Schedule must be an object').optional().isObject(),
    check('filters', 'Filters must be an object').optional().isObject(),
    check('columns', 'Columns must be an array').optional().isArray(),
    check('sortBy', 'SortBy must be an object').optional().isObject(),
    check('groupBy', 'GroupBy must be a string').optional(),
    check('chartOptions', 'ChartOptions must be an object').optional().isObject(),
    check('recipients', 'Recipients must be an object').optional().isObject(),
    check('isTemplate', 'IsTemplate must be a boolean').optional().isBoolean()
  ],
  logAction('update', 'report'),
  reportController.updateReport
);

// Delete a report
router.delete('/:id', logAction('delete', 'report'), reportController.deleteReport);

// Generate a report
router.post('/:id/generate', logAction('create', 'report'), reportController.generateReport);

module.exports = router;