const { validationResult } = require('express-validator');
const harvestService = require('../services/harvestService');
const responseHandler = require('../utils/responseHandler');

// @desc    Get all harvests
// @route   GET /api/harvests
// @access  Private
exports.getHarvests = async (req, res) => {
  try {
    // Filter harvests by owner if not admin
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
    
    const harvests = await harvestService.getAllHarvests(filter);
    
    return responseHandler.success(res, 200, harvests, 'Harvests retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving harvests', error);
  }
};

// @desc    Get single harvest
// @route   GET /api/harvests/:id
// @access  Private
exports.getHarvest = async (req, res) => {
  try {
    const harvest = await harvestService.getHarvestById(req.params.id);
    
    if (!harvest) {
      return responseHandler.notFound(res, 'Harvest not found');
    }

    // Check if user owns the harvest or is admin
    if (harvest.owner !== req.user.id && req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to access this harvest');
    }

    return responseHandler.success(res, 200, harvest, 'Harvest retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving harvest', error);
  }
};

// @desc    Create harvest
// @route   POST /api/harvests
// @access  Private
exports.createHarvest = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseHandler.badRequest(res, 'Validation error', errors.array());
  }

  try {
    // Set owner to current user
    const harvestData = {
      ...req.body,
      owner: req.user.id
    };
    
    const harvest = await harvestService.createHarvest(harvestData);
    
    return responseHandler.success(res, 201, harvest, 'Harvest created successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error creating harvest: ' + error.message, error);
  }
};

// @desc    Update harvest
// @route   PUT /api/harvests/:id
// @access  Private
exports.updateHarvest = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseHandler.badRequest(res, 'Validation error', errors.array());
  }

  try {
    const harvest = await harvestService.getHarvestById(req.params.id);
    
    if (!harvest) {
      return responseHandler.notFound(res, 'Harvest not found');
    }

    // Check if user owns the harvest or is admin
    if (harvest.owner !== req.user.id && req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to update this harvest');
    }

    // Prevent owner change
    if (req.body.owner && req.body.owner !== harvest.owner) {
      return responseHandler.badRequest(res, 'Cannot change harvest owner');
    }

    // Update harvest
    const updatedHarvest = await harvestService.updateHarvest(req.params.id, req.body);
    
    return responseHandler.success(res, 200, updatedHarvest, 'Harvest updated successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error updating harvest', error);
  }
};

// @desc    Delete harvest
// @route   DELETE /api/harvests/:id
// @access  Private
exports.deleteHarvest = async (req, res) => {
  try {
    const harvest = await harvestService.getHarvestById(req.params.id);
    
    if (!harvest) {
      return responseHandler.notFound(res, 'Harvest not found');
    }

    // Check if user owns the harvest or is admin
    if (harvest.owner !== req.user.id && req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to delete this harvest');
    }

    await harvestService.deleteHarvest(req.params.id);
    
    return responseHandler.success(res, 200, {}, 'Harvest deleted successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error deleting harvest', error);
  }
};

// @desc    Get harvests by field
// @route   GET /api/harvests/field/:fieldId
// @access  Private
exports.getHarvestsByField = async (req, res) => {
  try {
    const harvests = await harvestService.getHarvestsByField(req.params.fieldId);
    
    // Filter out harvests that don't belong to the user if not admin
    const filteredHarvests = req.user.role === 'admin' 
      ? harvests 
      : harvests.filter(harvest => harvest.owner === req.user.id);
    
    return responseHandler.success(res, 200, filteredHarvests, 'Harvests retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving harvests', error);
  }
};

// @desc    Get harvests by crop
// @route   GET /api/harvests/crop/:cropId
// @access  Private
exports.getHarvestsByCrop = async (req, res) => {
  try {
    const harvests = await harvestService.getHarvestsByCrop(req.params.cropId);
    
    // Filter out harvests that don't belong to the user if not admin
    const filteredHarvests = req.user.role === 'admin' 
      ? harvests 
      : harvests.filter(harvest => harvest.owner === req.user.id);
    
    return responseHandler.success(res, 200, filteredHarvests, 'Harvests retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving harvests', error);
  }
};

// @desc    Update harvest status
// @route   PUT /api/harvests/:id/status
// @access  Private
exports.updateHarvestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return responseHandler.badRequest(res, 'Status is required');
    }
    
    const harvest = await harvestService.getHarvestById(req.params.id);
    
    if (!harvest) {
      return responseHandler.notFound(res, 'Harvest not found');
    }

    // Check if user owns the harvest or is admin
    if (harvest.owner !== req.user.id && req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to update this harvest');
    }

    const updatedHarvest = await harvestService.updateHarvestStatus(req.params.id, status);
    
    return responseHandler.success(res, 200, updatedHarvest, 'Harvest status updated successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error updating harvest status', error);
  }
};

// @desc    Get harvest statistics
// @route   GET /api/harvests/statistics
// @access  Private
exports.getHarvestStatistics = async (req, res) => {
  try {
    const statistics = await harvestService.getHarvestStatistics(req.user.id);
    
    return responseHandler.success(res, 200, statistics, 'Harvest statistics retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving harvest statistics', error);
  }
};

// @desc    Get upcoming harvests
// @route   GET /api/harvests/upcoming
// @access  Private
exports.getUpcomingHarvests = async (req, res) => {
  try {
    const harvests = await harvestService.getUpcomingHarvests(req.user.id);
    
    return responseHandler.success(res, 200, harvests, 'Upcoming harvests retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving upcoming harvests', error);
  }
};