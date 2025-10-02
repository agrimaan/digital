const { validationResult } = require('express-validator');
const Field = require('../models/Field');
const fieldService = require('../services/fieldService');
const responseHandler = require('../utils/responseHandler');

// @desc    Get all fields
// @route   GET /api/fields
// @access  Private
exports.getFields = async (req, res) => {
  try {
    // Filter fields by owner if not admin
    const filter = req.user.role === 'admin' ? {} : { owner: req.user.id };
    
    const fields = await fieldService.getAllFields(filter);
    
    return responseHandler.success(res, 200, fields, 'Fields retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving fields', error);
  }
};

// @desc    Get single field
// @route   GET /api/fields/:id
// @access  Private
exports.getField = async (req, res) => {
  try {
    const field = await fieldService.getFieldById(req.params.id);
    
    if (!field) {
      return responseHandler.notFound(res, 'Field not found');
    }

    // Check if user owns the field or is admin
    if (field.owner !== req.user.id && req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to access this field');
    }

    return responseHandler.success(res, 200, field, 'Field retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving field', error);
  }
};

// @desc    Create field
// @route   POST /api/fields
// @access  Private
exports.createField = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseHandler.badRequest(res, 'Validation error', errors.array());
  }

  try {
    // Set owner to current user
    const fieldData = {
      ...req.body,
      owner: req.user.id
    };
    
    const field = await fieldService.createField(fieldData);
    
    return responseHandler.success(res, 201, field, 'Field created successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error creating field', error);
  }
};

// @desc    Update field
// @route   PUT /api/fields/:id
// @access  Private
exports.updateField = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseHandler.badRequest(res, 'Validation error', errors.array());
  }

  try {
    let field = await fieldService.getFieldById(req.params.id);
    
    if (!field) {
      return responseHandler.notFound(res, 'Field not found');
    }

    // Check if user owns the field or is admin
    if (field.owner !== req.user.id && req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to update this field');
    }

    // Update field
    field = await fieldService.updateField(req.params.id, req.body);
    
    return responseHandler.success(res, 200, field, 'Field updated successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error updating field', error);
  }
};

// @desc    Delete field
// @route   DELETE /api/fields/:id
// @access  Private
exports.deleteField = async (req, res) => {
  try {
    const field = await fieldService.getFieldById(req.params.id);
    
    if (!field) {
      return responseHandler.notFound(res, 'Field not found');
    }

    // Check if user owns the field or is admin
    if (field.owner !== req.user.id && req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to delete this field');
    }

    await fieldService.deleteField(req.params.id);
    
    return responseHandler.success(res, 200, {}, 'Field deleted successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error deleting field', error);
  }
};

// @desc    Get fields by location
// @route   GET /api/fields/nearby
// @access  Private
exports.getNearbyFields = async (req, res) => {
  try {
    const { longitude, latitude, distance = 10000 } = req.query; // distance in meters
    
    if (!longitude || !latitude) {
      return responseHandler.badRequest(res, 'Longitude and latitude are required');
    }

    const fields = await fieldService.getNearbyFields(
      parseFloat(longitude),
      parseFloat(latitude),
      parseFloat(distance),
      req.user.role === 'admin' ? null : req.user.id
    );
    
    return responseHandler.success(res, 200, fields, 'Nearby fields retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving nearby fields', error);
  }
};