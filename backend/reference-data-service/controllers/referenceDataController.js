const SoilType = require('../models/SoilType');
const IrrigationType = require('../models/IrrigationType');
const CropType = require('../models/CropType');
const { validationResult } = require('express-validator');

// @desc    Get all soil types
// @route   GET /api/reference/soil-types
// @access  Private
exports.getSoilTypes = async (req, res) => {
  try {
    const soilTypes = await SoilType.find({ isActive: true })
      .sort({ displayOrder: 1, name: 1 })
      .select('-__v');

    res.json({
      success: true,
      count: soilTypes.length,
      data: soilTypes
    });
  } catch (error) {
    console.error('Error fetching soil types:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching soil types',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Get soil type by ID
// @route   GET /api/reference/soil-types/:id
// @access  Private
exports.getSoilTypeById = async (req, res) => {
  try {
    const soilType = await SoilType.findById(req.params.id).select('-__v');

    if (!soilType) {
      return res.status(404).json({
        success: false,
        message: 'Soil type not found'
      });
    }

    res.json({
      success: true,
      data: soilType
    });
  } catch (error) {
    console.error('Error fetching soil type:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching soil type',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Get all irrigation types
// @route   GET /api/reference/irrigation-types
// @access  Private
exports.getIrrigationTypes = async (req, res) => {
  try {
    const irrigationTypes = await IrrigationType.find({ isActive: true })
      .sort({ displayOrder: 1, name: 1 })
      .select('-__v');

    res.json({
      success: true,
      count: irrigationTypes.length,
      data: irrigationTypes
    });
  } catch (error) {
    console.error('Error fetching irrigation types:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching irrigation types',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Get irrigation type by ID
// @route   GET /api/reference/irrigation-types/:id
// @access  Private
exports.getIrrigationTypeById = async (req, res) => {
  try {
    const irrigationType = await IrrigationType.findById(req.params.id).select('-__v');

    if (!irrigationType) {
      return res.status(404).json({
        success: false,
        message: 'Irrigation type not found'
      });
    }

    res.json({
      success: true,
      data: irrigationType
    });
  } catch (error) {
    console.error('Error fetching irrigation type:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching irrigation type',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Get all crop types
// @route   GET /api/reference/crop-types
// @access  Private
exports.getCropTypes = async (req, res) => {
  try {
    const { category, season } = req.query;
    let filter = { isActive: true };

    if (category) {
      filter.category = category;
    }

    if (season) {
      filter['growthCharacteristics.seasons'] = season;
    }

    const cropTypes = await CropType.find(filter)
      .sort({ displayOrder: 1, name: 1 })
      .select('-__v');

    res.json({
      success: true,
      count: cropTypes.length,
      data: cropTypes
    });
  } catch (error) {
    console.error('Error fetching crop types:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching crop types',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Get crop type by ID
// @route   GET /api/reference/crop-types/:id
// @access  Private
exports.getCropTypeById = async (req, res) => {
  try {
    const cropType = await CropType.findById(req.params.id).select('-__v');

    if (!cropType) {
      return res.status(404).json({
        success: false,
        message: 'Crop type not found'
      });
    }

    res.json({
      success: true,
      data: cropType
    });
  } catch (error) {
    console.error('Error fetching crop type:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching crop type',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Get crop recommendations based on soil type and season
// @route   GET /api/reference/crop-recommendations
// @access  Private
exports.getCropRecommendations = async (req, res) => {
  try {
    const { soilType, season, category } = req.query;
    let filter = { isActive: true };

    if (soilType) {
      filter.suitableSoilTypes = { $in: [soilType] };
    }

    if (season) {
      filter['growthCharacteristics.seasons'] = season;
    }

    if (category) {
      filter.category = category;
    }

    const recommendations = await CropType.find(filter)
      .sort({ 'marketInfo.marketDemand': -1, displayOrder: 1 })
      .limit(10)
      .select('name code category description growthCharacteristics yieldEstimate marketInfo -_id');

    res.json({
      success: true,
      count: recommendations.length,
      data: recommendations,
      filters: { soilType, season, category }
    });
  } catch (error) {
    console.error('Error fetching crop recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching crop recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Get all reference data categories
// @route   GET /api/reference/categories
// @access  Private
exports.getCategories = async (req, res) => {
  try {
    const categories = {
      soilTypes: await SoilType.countDocuments({ isActive: true }),
      irrigationTypes: await IrrigationType.countDocuments({ isActive: true }),
      cropTypes: await CropType.countDocuments({ isActive: true }),
      cropCategories: await CropType.distinct('category', { isActive: true })
    };

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching categories',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};