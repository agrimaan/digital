
const { validationResult } = require('express-validator');
const FarmerRating = require('../models/FarmerRating');
const responseHandler = require('../utils/responseHandler');

// @desc    Get all farmer ratings
// @route   GET /api/ratings
// @access  Public
exports.getRatings = async (req, res) => {
  try {
    const ratings = await FarmerRating.find();
    return responseHandler.success(res, 200, ratings, 'Farmer ratings retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving farmer ratings', error);
  }
};

// @desc    Get rating for specific farmer
// @route   GET /api/ratings/farmer/:farmerId
// @access  Public
exports.getRatingByFarmer = async (req, res) => {
  try {
    const rating = await FarmerRating.findOne({ farmerId: req.params.farmerId });
    
    if (!rating) {
      return responseHandler.notFound(res, 'Farmer rating not found');
    }
    
    return responseHandler.success(res, 200, rating, 'Farmer rating retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving farmer rating', error);
  }
};

// @desc    Create or update farmer rating
// @route   POST /api/ratings
// @access  Private (system only)
exports.createOrUpdateRating = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseHandler.badRequest(res, 'Validation error', errors.array());
  }
  
  try {
    const { farmerId } = req.body;
    
    // Check if rating already exists
    let rating = await FarmerRating.findOne({ farmerId });
    
    if (rating) {
      // Update existing rating
      rating = await FarmerRating.findOneAndUpdate(
        { farmerId },
        { ...req.body, lastUpdated: Date.now() },
        { new: true, runValidators: true }
      );
    } else {
      // Create new rating
      rating = new FarmerRating(req.body);
      await rating.save();
    }
    
    return responseHandler.success(res, 200, rating, 'Farmer rating created/updated successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error creating/updating farmer rating', error);
  }
};

// @desc    Update specific component of farmer rating
// @route   PATCH /api/ratings/farmer/:farmerId/component
// @access  Private (system only)
exports.updateRatingComponent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseHandler.badRequest(res, 'Validation error', errors.array());
  }
  
  try {
    const { farmerId } = req.params;
    const { component, data } = req.body;
    
    // Find the rating
    const rating = await FarmerRating.findOne({ farmerId });
    
    if (!rating) {
      return responseHandler.notFound(res, 'Farmer rating not found');
    }
    
    // Update specific component
    switch (component) {
      case 'organicCertification':
        rating.organicCertification = { ...rating.organicCertification, ...data };
        break;
      case 'iotSensors':
        rating.iotSensors = { ...rating.iotSensors, ...data };
        break;
      case 'sustainablePractices':
        rating.sustainablePractices = { ...rating.sustainablePractices, ...data };
        break;
      case 'purchaseHistory':
        rating.purchaseHistory = { ...rating.purchaseHistory, ...data };
        break;
      default:
        return responseHandler.badRequest(res, 'Invalid component specified');
    }
    
    // Save the updated rating (pre-save hook will recalculate overall score and tier)
    await rating.save();
    
    return responseHandler.success(res, 200, rating, `Farmer ${component} updated successfully`);
  } catch (error) {
    return responseHandler.error(res, 500, 'Error updating farmer rating component', error);
  }
};
