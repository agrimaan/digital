
const { validationResult } = require('express-validator');
const Promotion = require('../models/Promotion');
const responseHandler = require('../utils/responseHandler');

// @desc    Get all active promotions
// @route   GET /api/promotions
// @access  Public
exports.getPromotions = async (req, res) => {
  try {
    const now = new Date();
    const promotions = await Promotion.find({ 
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    });
    
    return responseHandler.success(res, 200, promotions, 'Active promotions retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving promotions', error);
  }
};

// @desc    Get promotions by supplier
// @route   GET /api/promotions/supplier/:supplierId
// @access  Public
exports.getPromotionsBySupplier = async (req, res) => {
  try {
    const now = new Date();
    const promotions = await Promotion.find({ 
      supplierId: req.params.supplierId,
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    });
    
    return responseHandler.success(res, 200, promotions, 'Supplier promotions retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving supplier promotions', error);
  }
};

// @desc    Get single promotion
// @route   GET /api/promotions/:id
// @access  Public
exports.getPromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id);
    
    if (!promotion) {
      return responseHandler.notFound(res, 'Promotion not found');
    }
    
    // Check if promotion is active and within date range
    const now = new Date();
    if (!promotion.isActive || promotion.startDate > now || promotion.endDate < now) {
      return responseHandler.badRequest(res, 'Promotion is not currently active');
    }
    
    return responseHandler.success(res, 200, promotion, 'Promotion retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving promotion', error);
  }
};

// @desc    Create promotion
// @route   POST /api/promotions
// @access  Private (supplier only)
exports.createPromotion = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseHandler.badRequest(res, 'Validation error', errors.array());
  }
  
  try {
    const newPromotion = new Promotion(req.body);
    const savedPromotion = await newPromotion.save();
    
    return responseHandler.success(res, 201, savedPromotion, 'Promotion created successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error creating promotion', error);
  }
};

// @desc    Update promotion
// @route   PUT /api/promotions/:id
// @access  Private (supplier or admin)
exports.updatePromotion = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseHandler.badRequest(res, 'Validation error', errors.array());
  }
  
  try {
    const promotion = await Promotion.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!promotion) {
      return responseHandler.notFound(res, 'Promotion not found');
    }
    
    return responseHandler.success(res, 200, promotion, 'Promotion updated successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error updating promotion', error);
  }
};

// @desc    Delete promotion
// @route   DELETE /api/promotions/:id
// @access  Private (supplier or admin)
exports.deletePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!promotion) {
      return responseHandler.notFound(res, 'Promotion not found');
    }
    
    return responseHandler.success(res, 200, {}, 'Promotion deactivated successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error deactivating promotion', error);
  }
};
