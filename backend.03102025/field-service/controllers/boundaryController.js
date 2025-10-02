const { validationResult } = require('express-validator');
const Boundary = require('../models/Boundary');
const Field = require('../models/Field');
const boundaryService = require('../services/boundaryService');
const fieldService = require('../services/fieldService');
const responseHandler = require('../utils/responseHandler');

// @desc    Get all boundaries
// @route   GET /api/boundaries
// @access  Private/Admin
exports.getBoundaries = async (req, res) => {
  try {
    // Only admin can get all boundaries
    if (req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to access all boundaries');
    }
    
    const boundaries = await boundaryService.getAllBoundaries();
    
    return responseHandler.success(res, 200, boundaries, 'Boundaries retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving boundaries', error);
  }
};

// @desc    Get single boundary
// @route   GET /api/boundaries/:id
// @access  Private
exports.getBoundary = async (req, res) => {
  try {
    const boundary = await boundaryService.getBoundaryById(req.params.id);
    
    if (!boundary) {
      return responseHandler.notFound(res, 'Boundary not found');
    }

    // Get the field to check ownership
    const field = await fieldService.getFieldById(boundary.field);
    
    if (!field) {
      return responseHandler.notFound(res, 'Associated field not found');
    }

    // Check if user owns the field or is admin
    if (field.owner !== req.user.id && req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to access this boundary');
    }

    return responseHandler.success(res, 200, boundary, 'Boundary retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving boundary', error);
  }
};

// @desc    Create boundary
// @route   POST /api/boundaries
// @access  Private
exports.createBoundary = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseHandler.badRequest(res, 'Validation error', errors.array());
  }

  try {
    // Check if field exists and user owns it
    const field = await fieldService.getFieldById(req.body.field);
    
    if (!field) {
      return responseHandler.notFound(res, 'Field not found');
    }

    // Check if user owns the field or is admin
    if (field.owner !== req.user.id && req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to create boundary for this field');
    }

    // Check if field already has a boundary
    if (field.boundary) {
      return responseHandler.badRequest(res, 'Field already has a boundary');
    }

    // Create boundary
    const boundary = await boundaryService.createBoundary(req.body);
    
    // Update field with boundary reference
    await fieldService.updateField(field._id, { boundary: boundary._id });
    
    return responseHandler.success(res, 201, boundary, 'Boundary created successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error creating boundary', error);
  }
};

// @desc    Update boundary
// @route   PUT /api/boundaries/:id
// @access  Private
exports.updateBoundary = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseHandler.badRequest(res, 'Validation error', errors.array());
  }

  try {
    let boundary = await boundaryService.getBoundaryById(req.params.id);
    
    if (!boundary) {
      return responseHandler.notFound(res, 'Boundary not found');
    }

    // Get the field to check ownership
    const field = await fieldService.getFieldById(boundary.field);
    
    if (!field) {
      return responseHandler.notFound(res, 'Associated field not found');
    }

    // Check if user owns the field or is admin
    if (field.owner !== req.user.id && req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to update this boundary');
    }

    // Cannot change the field association
    if (req.body.field && req.body.field.toString() !== boundary.field.toString()) {
      return responseHandler.badRequest(res, 'Cannot change field association');
    }

    // Update boundary
    boundary = await boundaryService.updateBoundary(req.params.id, req.body);
    
    return responseHandler.success(res, 200, boundary, 'Boundary updated successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error updating boundary', error);
  }
};

// @desc    Delete boundary
// @route   DELETE /api/boundaries/:id
// @access  Private
exports.deleteBoundary = async (req, res) => {
  try {
    const boundary = await boundaryService.getBoundaryById(req.params.id);
    
    if (!boundary) {
      return responseHandler.notFound(res, 'Boundary not found');
    }

    // Get the field to check ownership
    const field = await fieldService.getFieldById(boundary.field);
    
    if (!field) {
      return responseHandler.notFound(res, 'Associated field not found');
    }

    // Check if user owns the field or is admin
    if (field.owner !== req.user.id && req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to delete this boundary');
    }

    // Delete boundary
    await boundaryService.deleteBoundary(req.params.id);
    
    // Update field to remove boundary reference
    await fieldService.updateField(field._id, { boundary: null });
    
    return responseHandler.success(res, 200, {}, 'Boundary deleted successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error deleting boundary', error);
  }
};

// @desc    Get boundaries by field
// @route   GET /api/boundaries/field/:fieldId
// @access  Private
exports.getBoundariesByField = async (req, res) => {
  try {
    // Check if field exists and user owns it
    const field = await fieldService.getFieldById(req.params.fieldId);
    
    if (!field) {
      return responseHandler.notFound(res, 'Field not found');
    }

    // Check if user owns the field or is admin
    if (field.owner !== req.user.id && req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to access boundaries for this field');
    }

    const boundaries = await boundaryService.getBoundariesByField(req.params.fieldId);
    
    return responseHandler.success(res, 200, boundaries, 'Boundaries retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving boundaries', error);
  }
};