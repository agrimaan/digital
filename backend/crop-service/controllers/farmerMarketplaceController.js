const MarketplaceListing = require('../models/MarketplaceListing');
const Crop = require('../models/Crop');
const responseHandler = require('../utils/responseHandler');
const { validationResult } = require('express-validator');

// @desc    Create marketplace listing from crop
// @route   POST /api/farmer/marketplace/listings
// @access  Private (Farmer only)
exports.createListing = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseHandler.badRequest(res, 'Validation error', errors.array());
  }

  try {
    const {
      cropId,
      quantity,
      pricePerUnit,
      negotiable,
      minimumOrderQuantity,
      grade,
      isOrganic,
      certifications,
      description,
      images,
      visibility,
      expiresInDays
    } = req.body;

    // Fetch the crop
    console.log("cropId within createListing:",cropId);
    console.log("req.user.id within createListing:",req.user.id);
    const crop = await Crop.findOne({ _id: "cropId", farmerId: req.user.id });
    
    if (!crop) {
      return responseHandler.notFound(res, 'Crop not found or you do not have permission');
    }

    // Validate crop is ready for harvest
    if (!['maturity', 'harvested'].includes(crop.growthStage)) {
      return responseHandler.badRequest(
        res,
        `Crop must be in 'maturity' or 'harvested' stage. Current stage: ${crop.growthStage}`
      );
    }

    // Validate quantity
    if (crop.actualYield && quantity > crop.actualYield) {
      return responseHandler.badRequest(
        res,
        `Quantity cannot exceed actual yield (${crop.actualYield} ${crop.unit})`
      );
    }

    // Check if listing already exists for this crop
    const existingListing = await MarketplaceListing.findOne({
      crop: cropId,
      farmer: req.user.id,
      status: 'active'
    });

    if (existingListing) {
      return responseHandler.badRequest(
        res,
        'An active listing already exists for this crop. Please update or deactivate it first.'
      );
    }

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (expiresInDays || 30));

    // Create marketplace listing
    const listing = await MarketplaceListing.create({
      crop: cropId,
      farmer: req.user.id,
      cropName: crop.name,
      variety: crop.variety,
      scientificName: crop.scientificName,
      quantity: {
        available: quantity,
        unit: crop.unit,
        reserved: 0
      },
      pricing: {
        pricePerUnit: pricePerUnit,
        currency: 'INR',
        negotiable: negotiable || false,
        minimumOrderQuantity: minimumOrderQuantity || 1
      },
      harvestInfo: {
        expectedHarvestDate: crop.expectedHarvestDate,
        actualHarvestDate: crop.actualHarvestDate,
        harvestStatus: crop.growthStage === 'harvested' ? 'completed' : 'ready'
      },
      quality: {
        grade: grade || 'Standard',
        isOrganic: isOrganic || false,
        certifications: certifications || [],
        healthStatus: crop.healthStatus || 'good'
      },
      farmInfo: {
        fieldId: crop.fieldId,
        soilType: crop.soilType,
        irrigationMethod: crop.irrigationMethod
      },
      description: description || `Fresh ${crop.name} - ${crop.variety}`,
      images: images || [],
      status: 'active',
      visibility: visibility || 'public',
      expiresAt: expiresAt
    });

    // Update crop with marketplace listing reference
    crop.marketplaceListing = {
      productId: listing._id,
      listedDate: new Date(),
      quantity: quantity,
      pricePerUnit: pricePerUnit,
      status: 'active'
    };
    await crop.save();

    return responseHandler.success(
      res,
      201,
      listing,
      'Marketplace listing created successfully'
    );
  } catch (error) {
    console.error('Error creating marketplace listing:', error);
    return responseHandler.error(res, 500, 'Error creating marketplace listing', error);
  }
};

// @desc    Get farmer's marketplace listings
// @route   GET /api/farmer/marketplace/listings
// @access  Private (Farmer only)
exports.getMyListings = async (req, res) => {
  try {
    const { status, sortBy, sortOrder } = req.query;

    const filter = { farmer: req.user.id };
    
    if (status) {
      filter.status = status;
    }

    let query = MarketplaceListing.find(filter).populate('crop', 'name variety growthStage');

    // Sorting
    const sort = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1; // Default: newest first
    }
    query = query.sort(sort);

    const listings = await query;

    return responseHandler.success(
      res,
      200,
      {
        count: listings.length,
        listings: listings
      },
      'Listings retrieved successfully'
    );
  } catch (error) {
    console.error('Error retrieving listings:', error);
    return responseHandler.error(res, 500, 'Error retrieving listings', error);
  }
};

// @desc    Get single listing details
// @route   GET /api/farmer/marketplace/listings/:id
// @access  Private (Farmer only)
exports.getMyListing = async (req, res) => {
  try {
    const listing = await MarketplaceListing.findOne({
      _id: req.params.id,
      farmer: req.user.id
    }).populate('crop', 'name variety growthStage actualYield');

    if (!listing) {
      return responseHandler.notFound(res, 'Listing not found');
    }

    return responseHandler.success(res, 200, listing, 'Listing retrieved successfully');
  } catch (error) {
    console.error('Error retrieving listing:', error);
    return responseHandler.error(res, 500, 'Error retrieving listing', error);
  }
};

