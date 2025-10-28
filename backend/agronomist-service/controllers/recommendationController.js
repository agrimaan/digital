const { validationResult } = require('express-validator');
const Recommendation = require('../models/Recommendation');
const responseHandler = require('../utils/responseHandler');

// @desc    Get all recommendations
// @route   GET /api/recommendations
// @access  Private (Agronomist, Farmer, Admin)
exports.getRecommendations = async (req, res) => {
  try {
    // Filter recommendations by farmer if not agronomist or admin
    const filter = req.user.role === 'agronomist' || req.user.role === 'admin' 
      ? {} 
      : { farmerId: req.user.id };
      
    const recommendations = await Recommendation.find(filter).sort({ createdAt: -1 });
    
    return responseHandler.success(res, 200, recommendations, 'Recommendations retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving recommendations', error);
  }
};

// @desc    Get single recommendation
// @route   GET /api/recommendations/:id
// @access  Private (Agronomist, Farmer, Admin)
exports.getRecommendation = async (req, res) => {
  try {
    const recommendation = await Recommendation.findById(req.params.id);
    
    if (!recommendation) {
      return responseHandler.notFound(res, 'Recommendation not found');
    }
    
    // Check if user owns the recommendation or is agronomist/admin
    if (recommendation.farmerId !== req.user.id && req.user.role !== 'agronomist' && req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to access this recommendation');
    }
    
    return responseHandler.success(res, 200, recommendation, 'Recommendation retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving recommendation', error);
  }
};

// @desc    Create recommendation
// @route   POST /api/recommendations
// @access  Private (Agronomist only)
exports.createRecommendation = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseHandler.badRequest(res, 'Validation error', errors.array());
  }
  
  try {
    const recommendationData = {
      ...req.body,
      agronomistId: req.user.id
    };
    
    const recommendation = new Recommendation(recommendationData);
    const savedRecommendation = await recommendation.save();
    
    return responseHandler.success(res, 201, savedRecommendation, 'Recommendation created successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error creating recommendation', error);
  }
};

// @desc    Update recommendation
// @route   PUT /api/recommendations/:id
// @access  Private (Agronomist, Admin)
exports.updateRecommendation = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseHandler.badRequest(res, 'Validation error', errors.array());
  }
  
  try {
    let recommendation = await Recommendation.findById(req.params.id);
    
    if (!recommendation) {
      return responseHandler.notFound(res, 'Recommendation not found');
    }
    
    // Check if user owns the recommendation or is admin
    if (recommendation.agronomistId !== req.user.id && req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to update this recommendation');
    }
    
    recommendation = await Recommendation.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    return responseHandler.success(res, 200, recommendation, 'Recommendation updated successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error updating recommendation', error);
  }
};

// @desc    Delete recommendation
// @route   DELETE /api/recommendations/:id
// @access  Private (Agronomist, Admin)
exports.deleteRecommendation = async (req, res) => {
  try {
    const recommendation = await Recommendation.findById(req.params.id);
    
    if (!recommendation) {
      return responseHandler.notFound(res, 'Recommendation not found');
    }
    
    // Check if user owns the recommendation or is admin
    if (recommendation.agronomistId !== req.user.id && req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to delete this recommendation');
    }
    
    await Recommendation.findByIdAndDelete(req.params.id);
    
    return responseHandler.success(res, 200, {}, 'Recommendation deleted successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error deleting recommendation', error);
  }
};