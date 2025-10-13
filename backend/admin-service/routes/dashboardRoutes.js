const express = require('express');
const { check } = require('express-validator');
const dashboardController = require('../controllers/dashboardController');
//const { protect, logAction, authorize } = require('@agrimaan/shared').middleware;
const { protect, logAction, authorize } = require('../middleware/auth');


const router = express.Router();

// Protect all routes
router.use(protect);


// Admin/SuperAdmin only routes
router.use(authorize('admin', 'super-admin'));

// Get default dashboard
router.get('/default', dashboardController.getDefaultDashboard);

// Get all dashboards
router.get('/', dashboardController.getAllDashboards);

// Get dashboard by ID
router.get('/:id', dashboardController.getDashboardById);

// Get dashboard data
router.get('/:id/data', dashboardController.getDashboardData);



// SuperAdmin only routes
router.use(authorize('super-admin'));

// Create a new dashboard
router.post(
  '/',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('isDefault', 'isDefault must be a boolean').optional().isBoolean(),
    check('layout', 'Layout must be an array').optional().isArray(),
    check('filters', 'Filters must be an object').optional().isObject(),
    check('refreshInterval', 'Refresh interval must be a number').optional().isNumeric()
  ],
  logAction('create', 'dashboard'),
  dashboardController.createDashboard
);

// Update a dashboard
router.put(
  '/:id',
  [
    check('name', 'Name is required').optional(),
    check('isDefault', 'isDefault must be a boolean').optional().isBoolean(),
    check('layout', 'Layout must be an array').optional().isArray(),
    check('filters', 'Filters must be an object').optional().isObject(),
    check('refreshInterval', 'Refresh interval must be a number').optional().isNumeric()
  ],
  logAction('update', 'dashboard'),
  dashboardController.updateDashboard
);

// Delete a dashboard
router.delete('/:id', logAction('delete', 'dashboard'), dashboardController.deleteDashboard);

// Set a dashboard as default
router.put('/:id/default', logAction('update', 'dashboard'), dashboardController.setDefaultDashboard);

module.exports = router;