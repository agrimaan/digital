const { validationResult } = require('express-validator');
const Consultation = require('../models/Consultation');
const responseHandler = require('../utils/responseHandler');

// @desc    Get all consultations
// @route   GET /api/consultations
// @access  Private (Agronomist, Farmer, Admin)
exports.getConsultations = async (req, res) => {
  try {
    // Filter consultations by user role
    let filter = {};
    if (req.user.role === 'farmer') {
      filter.farmerId = req.user.id;
    } else if (req.user.role === 'agronomist') {
      filter.agronomistId = req.user.id;
    }
    
    const consultations = await Consultation.find(filter).sort({ scheduledAt: -1 });
    
    return responseHandler.success(res, 200, consultations, 'Consultations retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving consultations', error);
  }
};

// @desc    Get single consultation
// @route   GET /api/consultations/:id
// @access  Private (Agronomist, Farmer, Admin)
exports.getConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id);
    
    if (!consultation) {
      return responseHandler.notFound(res, 'Consultation not found');
    }
    
    // Check if user is involved in the consultation or is admin
    if (consultation.farmerId !== req.user.id && 
        consultation.agronomistId !== req.user.id && 
        req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to access this consultation');
    }
    
    return responseHandler.success(res, 200, consultation, 'Consultation retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving consultation', error);
  }
};

// @desc    Create consultation
// @route   POST /api/consultations
// @access  Private (Farmer, Agronomist)
exports.createConsultation = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseHandler.badRequest(res, 'Validation error', errors.array());
  }
  
  try {
    const consultationData = {
      ...req.body,
      farmerId: req.user.role === 'farmer' ? req.user.id : req.body.farmerId,
      agronomistId: req.user.role === 'agronomist' ? req.user.id : req.body.agronomistId
    };
    
    const consultation = new Consultation(consultationData);
    const savedConsultation = await consultation.save();
    
    return responseHandler.success(res, 201, savedConsultation, 'Consultation created successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error creating consultation', error);
  }
};

// @desc    Update consultation
// @route   PUT /api/consultations/:id
// @access  Private (Farmer, Agronomist, Admin)
exports.updateConsultation = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseHandler.badRequest(res, 'Validation error', errors.array());
  }
  
  try {
    let consultation = await Consultation.findById(req.params.id);
    
    if (!consultation) {
      return responseHandler.notFound(res, 'Consultation not found');
    }
    
    // Check if user is involved in the consultation or is admin
    if (consultation.farmerId !== req.user.id && 
        consultation.agronomistId !== req.user.id && 
        req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to update this consultation');
    }
    
    consultation = await Consultation.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    return responseHandler.success(res, 200, consultation, 'Consultation updated successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error updating consultation', error);
  }
};

// @desc    Delete consultation
// @route   DELETE /api/consultations/:id
// @access  Private (Farmer, Agronomist, Admin)
exports.deleteConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id);
    
    if (!consultation) {
      return responseHandler.notFound(res, 'Consultation not found');
    }
    
    // Check if user is involved in the consultation or is admin
    if (consultation.farmerId !== req.user.id && 
        consultation.agronomistId !== req.user.id && 
        req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to delete this consultation');
    }
    
    await Consultation.findByIdAndDelete(req.params.id);
    
    return responseHandler.success(res, 200, {}, 'Consultation deleted successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error deleting consultation', error);
  }
};