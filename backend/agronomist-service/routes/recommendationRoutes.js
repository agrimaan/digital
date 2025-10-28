const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const { 
  getRecommendations,
  getRecommendation,
  createRecommendation,
  updateRecommendation,
  deleteRecommendation
} = require('../controllers/recommendationController');
const { protect, authorize } = require('@agrimaan/shared').middleware;

// Validation middleware
const validateRecommendationCreation = [
  check('farmerId', 'Farmer ID is required').not().isEmpty(),
  check('fieldId', 'Field ID is required').not().isEmpty(),
  check('cropId', 'Crop ID is required').not().isEmpty(),
  check('title', 'Recommendation title is required').not().isEmpty(),
  check('description', 'Recommendation description is required').not().isEmpty(),
  check('recommendationType', 'Recommendation type is required').not().isEmpty(),
  check('recommendationType', 'Recommendation type must be one of: fertilizer, pesticide, irrigation, planting, harvesting, soil-health, weather')
    .isIn(['fertilizer', 'pesticide', 'irrigation', 'planting', 'harvesting', 'soil-health', 'weather'])
];

const validateRecommendationUpdate = [
  check('title', 'Recommendation title must not be empty if provided').optional().not().isEmpty(),
  check('description', 'Recommendation description must not be empty if provided').optional().not().isEmpty(),
  check('recommendationType', 'Recommendation type must be valid if provided')
    .optional()
    .isIn(['fertilizer', 'pesticide', 'irrigation', 'planting', 'harvesting', 'soil-health', 'weather']),
  check('priority', 'Priority must be valid if provided')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent']),
  check('status', 'Status must be valid if provided')
    .optional()
    .isIn(['pending', 'in-progress', 'completed', 'dismissed'])
];

// Routes
router
  .route('/')
  .get(protect, getRecommendations)
  .post(protect, authorize('agronomist'), validateRecommendationCreation, createRecommendation);

router
  .route('/:id')
  .get(protect, getRecommendation)
  .put(protect, authorize('agronomist', 'admin'), validateRecommendationUpdate, updateRecommendation)
  .delete(protect, authorize('agronomist', 'admin'), deleteRecommendation);

module.exports = router;