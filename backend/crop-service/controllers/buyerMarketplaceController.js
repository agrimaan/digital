const MarketplaceListing = require('../models/MarketplaceListing');
const responseHandler = require('../utils/responseHandler');

// @desc    Get all active marketplace listings
// @route   GET /api/buyer/marketplace/listings
// @access  Public
exports.getAllListings = async (req, res) => {
  try {
    const {
      search,
      cropName,
      isOrganic,
      grade,
      minPrice,
      maxPrice,
      minQuantity,
      harvestStatus,
      sortBy,
      sortOrder,
      page,
      limit
    } = req.query;

    // Build filter
    const filter = {
      status: 'active',
      expiresAt: { $gt: new Date() }
    };

    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    // Crop name filter
    if (cropName) {
      filter.cropName = new RegExp(cropName, 'i');
    }

    // Organic filter
    if (isOrganic !== undefined) {
      filter['quality.isOrganic'] = isOrganic === 'true';
    }

    // Grade filter
    if (grade) {
      filter['quality.grade'] = grade;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter['pricing.pricePerUnit'] = {};
      if (minPrice) filter['pricing.pricePerUnit'].$gte = parseFloat(minPrice);
      if (maxPrice) filter['pricing.pricePerUnit'].$lte = parseFloat(maxPrice);
    }

    // Minimum quantity filter
    if (minQuantity) {
      filter['quantity.available'] = { $gte: parseFloat(minQuantity) };
    }

    // Harvest status filter
    if (harvestStatus) {
      filter['harvestInfo.harvestStatus'] = harvestStatus;
    }

    // Pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sort = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1; // Default: newest first
    }

    // Execute query
    const listings = await MarketplaceListing.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .select('-farmer'); // Don't expose farmer ID to buyers

    const total = await MarketplaceListing.countDocuments(filter);

    return responseHandler.success(
      res,
      200,
      {
        listings: listings,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: total,
          pages: Math.ceil(total / limitNum)
        }
      },
      'Listings retrieved successfully'
    );
  } catch (error) {
    console.error('Error retrieving listings:', error);
    return responseHandler.error(res, 500, 'Error retrieving listings', error);
  }
};

// @desc    Get single listing details
// @route   GET /api/buyer/marketplace/listings/:id
// @access  Public
exports.getListing = async (req, res) => {
  try {
    const listing = await MarketplaceListing.findOne({
      _id: req.params.id,
      status: 'active',
      expiresAt: { $gt: new Date() }
    }).select('-farmer');

    if (!listing) {
      return responseHandler.notFound(res, 'Listing not found or no longer available');
    }

    // Increment view count
    await listing.incrementViews();

    return responseHandler.success(res, 200, listing, 'Listing retrieved successfully');
  } catch (error) {
    console.error('Error retrieving listing:', error);
    return responseHandler.error(res, 500, 'Error retrieving listing', error);
  }
};

// @desc    Search listings by location
// @route   GET /api/buyer/marketplace/listings/nearby
// @access  Public
exports.getNearbyListings = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance } = req.query;

    if (!longitude || !latitude) {
      return responseHandler.badRequest(res, 'Longitude and latitude are required');
    }

    const distance = parseInt(maxDistance) || 50000; // Default 50km

    const listings = await MarketplaceListing.findNearby(
      parseFloat(longitude),
      parseFloat(latitude),
      distance
    ).select('-farmer');

    return responseHandler.success(
      res,
      200,
      {
        count: listings.length,
        listings: listings
      },
      'Nearby listings retrieved successfully'
    );
  } catch (error) {
    console.error('Error retrieving nearby listings:', error);
    return responseHandler.error(res, 500, 'Error retrieving nearby listings', error);
  }
};

// @desc    Get listings by crop name
// @route   GET /api/buyer/marketplace/listings/crop/:cropName
// @access  Public
exports.getListingsByCrop = async (req, res) => {
  try {
    const { cropName } = req.params;
    const { sortBy, sortOrder } = req.query;

    const filter = {
      status: 'active',
      expiresAt: { $gt: new Date() },
      cropName: new RegExp(cropName, 'i')
    };

    const sort = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort['pricing.pricePerUnit'] = 1; // Default: lowest price first
    }

    const listings = await MarketplaceListing.find(filter)
      .sort(sort)
      .select('-farmer');

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

// @desc    Get organic listings
// @route   GET /api/buyer/marketplace/listings/organic
// @access  Public
exports.getOrganicListings = async (req, res) => {
  try {
    const { sortBy, sortOrder } = req.query;

    const filter = {
      status: 'active',
      expiresAt: { $gt: new Date() },
      'quality.isOrganic': true
    };

    const sort = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1;
    }

    const listings = await MarketplaceListing.find(filter)
      .sort(sort)
      .select('-farmer');

    return responseHandler.success(
      res,
      200,
      {
        count: listings.length,
        listings: listings
      },
      'Organic listings retrieved successfully'
    );
  } catch (error) {
    console.error('Error retrieving organic listings:', error);
    return responseHandler.error(res, 500, 'Error retrieving organic listings', error);
  }
};

