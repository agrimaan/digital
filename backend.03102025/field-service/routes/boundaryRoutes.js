const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const { 
  getBoundaries, 
  getBoundary, 
  createBoundary, 
  updateBoundary, 
  deleteBoundary,
  getBoundariesByField
} = require('../controllers/boundaryController');
const { protect, authorize } = require('../middleware/auth');

// Validation middleware
const validateBoundaryCreation = [
  check('field', 'Field ID is required').isMongoId(),
  check('geometry', 'Geometry is required').not().isEmpty(),
  check('geometry.type', 'Geometry type must be Polygon or MultiPolygon')
    .isIn(['Polygon', 'MultiPolygon']),
  check('geometry.coordinates', 'Geometry coordinates are required').isArray(),
  check('area', 'Area is required and must be a number').isNumeric(),
  check('perimeter', 'Perimeter is required and must be a number').isNumeric(),
  check('source', 'Source must be one of: gps, satellite, manual, drone')
    .optional()
    .isIn(['gps', 'satellite', 'manual', 'drone']),
  check('accuracy', 'Accuracy must be a number if provided')
    .optional()
    .isNumeric()
];

const validateBoundaryUpdate = [
  check('geometry.type', 'Geometry type must be Polygon or MultiPolygon')
    .optional()
    .isIn(['Polygon', 'MultiPolygon']),
  check('geometry.coordinates', 'Geometry coordinates must be an array if provided')
    .optional()
    .isArray(),
  check('area', 'Area must be a number if provided')
    .optional()
    .isNumeric(),
  check('perimeter', 'Perimeter must be a number if provided')
    .optional()
    .isNumeric(),
  check('source', 'Source must be one of: gps, satellite, manual, drone')
    .optional()
    .isIn(['gps', 'satellite', 'manual', 'drone']),
  check('accuracy', 'Accuracy must be a number if provided')
    .optional()
    .isNumeric()
];

// Routes
router
  .route('/')
  .get(protect, authorize('admin'), getBoundaries)
  .post(protect, validateBoundaryCreation, createBoundary);

router
  .route('/:id')
  .get(protect, getBoundary)
  .put(protect, validateBoundaryUpdate, updateBoundary)
  .delete(protect, deleteBoundary);

router.get('/field/:fieldId', protect, getBoundariesByField);

module.exports = router;