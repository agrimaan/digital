const express = require('express');
const router = express.Router();
const {
  getSoilTypes,
  getSoilTypeById,
  getIrrigationTypes,
  getIrrigationTypeById,
  getCropTypes,
  getCropTypeById,
  getCropRecommendations,
  getCategories
} = require('../controllers/referenceDataController');
const { protect } = require('../middleware/auth');

// Soil Types Routes
router.get('/soil-types', protect, getSoilTypes);
router.get('/soil-types/:id', protect, getSoilTypeById);

// Irrigation Types Routes
router.get('/irrigation-types', protect, getIrrigationTypes);
router.get('/irrigation-types/:id', protect, getIrrigationTypeById);

// Crop Types Routes
router.get('/crop-types', protect, getCropTypes);
router.get('/crop-types/:id', protect, getCropTypeById);

// Recommendations
router.get('/crop-recommendations', protect, getCropRecommendations);

// Categories Overview
router.get('/categories', protect, getCategories);

module.exports = router;