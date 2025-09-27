
const express = require('express');
const Crop = require('../models/Crop');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/crops
// @desc    Get all crops for logged in user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const crops = await Crop.find({ farmerId: req.user.id })
      .populate('farmId', 'name location')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: crops.length,
      data: crops
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/crops/:id
// @desc    Get single crop
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const crop = await Crop.findOne({ 
      _id: req.params.id, 
      farmerId: req.user.id 
    }).populate('farmId', 'name location');

    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }

    res.json({
      success: true,
      data: crop
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/crops
// @desc    Create new crop
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const cropData = {
      ...req.body,
      farmerId: req.user.id
    };

    const crop = await Crop.create(cropData);
    
    res.status(201).json({
      success: true,
      data: crop
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/crops/:id
// @desc    Update crop
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    let crop = await Crop.findOne({ 
      _id: req.params.id, 
      farmerId: req.user.id 
    });

    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }

    crop = await Crop.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: crop
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/crops/:id
// @desc    Delete crop
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const crop = await Crop.findOne({ 
      _id: req.params.id, 
      farmerId: req.user.id 
    });

    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }

    await crop.remove();

    res.json({
      success: true,
      message: 'Crop deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/crops/farm/:farmId
// @desc    Get crops by farm
// @access  Private
router.get('/farm/:farmId', auth, async (req, res) => {
  try {
    const crops = await Crop.find({ 
      farmId: req.params.farmId, 
      farmerId: req.user.id 
    }).sort({ plantingDate: -1 });

    res.json({
      success: true,
      count: crops.length,
      data: crops
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/crops/health-status
// @desc    Get crops by health status
// @access  Private
router.get('/health-status/:status', auth, async (req, res) => {
  try {
    const crops = await Crop.find({
      farmerId: req.user.id,
      healthStatus: req.params.status
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: crops.length,
      data: crops
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/crops/stats
// @desc    Get crop statistics for logged in user
// @access  Private
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const stats = await Crop.aggregate([
      { $match: { farmerId: req.user.id } },
      {
        $group: {
          _id: null,
          totalCrops: { $sum: 1 },
          totalArea: { $sum: '$plantedArea' },
          totalExpectedYield: { $sum: '$expectedYield' },
          totalActualYield: { $sum: '$actualYield' },
          averageHealthStatus: { $avg: { $cond: [{ $eq: ['$healthStatus', 'excellent'] }, 5, { $cond: [{ $eq: ['$healthStatus', 'good'] }, 4, { $cond: [{ $eq: ['$healthStatus', 'fair'] }, 3, { $cond: [{ $eq: ['$healthStatus', 'poor'] }, 2, 1] }] }] }] } }
        }
      },
      {
        $project: {
          _id: 0,
          totalCrops: 1,
          totalArea: { $round: ['$totalArea', 2] },
          totalExpectedYield: { $round: ['$totalExpectedYield', 2] },
          totalActualYield: { $round: ['$totalActualYield', 2] },
          averageHealthStatus: { $round: ['$averageHealthStatus', 1] }
        }
      }
    ]);

    const cropByStatus = await Crop.aggregate([
      { $match: { farmerId: req.user.id } },
      {
        $group: {
          _id: '$healthStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || { totalCrops: 0, totalArea: 0, totalExpectedYield: 0, totalActualYield: 0, averageHealthStatus: 0 },
        byStatus: cropByStatus
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
