const asyncHandler = require('express-async-handler');
const Resource = require('../models/Resource');
const Booking = require('../models/Booking');
const axios = require('axios');

// Helper function to get user info from user service
const getUserInfo = async (userId, token) => {
  try {
    const response = await axios.get(
      `${process.env.USER_SERVICE_URL}/api/users/${userId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data.data?.user || response.data.user || response.data;
  } catch (error) {
    console.error('Error fetching user info:', error.message);
    return null;
  }
};

// @desc    Get all resources
// @route   GET /api/resources
// @access  Public
exports.getAllResources = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // Build query
  const query = { isActive: true };
  
  if (req.query.type) query.type = req.query.type;
  if (req.query.status) query.status = req.query.status;
  if (req.query.location) query.location = new RegExp(req.query.location, 'i');
  if (req.query.owner) query.owner = req.query.owner;
  if (req.query.search) {
    query.$or = [
      { name: new RegExp(req.query.search, 'i') },
      { description: new RegExp(req.query.search, 'i') },
      { category: new RegExp(req.query.search, 'i') }
    ];
  }

  // Price range filter
  if (req.query.minPrice || req.query.maxPrice) {
    query['pricing.hourlyRate'] = {};
    if (req.query.minPrice) query['pricing.hourlyRate'].$gte = parseFloat(req.query.minPrice);
    if (req.query.maxPrice) query['pricing.hourlyRate'].$lte = parseFloat(req.query.maxPrice);
  }

  // Rating filter
  if (req.query.minRating) {
    query['ratings.average'] = { $gte: parseFloat(req.query.minRating) };
  }

  const total = await Resource.countDocuments(query);
  const resources = await Resource.find(query)
    .populate('name type')
    //.populate('ownerEmail')
    .sort(req.query.sort || '-createdAt')
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    success: true,
    count: resources.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    data: { resources }
  });
});

// @desc    Get resource by ID
// @route   GET /api/resources/:id
// @access  Public
exports.getResourceById = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id)
    .populate('owner', 'name email phone')
    .populate('reviews.user', 'name');

  if (!resource) {
    return res.status(404).json({
      success: false,
      message: 'Resource not found'
    });
  }

  // Increment view count
  resource.metadata.views += 1;
  await resource.save();

  res.status(200).json({
    success: true,
    data: { resource }
  });
});

// @desc    Create new resource
// @route   POST /api/resources
// @access  Private
exports.createResource = asyncHandler(async (req, res) => {
  // Add owner from authenticated user
  req.body.owner = req.user.id;
  req.body.ownerName = req.user.name;
  req.body.ownerEmail = req.user.email;

  const resource = await Resource.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Resource created successfully',
    data: { resource }
  });
});

// @desc    Update resource
// @route   PUT /api/resources/:id
// @access  Private
exports.updateResource = asyncHandler(async (req, res) => {
  let resource = await Resource.findById(req.params.id);

  if (!resource) {
    return res.status(404).json({
      success: false,
      message: 'Resource not found'
    });
  }

  // Check ownership
  if (resource.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this resource'
    });
  }

  resource = await Resource.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Resource updated successfully',
    data: { resource }
  });
});

// @desc    Delete resource
// @route   DELETE /api/resources/:id
// @access  Private
exports.deleteResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);

  if (!resource) {
    return res.status(404).json({
      success: false,
      message: 'Resource not found'
    });
  }

  // Check ownership
  if (resource.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this resource'
    });
  }

  // Soft delete
  resource.isActive = false;
  await resource.save();

  res.status(200).json({
    success: true,
    message: 'Resource deleted successfully'
  });
});

// @desc    Get resources by owner
// @route   GET /api/resources/owner/:ownerId
// @access  Public
exports.getResourcesByOwner = asyncHandler(async (req, res) => {
  const resources = await Resource.find({
    owner: req.params.ownerId,
    isActive: true
  }).sort('-createdAt');

  res.status(200).json({
    success: true,
    count: resources.length,
    data: { resources }
  });
});

// @desc    Get available resources
// @route   GET /api/resources/available
// @access  Public
exports.getAvailableResources = asyncHandler(async (req, res) => {
  const filters = {
    type: req.query.type,
    location: req.query.location,
    minRating: req.query.minRating
  };

  const resources = await Resource.getAvailableResources(filters);

  res.status(200).json({
    success: true,
    count: resources.length,
    data: { resources }
  });
});

// @desc    Add review to resource
// @route   POST /api/resources/:id/reviews
// @access  Private
exports.addReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  const resource = await Resource.findById(req.params.id);

  if (!resource) {
    return res.status(404).json({
      success: false,
      message: 'Resource not found'
    });
  }

  // Check if user already reviewed
  const alreadyReviewed = resource.reviews.find(
    review => review.user.toString() === req.user.id
  );

  if (alreadyReviewed) {
    return res.status(400).json({
      success: false,
      message: 'Resource already reviewed'
    });
  }

  const review = {
    user: req.user.id,
    rating: Number(rating),
    comment
  };

  resource.reviews.push(review);
  await resource.save();

  res.status(201).json({
    success: true,
    message: 'Review added successfully',
    data: { resource }
  });
});

// @desc    Get resource analytics
// @route   GET /api/resources/:id/analytics
// @access  Private
exports.getResourceAnalytics = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);

  if (!resource) {
    return res.status(404).json({
      success: false,
      message: 'Resource not found'
    });
  }

  // Get bookings for this resource
  const bookings = await Booking.find({ resource: req.params.id });

  const analytics = {
    views: resource.metadata.views,
    bookingsCount: resource.metadata.bookingsCount,
    totalRevenue: resource.metadata.totalRevenue,
    averageRating: resource.ratings.average,
    reviewsCount: resource.ratings.count,
    bookingsByStatus: {
      pending: bookings.filter(b => b.status === 'Pending').length,
      confirmed: bookings.filter(b => b.status === 'Confirmed').length,
      completed: bookings.filter(b => b.status === 'Completed').length,
      cancelled: bookings.filter(b => b.status === 'Cancelled').length
    },
    revenueByMonth: calculateMonthlyRevenue(bookings)
  };

  res.status(200).json({
    success: true,
    data: { analytics }
  });
});

// Helper function to calculate monthly revenue
function calculateMonthlyRevenue(bookings) {
  const monthlyRevenue = {};
  
  bookings.forEach(booking => {
    if (booking.status === 'Completed' && booking.paymentStatus === 'Paid') {
      const month = new Date(booking.createdAt).toISOString().slice(0, 7); // YYYY-MM
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (booking.pricing.total || 0);
    }
  });

  return monthlyRevenue;
}

// @desc    Register resource on blockchain
// @route   POST /api/resources/:id/blockchain
// @access  Private
exports.registerOnBlockchain = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);

  if (!resource) {
    return res.status(404).json({
      success: false,
      message: 'Resource not found'
    });
  }

  // Check ownership
  if (resource.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to register this resource on blockchain'
    });
  }

  if (resource.blockchain.registered) {
    return res.status(400).json({
      success: false,
      message: 'Resource already registered on blockchain'
    });
  }

  try {
    // Call blockchain service to register resource
    const blockchainResponse = await axios.post(
      `${process.env.BLOCKCHAIN_SERVICE_URL}/api/blockchain/register-resource`,
      {
        resourceId: resource._id,
        name: resource.name,
        type: resource.type,
        owner: resource.owner,
        metadata: {
          pricing: resource.pricing,
          specifications: resource.specifications
        }
      },
      {
        headers: { Authorization: req.headers.authorization }
      }
    );

    // Update resource with blockchain info
    resource.blockchain = {
      registered: true,
      transactionHash: blockchainResponse.data.transactionHash,
      blockNumber: blockchainResponse.data.blockNumber,
      registeredAt: new Date()
    };

    await resource.save();

    res.status(200).json({
      success: true,
      message: 'Resource registered on blockchain successfully',
      data: {
        resource,
        blockchain: blockchainResponse.data
      }
    });
  } catch (error) {
    console.error('Blockchain registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register resource on blockchain',
      error: error.message
    });
  }
});
