const { validationResult } = require('express-validator');
const cropService = require('../services/cropService');
const responseHandler = require('../utils/responseHandler');

// @desc    Get all crops
// @route   GET /api/crops
// @access  Private
exports.getCrops = async (req, res) => {
  try {
    // Apply filters if provided in query params
    const filter = {};
    
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    if (req.query.waterRequirement) {
      filter.waterRequirement = req.query.waterRequirement;
    }
    
    const crops = await cropService.getAllCrops(filter);
    
    return responseHandler.success(res, 200, crops, 'Crops retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving crops', error);
  }
};

// @desc    Get single crop
// @route   GET /api/crops/:id
// @access  Private
exports.getCrop = async (req, res) => {
  try {
    const crop = await cropService.getCropById(req.params.id);
    
    if (!crop) {
      return responseHandler.notFound(res, 'Crop not found');
    }

    return responseHandler.success(res, 200, crop, 'Crop retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving crop', error);
  }
};

// @desc    Create crop
// @route   POST /api/crops
// @access  Private/Admin
exports.createCrop = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseHandler.badRequest(res, 'Validation error', errors.array());
  }

  try {
    // Set created by to current user
    const cropData = {
      ...req.body,
      createdBy: req.user.id
    };
    
    const crop = await cropService.createCrop(cropData);
    
    return responseHandler.success(res, 201, crop, 'Crop created successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error creating crop', error);
  }
};

// @desc    Update crop
// @route   PUT /api/crops/:id
// @access  Private/Admin
exports.updateCrop = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseHandler.badRequest(res, 'Validation error', errors.array());
  }

  try {
    let crop = await cropService.getCropById(req.params.id);
    
    if (!crop) {
      return responseHandler.notFound(res, 'Crop not found');
    }

    // Only admin or agronomist can update crops
    if (req.user.role !== 'admin' && req.user.role !== 'agronomist') {
      return responseHandler.forbidden(res, 'Not authorized to update crops');
    }

    // Update crop
    crop = await cropService.updateCrop(req.params.id, req.body);
    
    return responseHandler.success(res, 200, crop, 'Crop updated successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error updating crop', error);
  }
};

// @desc    Delete crop
// @route   DELETE /api/crops/:id
// @access  Private/Admin
exports.deleteCrop = async (req, res) => {
  try {
    const crop = await cropService.getCropById(req.params.id);
    
    if (!crop) {
      return responseHandler.notFound(res, 'Crop not found');
    }

    // Only admin can delete crops
    if (req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to delete crops');
    }

    await cropService.deleteCrop(req.params.id);
    
    return responseHandler.success(res, 200, {}, 'Crop deleted successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error deleting crop', error);
  }
};

// @desc    Get crops by category
// @route   GET /api/crops/category/:category
// @access  Private
exports.getCropsByCategory = async (req, res) => {
  try {
    const crops = await cropService.getCropsByCategory(req.params.category);
    
    return responseHandler.success(res, 200, crops, 'Crops retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving crops', error);
  }
};

// @desc    Get crops by soil type
// @route   GET /api/crops/soil/:soilType
// @access  Private
exports.getCropsBySoilType = async (req, res) => {
  try {
    const crops = await cropService.getCropsBySoilType(req.params.soilType);
    
    return responseHandler.success(res, 200, crops, 'Crops retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving crops', error);
  }
};

// @desc    Get crops by season
// @route   GET /api/crops/season/:month
// @access  Private
exports.getCropsBySeason = async (req, res) => {
  try {
    const month = parseInt(req.params.month);
    
    if (isNaN(month) || month < 1 || month > 12) {
      return responseHandler.badRequest(res, 'Month must be a number between 1 and 12');
    }
    
    const crops = await cropService.getCropsBySeason(month);
    
    return responseHandler.success(res, 200, crops, 'Crops retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving crops', error);
  }
};

// @desc    Search crops
// @route   GET /api/crops/search/:term
// @access  Private
exports.searchCrops = async (req, res) => {
  try {
    const crops = await cropService.searchCropsByName(req.params.term);
    
    return responseHandler.success(res, 200, crops, 'Crops retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error searching crops', error);
  }
};

// @desc    Get crop recommendations
// @route   POST /api/crops/recommendations
// @access  Private
exports.getCropRecommendations = async (req, res) => {
  try {
    const { soilType, temperature, waterAvailability, season } = req.body;
    
    const crops = await cropService.getCropRecommendations({
      soilType,
      temperature,
      waterAvailability,
      season
    });
    
    return responseHandler.success(res, 200, crops, 'Crop recommendations retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving crop recommendations', error);
  }
};