// @desc    Update marketplace listing
// @route   PUT /api/farmer/marketplace/listings/:id
// @access  Private (Farmer only)
exports.updateListing = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseHandler.badRequest(res, 'Validation error', errors.array());
  }

  try {
    const listing = await MarketplaceListing.findOne({
      _id: req.params.id,
      farmer: req.user.id
    });

    if (!listing) {
      return responseHandler.notFound(res, 'Listing not found');
    }

    // Fields that can be updated
    const allowedUpdates = [
      'quantity.available',
      'pricing.pricePerUnit',
      'pricing.negotiable',
      'pricing.minimumOrderQuantity',
      'quality.grade',
      'quality.isOrganic',
      'quality.certifications',
      'description',
      'images',
      'visibility',
      'status'
    ];

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        if (key.includes('.')) {
          const [parent, child] = key.split('.');
          listing[parent][child] = req.body[key];
        } else {
          listing[key] = req.body[key];
        }
      }
    });

    await listing.save();

    return responseHandler.success(res, 200, listing, 'Listing updated successfully');
  } catch (error) {
    console.error('Error updating listing:', error);
    return responseHandler.error(res, 500, 'Error updating listing', error);
  }
};

// @desc    Deactivate marketplace listing
// @route   DELETE /api/farmer/marketplace/listings/:id
// @access  Private (Farmer only)
exports.deactivateListing = async (req, res) => {
  try {
    const listing = await MarketplaceListing.findOne({
      _id: req.params.id,
      farmer: req.user.id
    });

    if (!listing) {
      return responseHandler.notFound(res, 'Listing not found');
    }

    listing.status = 'inactive';
    await listing.save();

    // Update crop marketplace listing status
    const crop = await Crop.findById(listing.crop);
    if (crop && crop.marketplaceListing) {
      crop.marketplaceListing.status = 'unlisted';
      crop.marketplaceListing.unlistedDate = new Date();
      await crop.save();
    }

    return responseHandler.success(res, 200, listing, 'Listing deactivated successfully');
  } catch (error) {
    console.error('Error deactivating listing:', error);
    return responseHandler.error(res, 500, 'Error deactivating listing', error);
  }
};

// @desc    Reactivate marketplace listing
// @route   POST /api/farmer/marketplace/listings/:id/reactivate
// @access  Private (Farmer only)
exports.reactivateListing = async (req, res) => {
  try {
    const listing = await MarketplaceListing.findOne({
      _id: req.params.id,
      farmer: req.user.id
    });

    if (!listing) {
      return responseHandler.notFound(res, 'Listing not found');
    }

    if (listing.status === 'sold_out') {
      return responseHandler.badRequest(res, 'Cannot reactivate sold out listing');
    }

    if (listing.isExpired()) {
      return responseHandler.badRequest(res, 'Cannot reactivate expired listing. Please create a new one.');
    }

    listing.status = 'active';
    await listing.save();

    // Update crop marketplace listing status
    const crop = await Crop.findById(listing.crop);
    if (crop && crop.marketplaceListing) {
      crop.marketplaceListing.status = 'active';
      await crop.save();
    }

    return responseHandler.success(res, 200, listing, 'Listing reactivated successfully');
  } catch (error) {
    console.error('Error reactivating listing:', error);
    return responseHandler.error(res, 500, 'Error reactivating listing', error);
  }
};

// @desc    Get crops ready for marketplace listing
// @route   GET /api/farmer/marketplace/ready-crops
// @access  Private (Farmer only)
exports.getReadyCrops = async (req, res) => {
  try {
    // Find crops that are ready for harvest and not already listed
    console.log("req.user.id within getReadyCrops:",req.user.id);
   
    const crops = await Crop.find({
      farmerId: req.user.id,
      growthStage: { $in: ['maturity', 'harvested'] },
      isActive: true,
      $or: [
        { 'marketplaceListing.status': { $ne: 'active' } },
        { marketplaceListing: { $exists: false } }
      ]
    }).select('name variety growthStage expectedHarvestDate actualHarvestDate actualYield unit');
    console.log("crops within getReadyCrops:",crops);


    return responseHandler.success(
      res,
      200,
      {
        count: crops.length,
        crops: crops
      },
      'Ready crops retrieved successfully'
    );
  } catch (error) {
    console.error('Error retrieving ready crops:', error);
    return responseHandler.error(res, 500, 'Error retrieving ready crops', error);
  }
};

// @desc    Get listing statistics
// @route   GET /api/farmer/marketplace/statistics
// @access  Private (Farmer only)
exports.getStatistics = async (req, res) => {
  try {
    const listings = await MarketplaceListing.find({ farmer: req.user.id });

    const stats = {
      total: listings.length,
      active: listings.filter(l => l.status === 'active').length,
      inactive: listings.filter(l => l.status === 'inactive').length,
      soldOut: listings.filter(l => l.status === 'sold_out').length,
      expired: listings.filter(l => l.status === 'expired').length,
      totalViews: listings.reduce((sum, l) => sum + l.statistics.views, 0),
      totalInquiries: listings.reduce((sum, l) => sum + l.statistics.inquiries, 0),
      totalOrders: listings.reduce((sum, l) => sum + l.statistics.orders, 0),
      totalValue: listings
        .filter(l => l.status === 'active')
        .reduce((sum, l) => sum + (l.quantity.available * l.pricing.pricePerUnit), 0)
    };

    return responseHandler.success(res, 200, stats, 'Statistics retrieved successfully');
  } catch (error) {
    console.error('Error retrieving statistics:', error);
    return responseHandler.error(res, 500, 'Error retrieving statistics', error);
  }
};

module.exports = exports;