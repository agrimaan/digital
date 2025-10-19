const asyncHandler = require('express-async-handler');
const Booking = require('../models/Booking');
const Resource = require('../models/Resource');
const axios = require('axios');

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
exports.createBooking = asyncHandler(async (req, res) => {
  const { resource, startDate, endDate, notes } = req.body;

  // Check if resource exists and is available
  const resourceDoc = await Resource.findById(resource);

  if (!resourceDoc) {
    return res.status(404).json({
      success: false,
      message: 'Resource not found'
    });
  }

  if (resourceDoc.status !== 'Available') {
    return res.status(400).json({
      success: false,
      message: 'Resource is not available for booking'
    });
  }

  // Check for conflicting bookings
  const conflictingBooking = await Booking.findOne({
    resource,
    status: { $in: ['Confirmed', 'In Progress'] },
    $or: [
      { startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(startDate) } }
    ]
  });

  if (conflictingBooking) {
    return res.status(400).json({
      success: false,
      message: 'Resource is already booked for the selected dates'
    });
  }

  // Calculate pricing
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffHours = (end - start) / (1000 * 60 * 60);
  
  let rate, total;
  if (diffHours < 24) {
    rate = resourceDoc.pricing.hourlyRate;
    total = rate * diffHours;
  } else if (diffHours < 168) {
    rate = resourceDoc.pricing.dailyRate || resourceDoc.pricing.hourlyRate * 24;
    total = rate * (diffHours / 24);
  } else {
    rate = resourceDoc.pricing.weeklyRate || resourceDoc.pricing.hourlyRate * 168;
    total = rate * (diffHours / 168);
  }

  // Create booking
  const booking = await Booking.create({
    resource,
    user: req.user.id,
    userName: req.user.name,
    userEmail: req.user.email,
    startDate,
    endDate,
    pricing: {
      rate,
      total,
      currency: resourceDoc.pricing.currency
    },
    notes
  });

  // Update resource status
  resourceDoc.status = 'Reserved';
  resourceDoc.metadata.bookingsCount += 1;
  await resourceDoc.save();

  res.status(201).json({
    success: true,
    message: 'Booking created successfully',
    data: { booking }
  });
});

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private
exports.getAllBookings = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // Build query
  const query = {};
  
  if (req.query.status) query.status = req.query.status;
  if (req.query.resource) query.resource = req.query.resource;
  if (req.query.user) query.user = req.query.user;
  
  // If not admin, only show user's own bookings
  if (req.user.role !== 'admin') {
    query.user = req.user.id;
  }

  const total = await Booking.countDocuments(query);
  const bookings = await Booking.find(query)
    .populate('resource', 'name type pricing images')
    .populate('user', 'name email')
    .sort('-createdAt')
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    success: true,
    count: bookings.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    data: { bookings }
  });
});

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
exports.getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('resource')
    .populate('user', 'name email phone');

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  // Check authorization
  if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this booking'
    });
  }

  res.status(200).json({
    success: true,
    data: { booking }
  });
});

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private
exports.updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const booking = await Booking.findById(req.params.id).populate('resource');

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  // Check authorization (resource owner or admin can update)
  const resource = await Resource.findById(booking.resource._id);
  if (resource.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this booking'
    });
  }

  booking.status = status;

  // Update resource status based on booking status
  if (status === 'Confirmed') {
    resource.status = 'Reserved';
  } else if (status === 'In Progress') {
    resource.status = 'In Use';
  } else if (status === 'Completed') {
    resource.status = 'Available';
    resource.metadata.totalRevenue += booking.pricing.total;
  } else if (status === 'Cancelled' || status === 'Rejected') {
    resource.status = 'Available';
    booking.cancelledAt = new Date();
    booking.cancelledBy = req.user.id;
  }

  await booking.save();
  await resource.save();

  res.status(200).json({
    success: true,
    message: 'Booking status updated successfully',
    data: { booking }
  });
});

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
exports.cancelBooking = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  // Check authorization
  if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to cancel this booking'
    });
  }

  if (booking.status === 'Completed' || booking.status === 'Cancelled') {
    return res.status(400).json({
      success: false,
      message: 'Cannot cancel this booking'
    });
  }

  booking.status = 'Cancelled';
  booking.cancellationReason = reason;
  booking.cancelledAt = new Date();
  booking.cancelledBy = req.user.id;

  await booking.save();

  // Update resource status
  const resource = await Resource.findById(booking.resource);
  resource.status = 'Available';
  await resource.save();

  res.status(200).json({
    success: true,
    message: 'Booking cancelled successfully',
    data: { booking }
  });
});

// @desc    Get user's bookings
// @route   GET /api/bookings/user/:userId
// @access  Private
exports.getUserBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.params.userId })
    .populate('resource', 'name type pricing images')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: bookings.length,
    data: { bookings }
  });
});

// @desc    Get resource's bookings
// @route   GET /api/bookings/resource/:resourceId
// @access  Private
exports.getResourceBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ resource: req.params.resourceId })
    .populate('user', 'name email')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: bookings.length,
    data: { bookings }
  });
});

// @desc    Register booking on blockchain
// @route   POST /api/bookings/:id/blockchain
// @access  Private
exports.registerOnBlockchain = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate('resource');

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  if (booking.blockchain.registered) {
    return res.status(400).json({
      success: false,
      message: 'Booking already registered on blockchain'
    });
  }

  try {
    // Call blockchain service to register booking
    const blockchainResponse = await axios.post(
      `${process.env.BLOCKCHAIN_SERVICE_URL}/api/blockchain/register-booking`,
      {
        bookingId: booking._id,
        resourceId: booking.resource._id,
        userId: booking.user,
        startDate: booking.startDate,
        endDate: booking.endDate,
        amount: booking.pricing.total
      },
      {
        headers: { Authorization: req.headers.authorization }
      }
    );

    // Update booking with blockchain info
    booking.blockchain = {
      registered: true,
      transactionHash: blockchainResponse.data.transactionHash,
      blockNumber: blockchainResponse.data.blockNumber,
      registeredAt: new Date()
    };

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking registered on blockchain successfully',
      data: {
        booking,
        blockchain: blockchainResponse.data
      }
    });
  } catch (error) {
    console.error('Blockchain registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register booking on blockchain',
      error: error.message
    });
  }
});
