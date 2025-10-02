const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const { 
  getPlantings, 
  getPlanting, 
  createPlanting, 
  updatePlanting, 
  deletePlanting,
  getPlantingsByField,
  getPlantingsByCrop,
  updatePlantingStatus,
  addGrowthObservation,
  getPlantingStatistics,
  getUpcomingPlantings,
  getPlantingsReadyForHarvest
} = require('../controllers/plantingController');
const { protect, authorize } = require('../middleware/auth');

// Validation middleware
const validatePlantingCreation = [
  check('field', 'Field ID is required').not().isEmpty(),
  check('crop', 'Crop ID is required').isMongoId(),
  check('plantingDate', 'Planting date is required').isISO8601().toDate(),
  check('expectedHarvestDate', 'Expected harvest date must be a valid date if provided')
    .optional()
    .isISO8601()
    .toDate(),
  check('area', 'Area is required and must be a number').isNumeric(),
  check('seedQuantity.value', 'Seed quantity value is required and must be a number').isNumeric(),
  check('seedQuantity.unit', 'Seed quantity unit must be valid if provided')
    .optional()
    .isIn(['kg', 'g', 'seeds', 'packets'])
];

const validatePlantingUpdate = [
  check('plantingDate', 'Planting date must be a valid date if provided')
    .optional()
    .isISO8601()
    .toDate(),
  check('expectedHarvestDate', 'Expected harvest date must be a valid date if provided')
    .optional()
    .isISO8601()
    .toDate(),
  check('actualHarvestDate', 'Actual harvest date must be a valid date if provided')
    .optional()
    .isISO8601()
    .toDate(),
  check('status', 'Status must be valid if provided')
    .optional()
    .isIn(['planned', 'planted', 'growing', 'ready_for_harvest', 'harvested', 'failed']),
  check('area', 'Area must be a number if provided')
    .optional()
    .isNumeric(),
  check('seedQuantity.value', 'Seed quantity value must be a number if provided')
    .optional()
    .isNumeric(),
  check('seedQuantity.unit', 'Seed quantity unit must be valid if provided')
    .optional()
    .isIn(['kg', 'g', 'seeds', 'packets'])
];

const validateGrowthObservation = [
  check('stage', 'Growth stage is required').not().isEmpty(),
  check('healthStatus', 'Health status is required')
    .isIn(['excellent', 'good', 'fair', 'poor', 'critical']),
  check('date', 'Date must be a valid date if provided')
    .optional()
    .isISO8601()
    .toDate()
];

// Routes
router
  .route('/')
  .get(protect, getPlantings)
  .post(protect, validatePlantingCreation, createPlanting);

router
  .route('/:id')
  .get(protect, getPlanting)
  .put(protect, validatePlantingUpdate, updatePlanting)
  .delete(protect, deletePlanting);

router.get('/field/:fieldId', protect, getPlantingsByField);
router.get('/crop/:cropId', protect, getPlantingsByCrop);
router.put('/:id/status', protect, updatePlantingStatus);
router.post('/:id/observations', protect, validateGrowthObservation, addGrowthObservation);
router.get('/statistics', protect, getPlantingStatistics);
router.get('/upcoming', protect, getUpcomingPlantings);
router.get('/ready-for-harvest', protect, getPlantingsReadyForHarvest);

module.exports = router;