// @desc    Get available crop varieties
// @route   GET /api/buyer/marketplace/varieties
// @access  Public
exports.getAvailableVarieties = async (req, res) => {
  try {
    const varieties = await MarketplaceListing.distinct('variety', {
      status: 'active',
      expiresAt: { $gt: new Date() }
    });

    return responseHandler.success(
      res,
      200,
      {
        count: varieties.length,
        varieties: varieties.filter(v => v) // Remove null/undefined
      },
      'Varieties retrieved successfully'
    );
  } catch (error) {
    console.error('Error retrieving varieties:', error);
    return responseHandler.error(res, 500, 'Error retrieving varieties', error);
  }
};

// @desc    Get available crop names
// @route   GET /api/buyer/marketplace/crops
// @access  Public
exports.getAvailableCrops = async (req, res) => {
  try {
    const crops = await MarketplaceListing.aggregate([
      {
        $match: {
          status: 'active',
          expiresAt: { $gt: new Date() }
        }
      },
      {
        $group: {
          _id: '$cropName',
          count: { $sum: 1 },
          avgPrice: { $avg: '$pricing.pricePerUnit' },
          totalQuantity: { $sum: '$quantity.available' }
        }
      },
      {
        $project: {
          _id: 0,
          cropName: '$_id',
          listingsCount: '$count',
          averagePrice: { $round: ['$avgPrice', 2] },
          totalAvailable: '$totalQuantity'
        }
      },
      {
        $sort: { listingsCount: -1 }
      }
    ]);

    return responseHandler.success(
      res,
      200,
      {
        count: crops.length,
        crops: crops
      },
      'Available crops retrieved successfully'
    );
  } catch (error) {
    console.error('Error retrieving available crops:', error);
    return responseHandler.error(res, 500, 'Error retrieving available crops', error);
  }
};

// @desc    Get marketplace statistics
// @route   GET /api/buyer/marketplace/statistics
// @access  Public
exports.getMarketplaceStatistics = async (req, res) => {
  try {
    const activeListings = await MarketplaceListing.find({
      status: 'active',
      expiresAt: { $gt: new Date() }
    });

    const stats = {
      totalListings: activeListings.length,
      totalCrops: await MarketplaceListing.distinct('cropName', {
        status: 'active',
        expiresAt: { $gt: new Date() }
      }).then(crops => crops.length),
      organicListings: activeListings.filter(l => l.quality.isOrganic).length,
      totalQuantityAvailable: activeListings.reduce((sum, l) => sum + l.quantity.available, 0),
      averagePrice: activeListings.length > 0
        ? activeListings.reduce((sum, l) => sum + l.pricing.pricePerUnit, 0) / activeListings.length
        : 0,
      priceRange: {
        min: activeListings.length > 0
          ? Math.min(...activeListings.map(l => l.pricing.pricePerUnit))
          : 0,
        max: activeListings.length > 0
          ? Math.max(...activeListings.map(l => l.pricing.pricePerUnit))
          : 0
      }
    };

    return responseHandler.success(res, 200, stats, 'Statistics retrieved successfully');
  } catch (error) {
    console.error('Error retrieving statistics:', error);
    return responseHandler.error(res, 500, 'Error retrieving statistics', error);
  }
};

// @desc    Record inquiry for a listing
// @route   POST /api/buyer/marketplace/listings/:id/inquiry
// @access  Private (Buyer only)
exports.recordInquiry = async (req, res) => {
  try {
    const listing = await MarketplaceListing.findOne({
      _id: req.params.id,
      status: 'active',
      expiresAt: { $gt: new Date() }
    });

    if (!listing) {
      return responseHandler.notFound(res, 'Listing not found or no longer available');
    }

    await listing.incrementInquiries();

    return responseHandler.success(res, 200, {}, 'Inquiry recorded successfully');
  } catch (error) {
    console.error('Error recording inquiry:', error);
    return responseHandler.error(res, 500, 'Error recording inquiry', error);
  }
};

// @desc    Get featured listings (high quality, good ratings)
// @route   GET /api/buyer/marketplace/featured
// @access  Public
exports.getFeaturedListings = async (req, res) => {
  try {
    const listings = await MarketplaceListing.find({
      status: 'active',
      expiresAt: { $gt: new Date() },
      $or: [
        { 'quality.grade': 'Premium' },
        { 'quality.grade': 'A' },
        { 'quality.isOrganic': true }
      ]
    })
      .sort({ 'statistics.views': -1, createdAt: -1 })
      .limit(10)
      .select('-farmer');

    return responseHandler.success(
      res,
      200,
      {
        count: listings.length,
        listings: listings
      },
      'Featured listings retrieved successfully'
    );
  } catch (error) {
    console.error('Error retrieving featured listings:', error);
    return responseHandler.error(res, 500, 'Error retrieving featured listings', error);
  }
};

module.exports = exports;