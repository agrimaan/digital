
const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const { 
  getRatings,
  getRatingByFarmer,
  createOrUpdateRating,
  updateRatingComponent
} = require('../controllers/ratingController');
const { protect, authorize } = require('@agrimaan/shared').middleware;

// Validation middleware
const validateRatingCreation = [
  check('farmerId', 'Farmer ID is required').not().isEmpty()
];

const validateRatingComponentUpdate = [
  check('component', 'Component is required').not().isEmpty(),
  check('component', 'Component must be one of: organicCertification, iotSensors, sustainablePractices, purchaseHistory')
    .isIn(['organicCertification', 'iotSensors', 'sustainablePractices', 'purchaseHistory'])
];

// Routes
router
  .route('/')
  .get(getRatings)
  .post(protect, authorize('system'), validateRatingCreation, createOrUpdateRating);

router
  .route('/farmer/:farmerId')
  .get(getRatingByFarmer);

router
  .route('/farmer/:farmerId/component')
  .patch(protect, authorize('system'), validateRatingComponentUpdate, updateRatingComponent);

module.exports = router;
