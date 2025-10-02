const { validationResult } = require('express-validator');
const plantingService = require('../services/plantingService');
const responseHandler = require('../utils/responseHandler');

// @desc    Get all plantings
// @route   GET /api/plantings
// @access  Private
exports.getPlantings = async (req, res) => {
  try {
    // Filter plantings by owner if not admin
    const filter = req.user.role === 'admin' ? {} : { owner: req.user.id };
    
    // Apply additional filters if provided in query params
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.field) {
      filter.field = req.query.field;
    }
    
    if (req.query.crop) {
      filter.crop = req.query.crop;
    }
    
    const plantings = await plantingService.getAllPlantings(filter);
    
    return responseHandler.success(res, 200, plantings, 'Plantings retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving plantings', error);
  }
};

// @desc    Get single planting
// @route   GET /api/plantings/:id
// @access  Private
exports.getPlanting = async (req, res) => {
  try {
    const planting = await plantingService.getPlantingById(req.params.id);
    
    if (!planting) {
      return responseHandler.notFound(res, 'Planting not found');
    }

    // Check if user owns the planting or is admin
    if (planting.owner !== req.user.id && req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to access this planting');
    }

    return responseHandler.success(res, 200, planting, 'Planting retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving planting', error);
  }
};

// @desc    Create planting
// @route   POST /api/plantings
// @access  Private
exports.createPlanting = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseHandler.badRequest(res, 'Validation error', errors.array());
  }

  try {
    // Set owner to current user and add token for field service verification
    const plantingData = {
      ...req.body,
      owner: req.user.id,
      token: req.headers.authorization.split(' ')[1]
    };
    
    const planting = await plantingService.createPlanting(plantingData);
    
    return responseHandler.success(res, 201, planting, 'Planting created successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error creating planting', error);
  }
};

// @desc    Update planting
// @route   PUT /api/plantings/:id
// @access  Private
exports.updatePlanting = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseHandler.badRequest(res, 'Validation error', errors.array());
  }

  try {
    let planting = await plantingService.getPlantingById(req.params.id);
    
    if (!planting) {
      return responseHandler.notFound(res, 'Planting not found');
    }

    // Check if user owns the planting or is admin
    if (planting.owner !== req.user.id && req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to update this planting');
    }

    // Prevent owner change
    if (req.body.owner && req.body.owner !== planting.owner) {
      return responseHandler.badRequest(res, 'Cannot change planting owner');
    }

    // Update planting
    planting = await plantingService.updatePlanting(req.params.id, req.body);
    
    return responseHandler.success(res, 200, planting, 'Planting updated successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error updating planting', error);
  }
};

// @desc    Delete planting
// @route   DELETE /api/plantings/:id
// @access  Private
exports.deletePlanting = async (req, res) => {
  try {
    const planting = await plantingService.getPlantingById(req.params.id);
    
    if (!planting) {
      return responseHandler.notFound(res, 'Planting not found');
    }

    // Check if user owns the planting or is admin
    if (planting.owner !== req.user.id && req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to delete this planting');
    }

    await plantingService.deletePlanting(req.params.id);
    
    return responseHandler.success(res, 200, {}, 'Planting deleted successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error deleting planting', error);
  }
};

// @desc    Get plantings by field
// @route   GET /api/plantings/field/:fieldId
// @access  Private
exports.getPlantingsByField = async (req, res) => {
  try {
    const plantings = await plantingService.getPlantingsByField(req.params.fieldId);
    
    // Filter out plantings that don't belong to the user if not admin
    const filteredPlantings = req.user.role === 'admin' 
      ? plantings 
      : plantings.filter(planting => planting.owner === req.user.id);
    
    return responseHandler.success(res, 200, filteredPlantings, 'Plantings retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving plantings', error);
  }
};

// @desc    Get plantings by crop
// @route   GET /api/plantings/crop/:cropId
// @access  Private
exports.getPlantingsByCrop = async (req, res) => {
  try {
    const plantings = await plantingService.getPlantingsByCrop(req.params.cropId);
    
    // Filter out plantings that don't belong to the user if not admin
    const filteredPlantings = req.user.role === 'admin' 
      ? plantings 
      : plantings.filter(planting => planting.owner === req.user.id);
    
    return responseHandler.success(res, 200, filteredPlantings, 'Plantings retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving plantings', error);
  }
};

// @desc    Update planting status
// @route   PUT /api/plantings/:id/status
// @access  Private
exports.updatePlantingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return responseHandler.badRequest(res, 'Status is required');
    }
    
    const planting = await plantingService.getPlantingById(req.params.id);
    
    if (!planting) {
      return responseHandler.notFound(res, 'Planting not found');
    }

    // Check if user owns the planting or is admin
    if (planting.owner !== req.user.id && req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to update this planting');
    }

    const updatedPlanting = await plantingService.updatePlantingStatus(req.params.id, status);
    
    return responseHandler.success(res, 200, updatedPlanting, 'Planting status updated successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error updating planting status', error);
  }
};

// @desc    Add growth observation
// @route   POST /api/plantings/:id/observations
// @access  Private
exports.addGrowthObservation = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseHandler.badRequest(res, 'Validation error', errors.array());
  }

  try {
    const planting = await plantingService.getPlantingById(req.params.id);
    
    if (!planting) {
      return responseHandler.notFound(res, 'Planting not found');
    }

    // Check if user owns the planting or is admin or agronomist
    if (planting.owner !== req.user.id && 
        req.user.role !== 'admin' && 
        req.user.role !== 'agronomist') {
      return responseHandler.forbidden(res, 'Not authorized to add observations to this planting');
    }

    const observation = {
      ...req.body,
      date: req.body.date || new Date()
    };
    
    const updatedPlanting = await plantingService.addGrowthObservation(req.params.id, observation);
    
    return responseHandler.success(res, 200, updatedPlanting, 'Growth observation added successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error adding growth observation', error);
  }
};

// @desc    Get planting statistics
// @route   GET /api/plantings/statistics
// @access  Private
exports.getPlantingStatistics = async (req, res) => {
  try {
    const statistics = await plantingService.getPlantingStatistics(req.user.id);
    
    return responseHandler.success(res, 200, statistics, 'Planting statistics retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving planting statistics', error);
  }
};

// @desc    Get upcoming plantings
// @route   GET /api/plantings/upcoming
// @access  Private
exports.getUpcomingPlantings = async (req, res) => {
  try {
    const plantings = await plantingService.getUpcomingPlantings(req.user.id);
    
    return responseHandler.success(res, 200, plantings, 'Upcoming plantings retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving upcoming plantings', error);
  }
};

// @desc    Get plantings ready for harvest
// @route   GET /api/plantings/ready-for-harvest
// @access  Private
exports.getPlantingsReadyForHarvest = async (req, res) => {
  try {
    const plantings = await plantingService.getPlantingsReadyForHarvest(req.user.id);
    
    return responseHandler.success(res, 200, plantings, 'Plantings ready for harvest retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving plantings ready for harvest', error);
  }
};