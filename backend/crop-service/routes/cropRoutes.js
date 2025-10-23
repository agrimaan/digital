const express = require('express');
const mongoose = require('mongoose');
const Crop = require('../models/Crop');
const { protect, logAction } = require('@agrimaan/shared').middleware;
// If your authorize('admin') exists and you want admin-only routes, you can still import it.
// const { authorize } = require('@agrimaan/shared').middleware;

const router = express.Router();

const isAdmin = (req) =>
  req.user?.role === 'admin' || (Array.isArray(req.user?.roles) && req.user.roles.includes('admin'));

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const basePopulate = [
  { path: 'fieldId', select: 'name location' },
  { path: 'farmerId', select: 'name email' }, // assumes Crop schema has a ref to User
];

/**
 * Compute a Mongo filter for the current request:
 * - Farmers are always scoped to their own farmerId
 * - Admins:
 *    - if ?farmerId is provided and valid -> filter by that farmer
 *    - otherwise -> no farmer filter (see everything)
 */
const scopeFilter = (req) => {
  if (isAdmin(req)) {
    const { farmerId } = req.query || {};
    if (farmerId && isValidObjectId(farmerId)) {
      return { farmerId };
    }
    // no farmer filter => admin sees all
    return {};
  }
  return { farmerId: req.user.id };
};

// @route   GET /api/crops
// @desc    List crops (admin: all or by ?farmerId; farmer: own)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const filter = scopeFilter(req);

    const crops = await Crop.find(filter)
      .populate(basePopulate)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: crops.length,
      data: crops,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   GET /api/crops/:id
// @desc    Get single crop (admin: any; farmer: must own)
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid crop id' });
    }

    // Admin can access any crop; farmer must own it
    const finder = isAdmin(req) ? { _id: id } : { _id: id, farmerId: req.user.id };

    const crop = await Crop.findOne(finder).populate(basePopulate);
    if (!crop) {
      return res.status(404).json({ success: false, message: 'Crop not found' });
    }

    res.json({ success: true, data: crop });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   POST /api/crops
// @desc    Create new crop (admin: can set body.farmerId; farmer: forced to self)
// @access  Private
router.post('/', protect, logAction('crop:create'), async (req, res) => {
  try {
    const body = { ...req.body };

    if (isAdmin(req)) {
      // Admin can create for any farmer; if not provided, default to self
      if (body.farmerId && !isValidObjectId(body.farmerId)) {
        return res.status(400).json({ success: false, message: 'Invalid farmerId' });
      }
      body.farmerId = body.farmerId || req.user.id;
    } else {
      // Farmers can only create for themselves
      body.farmerId = req.user.id;
    }

    const crop = await Crop.create(body);

    const populated = await Crop.findById(crop._id).populate(basePopulate);

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages,
      });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/crops/:id
// @desc    Update crop (admin: any; farmer: must own)
// @access  Private
router.put('/:id', protect, logAction('crop:update'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid crop id' });
    }

    // Farmers must only update their own records
    const finder = isAdmin(req) ? { _id: id } : { _id: id, farmerId: req.user.id };

    const exists = await Crop.findOne(finder);
    if (!exists) {
      return res.status(404).json({ success: false, message: 'Crop not found' });
    }

    // Prevent non-admins from reassigning farmerId
    const update = { ...req.body };
    if (!isAdmin(req)) {
      delete update.farmerId;
    } else if (update.farmerId && !isValidObjectId(update.farmerId)) {
      return res.status(400).json({ success: false, message: 'Invalid farmerId' });
    }

    const updated = await Crop.findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .populate(basePopulate);

    res.json({ success: true, data: updated });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages,
      });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/crops/:id
// @desc    Delete crop (admin: any; farmer: must own)
// @access  Private
router.delete('/:id', protect, logAction('crop:delete'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid crop id' });
    }

    const finder = isAdmin(req) ? { _id: id } : { _id: id, farmerId: req.user.id };
    const crop = await Crop.findOne(finder);

    if (!crop) {
      return res.status(404).json({ success: false, message: 'Crop not found' });
    }

    await crop.deleteOne();
    res.json({ success: true, message: 'Crop deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/crops/field/:fieldId
// @desc    Get crops by field (admin: all/filtered; farmer: own only)
// @access  Private
router.get('/field/:fieldId', protect, async (req, res) => {
  try {
    const { fieldId } = req.params;
    if (!isValidObjectId(fieldId)) {
      return res.status(400).json({ success: false, message: 'Invalid field id' });
    }

    const farmerScope = scopeFilter(req); // {} for admin (or {farmerId}) / {farmerId: self} for farmer
    const crops = await Crop.find({ ...farmerScope, fieldId })
      .populate(basePopulate)
      .sort({ plantingDate: -1 });

    res.json({ success: true, count: crops.length, data: crops });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/crops/health-status/:status
// @desc    Get crops by health status (admin: all/filtered; farmer: own)
// @access  Private
router.get('/health-status/:status', protect, async (req, res) => {
  try {
    const farmerScope = scopeFilter(req);
    const crops = await Crop.find({
      ...farmerScope,
      healthStatus: req.params.status,
    })
      .populate(basePopulate)
      .sort({ createdAt: -1 });

    res.json({ success: true, count: crops.length, data: crops });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/crops/stats/overview
// @desc    Stats (admin: all/filtered; farmer: own)
// @access  Private
router.get('/stats/overview', protect, async (req, res) => {
  try {
    const farmerScope = scopeFilter(req);
    const matchStage = Object.keys(farmerScope).length ? { $match: farmerScope } : { $match: {} };

    const stats = await Crop.aggregate([
      matchStage,
      {
        $group: {
          _id: null,
          totalCrops: { $sum: 1 },
          totalArea: { $sum: '$plantedArea' },
          totalExpectedYield: { $sum: '$expectedYield' },
          totalActualYield: { $sum: '$actualYield' },
          averageHealthStatus: {
            $avg: {
              $cond: [
                { $eq: ['$healthStatus', 'excellent'] }, 5,
                {
                  $cond: [
                    { $eq: ['$healthStatus', 'good'] }, 4,
                    {
                      $cond: [
                        { $eq: ['$healthStatus', 'fair'] }, 3,
                        { $cond: [{ $eq: ['$healthStatus', 'poor'] }, 2, 1] }
                      ]
                    }
                  ]
                }
              ]
            }
          }
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
      matchStage,
      { $group: { _id: '$healthStatus', count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalCrops: 0,
          totalArea: 0,
          totalExpectedYield: 0,
          totalActualYield: 0,
          averageHealthStatus: 0
        },
        byStatus: cropByStatus
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
