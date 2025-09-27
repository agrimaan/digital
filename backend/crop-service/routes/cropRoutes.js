const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const { 
  getCrops, 
  getCrop, 
  createCrop, 
  updateCrop, 
  deleteCrop,
  getCropsByCategory,
  getCropsBySoilType,
  getCropsBySeason,
  searchCrops,
  getCropRecommendations
} = require('../controllers/cropController');
const { protect, authorize } = require('../middleware/auth');

// Validation middleware
const validateCropCreation = [
  check('name', 'Crop name is required').not().isEmpty(),
  check('category', 'Category is required').isIn([
    'cereal', 'pulse', 'oilseed', 'vegetable', 'fruit', 'cash_crop', 'fodder', 'other'
  ]),
  check('growthDuration.min', 'Minimum growth duration is required').isNumeric(),
  check('growthDuration.max', 'Maximum growth duration is required').isNumeric(),
  check('idealTemperature.min', 'Minimum ideal temperature is required').isNumeric(),
  check('idealTemperature.max', 'Maximum ideal temperature is required').isNumeric(),
  check('yieldEstimate.min', 'Minimum yield estimate is required').isNumeric(),
  check('yieldEstimate.max', 'Maximum yield estimate is required').isNumeric()
];

const validateCropUpdate = [
  check('name', 'Crop name must not be empty if provided').optional().not().isEmpty(),
  check('category', 'Category must be valid if provided')
    .optional()
    .isIn(['cereal', 'pulse', 'oilseed', 'vegetable', 'fruit', 'cash_crop', 'fodder', 'other']),
  check('growthDuration.min', 'Minimum growth duration must be a number if provided').optional().isNumeric(),
  check('growthDuration.max', 'Maximum growth duration must be a number if provided').optional().isNumeric(),
  check('idealTemperature.min', 'Minimum ideal temperature must be a number if provided').optional().isNumeric(),
  check('idealTemperature.max', 'Maximum ideal temperature must be a number if provided').optional().isNumeric(),
  check('yieldEstimate.min', 'Minimum yield estimate must be a number if provided').optional().isNumeric(),
  check('yieldEstimate.max', 'Maximum yield estimate must be a number if provided').optional().isNumeric()
];

// Routes
router
  .route('/')
  .get(protect, getCrops)
  .post(protect, authorize('admin', 'agronomist'), validateCropCreation, createCrop);

router
  .route('/:id')
  .get(protect, getCrop)
  .put(protect, authorize('admin', 'agronomist'), validateCropUpdate, updateCrop)
  .delete(protect, authorize('admin'), deleteCrop);

router.get('/category/:category', protect, getCropsByCategory);
router.get('/soil/:soilType', protect, getCropsBySoilType);
router.get('/season/:month', protect, getCropsBySeason);
router.get('/search/:term', protect, searchCrops);
router.post('/recommendations', protect, getCropRecommendations);

module.exports = router;