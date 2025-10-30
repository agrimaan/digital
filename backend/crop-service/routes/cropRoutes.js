const express = require('express');
const mongoose = require('mongoose');
const Crop = require('../models/Crop');
const { protect } = require('@agrimaan/shared').middleware;
const cropController = require('../controllers/cropController');


const router = express.Router();

const isAdmin = (req) =>
  req.user?.role === 'admin' || (Array.isArray(req.user?.roles) && req.user.roles.includes('admin'));

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const { check } = require('express-validator');

const cropValidation = [
  check('name', 'Crop Name is required').not().isEmpty(),
  check('scientificName', 'Scientific Name is required').optional(),
  check('variety', 'Variety is required').not().isEmpty(),
  check('fieldId', 'Field is required').not().isEmpty(),
  check('plantedArea', 'Planted Area must be a positive number')
    .not()
    .isEmpty()
    .isFloat({ min: 0 }),
  check('plantingDate', 'Planted Date is required and must be a valid date')
    .not()
    .isEmpty()
    .isISO8601(),
  check('expectedHarvestDate', 'Expected Harvest Date is required and must be a valid date')
    .not()
    .isEmpty()
    .isISO8601(),
  check('expectedYield', 'Expected Yield must be a positive number')
    .not()
    .isEmpty()
    .isFloat({ min: 0 }),
  check('soilType', 'Invalid soil type')
    .not()
    .isEmpty()
    .isIn(['loam', 'clay', 'sandy', 'silty', 'peaty', 'chalky', 'alluvial']),
  check('irrigationMethod', 'Invalid irrigation method')
    .not()
    .isEmpty()
    .isIn(['drip', 'sprinkler', 'flood', 'rainfed', 'center-pivot']),
  check('seedSource', 'Invalid seed source')
    .not()
    .isEmpty()
    .isIn(['own', 'market', 'government', 'supplier']),
  check('growthStage', 'Invalid growth stage')
    .optional()
    .isIn([
      'seedling',
      'vegetative',
      'flowering',
      'fruiting',
      'maturity',
      'harvested',
      'failed',
    ]),
  check('healthStatus', 'Invalid health status')
    .isIn(['excellent', 'good', 'fair', 'poor', 'diseased']),
];

const basePopulate = [
  { path: 'fieldId', select: 'name location' },
  { path: 'farmerId', select: 'name email' }, // assumes Crop schema has a ref to User
];

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

router
  .route('/')
  .get(protect, cropController.getCrops)
  .post(protect, cropValidation, cropController.createCrop);

router
  .route('/:id')
  .get(protect, cropController.getCrop)
  .put(protect, cropValidation, cropController.updateCrop)
  .delete(protect, cropController.deleteCrop);

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
