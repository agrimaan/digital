const { validationResult } = require('express-validator');
const CropIssue = require('../models/CropIssue');
const responseHandler = require('../utils/responseHandler');

// @desc    Get all crop issues
// @route   GET /api/issues
// @access  Private (Farmer, Agronomist, Admin)
exports.getCropIssues = async (req, res) => {
  try {
    // Filter issues by user role
    let filter = {};
    if (req.user.role === 'farmer') {
      filter.farmerId = req.user.id;
    } else if (req.user.role === 'agronomist') {
      filter.assignedTo = req.user.id;
    }
    
    const issues = await CropIssue.find(filter).sort({ createdAt: -1 });
    
    return responseHandler.success(res, 200, issues, 'Crop issues retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving crop issues', error);
  }
};

// @desc    Get single crop issue
// @route   GET /api/issues/:id
// @access  Private (Farmer, Agronomist, Admin)
exports.getCropIssue = async (req, res) => {
  try {
    const issue = await CropIssue.findById(req.params.id);
    
    if (!issue) {
      return responseHandler.notFound(res, 'Crop issue not found');
    }
    
    // Check if user is involved with the issue or is admin
    if (issue.farmerId !== req.user.id && 
        issue.assignedTo !== req.user.id && 
        req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to access this crop issue');
    }
    
    return responseHandler.success(res, 200, issue, 'Crop issue retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving crop issue', error);
  }
};

// @desc    Create crop issue
// @route   POST /api/issues
// @access  Private (Farmer)
exports.createCropIssue = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseHandler.badRequest(res, 'Validation error', errors.array());
  }
  
  try {
    const issueData = {
      ...req.body,
      farmerId: req.user.id,
      reportedBy: req.user.id
    };
    
    const issue = new CropIssue(issueData);
    const savedIssue = await issue.save();
    
    return responseHandler.success(res, 201, savedIssue, 'Crop issue reported successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error reporting crop issue', error);
  }
};

// @desc    Update crop issue
// @route   PUT /api/issues/:id
// @access  Private (Farmer, Agronomist, Admin)
exports.updateCropIssue = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseHandler.badRequest(res, 'Validation error', errors.array());
  }
  
  try {
    let issue = await CropIssue.findById(req.params.id);
    
    if (!issue) {
      return responseHandler.notFound(res, 'Crop issue not found');
    }
    
    // Check if user is involved with the issue or is admin
    if (issue.farmerId !== req.user.id && 
        issue.assignedTo !== req.user.id && 
        req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to update this crop issue');
    }
    
    issue = await CropIssue.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    return responseHandler.success(res, 200, issue, 'Crop issue updated successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error updating crop issue', error);
  }
};

// @desc    Delete crop issue
// @route   DELETE /api/issues/:id
// @access  Private (Farmer, Admin)
exports.deleteCropIssue = async (req, res) => {
  try {
    const issue = await CropIssue.findById(req.params.id);
    
    if (!issue) {
      return responseHandler.notFound(res, 'Crop issue not found');
    }
    
    // Check if user owns the issue or is admin
    if (issue.farmerId !== req.user.id && req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to delete this crop issue');
    }
    
    await CropIssue.findByIdAndDelete(req.params.id);
    
    return responseHandler.success(res, 200, {}, 'Crop issue deleted successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error deleting crop issue', error);
  }
};