const express = require('express');
const { check } = require('express-validator');
const fieldController = require('../controllers/fieldController');
const { protect, authorize } = require('@agrimaan/shared').middleware;

const router = express.Router();

// All routes require admin authentication
router.use(protect, authorize('admin', 'super-admin'));

// Field management routes
router.get('/', fieldController.getAllFields);
router.get('/:id', fieldController.getFieldById);
router.post('/', [
  check('name', 'Field name is required').not().isEmpty(),
  check('size', 'Field size is required').not().isEmpty(),
  check('location', 'Location is required').not().isEmpty()
], fieldController.createField);
router.put('/:id', [
  check('name', 'Field name is required').optional().not().isEmpty(),
  check('size', 'Field size is required').optional().not().isEmpty()
], fieldController.updateField);
router.delete('/:id', fieldController.deleteField);

// Field analytics and reports
router.get('/:id/analytics', fieldController.getFieldAnalytics);
router.get('/:id/crops', fieldController.getFieldCrops);
router.get('/:id/sensors', fieldController.getFieldSensors);

module.exports = router;
