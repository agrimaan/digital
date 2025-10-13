const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const { 
  getSoilTypes, 
  getSoilType, 
  createSoilType, 
  updateSoilType, 
  deleteSoilType,
  getSoilTypesByCrop
} = require('../controllers/soilController');
//const { protect, authorize } = require('../middleware/auth');
const { protect, authorize, logAction } = require('@agrimaan/shared').middleware;

// Validation middleware
const validateSoilTypeCreation = [
  check('name', 'Soil type name is required').not().isEmpty(),
  check('description', 'Description is required').not().isEmpty(),
  check('texture', 'Texture must be one of the valid soil textures')
    .isIn([
      'clay', 
      'silty clay', 
      'sandy clay', 
      'clay loam', 
      'silty clay loam', 
      'sandy clay loam', 
      'loam', 
      'silt loam', 
      'silt', 
      'sandy loam', 
      'loamy sand', 
      'sand'
    ]),
  check('color', 'Color is required').not().isEmpty(),
  check('drainageCapacity', 'Drainage capacity must be one of: poor, moderate, good, excellent')
    .optional()
    .isIn(['poor', 'moderate', 'good', 'excellent']),
  check('waterHoldingCapacity', 'Water holding capacity must be one of: low, medium, high')
    .optional()
    .isIn(['low', 'medium', 'high']),
  check('organicMatterContent', 'Organic matter content must be one of: low, medium, high')
    .optional()
    .isIn(['low', 'medium', 'high'])
];

const validateSoilTypeUpdate = [
  check('name', 'Soil type name must not be empty if provided').optional().not().isEmpty(),
  check('description', 'Description must not be empty if provided').optional().not().isEmpty(),
  check('texture', 'Texture must be one of the valid soil textures')
    .optional()
    .isIn([
      'clay', 
      'silty clay', 
      'sandy clay', 
      'clay loam', 
      'silty clay loam', 
      'sandy clay loam', 
      'loam', 
      'silt loam', 
      'silt', 
      'sandy loam', 
      'loamy sand', 
      'sand'
    ]),
  check('drainageCapacity', 'Drainage capacity must be one of: poor, moderate, good, excellent')
    .optional()
    .isIn(['poor', 'moderate', 'good', 'excellent']),
  check('waterHoldingCapacity', 'Water holding capacity must be one of: low, medium, high')
    .optional()
    .isIn(['low', 'medium', 'high']),
  check('organicMatterContent', 'Organic matter content must be one of: low, medium, high')
    .optional()
    .isIn(['low', 'medium', 'high'])
];

// Routes
router
  .route('/')
  .get(protect, getSoilTypes)
  .post(protect, authorize('admin', 'agronomist'), validateSoilTypeCreation, createSoilType);

router
  .route('/:id')
  .get(protect, getSoilType)
  .put(protect, authorize('admin', 'agronomist'), validateSoilTypeUpdate, updateSoilType)
  .delete(protect, authorize('admin', 'agronomist'), deleteSoilType);

router.get('/crop/:cropId', protect, getSoilTypesByCrop);

module.exports = router;