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
  getCategories,
  getCrops,
  getVarieties
} = require('../controllers/referenceDataController');
const { protect } = require('../middleware/auth');
const { get } = require('http');

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

// GET /api/ref/crops?name=rice
router.get('/crops', protect, getCrops);

// GET /api/ref/varieties?crop=rice
router.get('/varieties', protect, getVarieties);



module.exports = router;