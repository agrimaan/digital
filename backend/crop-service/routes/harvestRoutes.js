const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const { 
  getHarvests, 
  getHarvest, 
  createHarvest, 
  updateHarvest, 
  deleteHarvest,
  getHarvestsByField,
  getHarvestsByCrop,
  updateHarvestStatus,
  getHarvestStatistics,
  getUpcomingHarvests
} = require('../controllers/harvestController');
//const { protect, authorize } = require('../middleware/auth');
const { protect, authorize, logAction } = require('@agrimaan/shared').middleware;


// Validation middleware
const validateHarvestCreation = [
  check('planting', 'Planting ID is required').isMongoId(),
  check('harvestDate', 'Harvest date is required').isISO8601().toDate(),
  check('method', 'Harvest method is required')
    .isIn(['manual', 'mechanical', 'combined', 'other']),
  check('yield.value', 'Yield value is required and must be a number').isNumeric(),
  check('yield.unit', 'Yield unit must be valid if provided')
    .optional()
    .isIn(['kg', 'ton', 'quintal'])
];

const validateHarvestUpdate = [
  check('harvestDate', 'Harvest date must be a valid date if provided')
    .optional()
    .isISO8601()
    .toDate(),
  check('completionDate', 'Completion date must be a valid date if provided')
    .optional()
    .isISO8601()
    .toDate(),
  check('status', 'Status must be valid if provided')
    .optional()
    .isIn(['planned', 'in_progress', 'completed', 'cancelled']),
  check('method', 'Method must be valid if provided')
    .optional()
    .isIn(['manual', 'mechanical', 'combined', 'other']),
  check('yield.value', 'Yield value must be a number if provided')
    .optional()
    .isNumeric(),
  check('yield.unit', 'Yield unit must be valid if provided')
    .optional()
    .isIn(['kg', 'ton', 'quintal']),
  check('quality.grade', 'Quality grade must be valid if provided')
    .optional()
    .isIn(['A', 'B', 'C', 'D', 'E', 'ungraded'])
];

// Routes
router
  .route('/')
  .get(protect, getHarvests)
  .post(protect, validateHarvestCreation, createHarvest);

router
  .route('/:id')
  .get(protect, getHarvest)
  .put(protect, validateHarvestUpdate, updateHarvest)
  .delete(protect, deleteHarvest);

router.get('/field/:fieldId', protect, getHarvestsByField);
router.get('/crop/:cropId', protect, getHarvestsByCrop);
router.put('/:id/status', protect, updateHarvestStatus);
router.get('/statistics', protect, getHarvestStatistics);
router.get('/upcoming', protect, getUpcomingHarvests);

module.exports = router;