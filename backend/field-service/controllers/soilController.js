const { validationResult } = require('express-validator');
const Soil = require('../models/Soil');
const soilService = require('../services/soilService');
const responseHandler = require('../utils/responseHandler');

// @desc    Get all soil types
// @route   GET /api/soil
// @access  Private
exports.getSoilTypes = async (req, res) => {
  try {
    const soilTypes = await soilService.getAllSoilTypes();
    
    return responseHandler.success(res, 200, soilTypes, 'Soil types retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving soil types', error);
  }
};

// @desc    Get single soil type
// @route   GET /api/soil/:id
// @access  Private
exports.getSoilType = async (req, res) => {
  try {
    const soilType = await soilService.getSoilTypeById(req.params.id);
    
    if (!soilType) {
      return responseHandler.notFound(res, 'Soil type not found');
    }

    return responseHandler.success(res, 200, soilType, 'Soil type retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving soil type', error);
  }
};

// @desc    Create soil type
// @route   POST /api/soil
// @access  Private/Admin
exports.createSoilType = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseHandler.badRequest(res, 'Validation error', errors.array());
  }

  try {
    // Only admin can create soil types
    if (req.user.role !== 'admin' && req.user.role !== 'agronomist') {
      return responseHandler.forbidden(res, 'Not authorized to create soil types');
    }
    
    const soilType = await soilService.createSoilType(req.body);
    
    return responseHandler.success(res, 201, soilType, 'Soil type created successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error creating soil type', error);
  }
};

// @desc    Update soil type
// @route   PUT /api/soil/:id
// @access  Private/Admin
exports.updateSoilType = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseHandler.badRequest(res, 'Validation error', errors.array());
  }

  try {
    // Only admin can update soil types
    if (req.user.role !== 'admin' && req.user.role !== 'agronomist') {
      return responseHandler.forbidden(res, 'Not authorized to update soil types');
    }
    
    let soilType = await soilService.getSoilTypeById(req.params.id);
    
    if (!soilType) {
      return responseHandler.notFound(res, 'Soil type not found');
    }

    // Update soil type
    soilType = await soilService.updateSoilType(req.params.id, req.body);
    
    return responseHandler.success(res, 200, soilType, 'Soil type updated successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error updating soil type', error);
  }
};

// @desc    Delete soil type
// @route   DELETE /api/soil/:id
// @access  Private/Admin
exports.deleteSoilType = async (req, res) => {
  try {
    // Only admin can delete soil types
    if (req.user.role !== 'admin' && req.user.role !== 'agronomist') {
      return responseHandler.forbidden(res, 'Not authorized to delete soil types');
    }
    
    const soilType = await soilService.getSoilTypeById(req.params.id);
    
    if (!soilType) {
      return responseHandler.notFound(res, 'Soil type not found');
    }

    await soilService.deleteSoilType(req.params.id);
    
    return responseHandler.success(res, 200, {}, 'Soil type deleted successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error deleting soil type', error);
  }
};

// @desc    Get soil types suitable for a specific crop
// @route   GET /api/soil/crop/:cropId
// @access  Private
exports.getSoilTypesByCrop = async (req, res) => {
  try {
    const soilTypes = await soilService.getSoilTypesByCrop(req.params.cropId);
    
    return responseHandler.success(res, 200, soilTypes, 'Soil types retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving soil types', error);
  }
};