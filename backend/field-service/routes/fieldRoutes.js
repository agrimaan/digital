const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const { 
  getFields, 
  getField, 
  createField, 
  updateField, 
  deleteField,
  getNearbyFields
} = require('../controllers/fieldController');
const { protect, authorize } = require('../middleware/auth');

// Validation middleware
const validateFieldCreation = [
  check('name', 'Field name is required').not().isEmpty(),
  check('location', 'Location is required').not().isEmpty(),
  check('location.coordinates', 'Location coordinates must be an array of [longitude, latitude]').isArray(),
  check('area', 'Area is required and must be a number').isNumeric(),
  check('status', 'Status must be one of: active, fallow, preparation, harvested')
    .optional()
    .isIn(['active', 'fallow', 'preparation', 'harvested']),
  check('irrigationSource', 'Irrigation source must be one of: rainfed, canal, well, borewell, pond, river, other')
    .optional()
    .isIn(['rainfed', 'canal', 'well', 'borewell', 'pond', 'river', 'other']),
  check('soilType', 'Soil type must be one of: clay, sandy, loamy, silty, peaty, chalky')
    .optional()
    .isIn(['clay', 'sandy', 'loamy', 'silty', 'peaty', 'chalky'])
];

const validateFieldUpdate = [
  check('name', 'Field name must not be empty if provided').optional().not().isEmpty(),
  check('location.coordinates', 'Location coordinates must be an array of [longitude, latitude]').optional().isArray(),
  check('area', 'Area must be a number if provided').optional().isNumeric(),
  check('status', 'Status must be one of: active, fallow, preparation, harvested')
    .optional()
    .isIn(['active', 'fallow', 'preparation', 'harvested']),
  check('irrigationSystem', 'Irrigation system must be one of: flood, drip, sprinkler, none, other')
    .optional()
    .isIn(['flood', 'drip', 'sprinkler', 'none', 'other']),
  check('soilType', 'Soil type must be one of: clay, sandy, loamy, silty, peaty, chalky')
    .optional()
    .isIn(['clay', 'sandy', 'loamy', 'silty', 'peaty', 'chalky'])
];

// Routes
router
  .route('/')
  .get(protect, getFields)
  .post(protect, validateFieldCreation, createField);

router
  .route('/:id')
  .get(protect, getField)
  .put(protect, validateFieldUpdate, updateField)
  .delete(protect, deleteField);

router.get('/nearby', protect, getNearbyFields);

module.exports = router;