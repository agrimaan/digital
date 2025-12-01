
const Inquiry = require('../models/Inquiry');
const responseHandler = require('../utils/responseHandler');

// @desc    Create inquiry (Buyer)
// @route   POST /api/marketplace/inquiries
// @access  Private (Buyer)
exports.createInquiry = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const {
      listing,
      farmer,
      farmerName,
      cropName,
      variety,
      message,
      interestedQuantity,
      quantityUnit,
      buyerPhone
    } = req.body;

    // Validate required fields
    if (!listing || !farmer || !cropName || !message) {
      return responseHandler.error(res, 400, 'Missing required fields');
    }

    // Create inquiry
    const inquiry = await Inquiry.create({
      listing,
      buyer: buyerId,
      buyerName: req.user.name || req.user.email,
      buyerEmail: req.user.email,
      buyerPhone,
      farmer,
      farmerName,
      cropName,
      variety,
      message,
      interestedQuantity,
      quantityUnit
    });

    return responseHandler.success(res, 201, inquiry, 'Inquiry sent successfully');
  } catch (error) {
    console.error('Error creating inquiry:', error);
    return responseHandler.error(res, 500, 'Error creating inquiry', error);
  }
};

// @desc    Get buyer's inquiries
// @route   GET /api/marketplace/inquiries/buyer
// @access  Private (Buyer)
exports.getBuyerInquiries = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { status, page = 1, limit = 20 } = req.query;

    const filter = { buyer: buyerId };
    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const inquiries = await Inquiry.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Inquiry.countDocuments(filter);

    return responseHandler.success(res, 200, {
      inquiries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }, 'Inquiries retrieved successfully');
  } catch (error) {
    console.error('Error getting buyer inquiries:', error);
    return responseHandler.error(res, 500, 'Error retrieving inquiries', error);
  }
};

// @desc    Get farmer's inquiries
// @route   GET /api/marketplace/inquiries/farmer
// @access  Private (Farmer)
exports.getFarmerInquiries = async (req, res) => {
  try {
    const farmerId = req.user.id;
    const { status, page = 1, limit = 20 } = req.query;

    const filter = { farmer: farmerId };
    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const inquiries = await Inquiry.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Inquiry.countDocuments(filter);

    return responseHandler.success(res, 200, {
      inquiries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }, 'Inquiries retrieved successfully');
  } catch (error) {
    console.error('Error getting farmer inquiries:', error);
    return responseHandler.error(res, 500, 'Error retrieving inquiries', error);
  }
};

// @desc    Get single inquiry
// @route   GET /api/marketplace/inquiries/:id
// @access  Private (Buyer or Farmer)
exports.getInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const inquiry = await Inquiry.findById(id);

    if (!inquiry) {
      return responseHandler.error(res, 404, 'Inquiry not found');
    }

    // Check if user is buyer or farmer
    if (inquiry.buyer !== userId && inquiry.farmer !== userId) {
      return responseHandler.error(res, 403, 'Not authorized to view this inquiry');
    }

    // Mark as read if farmer is viewing
    if (inquiry.farmer === userId && !inquiry.isRead) {
      await inquiry.markAsRead();
    }

    // Mark response as read if buyer is viewing
    if (inquiry.buyer === userId && inquiry.status === 'responded' && !inquiry.isResponseRead) {
      await inquiry.markResponseAsRead();
    }

    return responseHandler.success(res, 200, inquiry, 'Inquiry retrieved successfully');
  } catch (error) {
    console.error('Error getting inquiry:', error);
    return responseHandler.error(res, 500, 'Error retrieving inquiry', error);
  }
};

// @desc    Respond to inquiry (Farmer)
// @route   POST /api/marketplace/inquiries/:id/respond
// @access  Private (Farmer)
exports.respondToInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const farmerId = req.user.id;
    const { message } = req.body;

    if (!message) {
      return responseHandler.error(res, 400, 'Response message is required');
    }

    const inquiry = await Inquiry.findById(id);

    if (!inquiry) {
      return responseHandler.error(res, 404, 'Inquiry not found');
    }

    // Check if user is the farmer
    if (inquiry.farmer !== farmerId) {
      return responseHandler.error(res, 403, 'Not authorized to respond to this inquiry');
    }

    // Add response
    await inquiry.addResponse(message, farmerId);

    return responseHandler.success(res, 200, inquiry, 'Response sent successfully');
  } catch (error) {
    console.error('Error responding to inquiry:', error);
    return responseHandler.error(res, 500, 'Error sending response', error);
  }
};

// @desc    Mark inquiry as read (Farmer)
// @route   PUT /api/marketplace/inquiries/:id/read
// @access  Private (Farmer)
exports.markInquiryAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const farmerId = req.user.id;

    const inquiry = await Inquiry.findById(id);

    if (!inquiry) {
      return responseHandler.error(res, 404, 'Inquiry not found');
    }

    // Check if user is the farmer
    if (inquiry.farmer !== farmerId) {
      return responseHandler.error(res, 403, 'Not authorized');
    }

    await inquiry.markAsRead();

    return responseHandler.success(res, 200, inquiry, 'Inquiry marked as read');
  } catch (error) {
    console.error('Error marking inquiry as read:', error);
    return responseHandler.error(res, 500, 'Error updating inquiry', error);
  }
};

// @desc    Get inquiry statistics for farmer
// @route   GET /api/marketplace/inquiries/farmer/stats
// @access  Private (Farmer)
exports.getFarmerInquiryStats = async (req, res) => {
  try {
    const farmerId = req.user.id;

    const [total, pending, responded, unread] = await Promise.all([
      Inquiry.countDocuments({ farmer: farmerId }),
      Inquiry.countDocuments({ farmer: farmerId, status: 'pending' }),
      Inquiry.countDocuments({ farmer: farmerId, status: 'responded' }),
      Inquiry.countDocuments({ farmer: farmerId, isRead: false })
    ]);

    const stats = {
      total,
      pending,
      responded,
      unread
    };

    return responseHandler.success(res, 200, stats, 'Statistics retrieved successfully');
  } catch (error) {
    console.error('Error getting inquiry stats:', error);
    return responseHandler.error(res, 500, 'Error retrieving statistics', error);
  }
};

// @desc    Get inquiry statistics for buyer
// @route   GET /api/marketplace/inquiries/buyer/stats
// @access  Private (Buyer)
exports.getBuyerInquiryStats = async (req, res) => {
  try {
    const buyerId = req.user.id;

    const [total, pending, responded, unreadResponses] = await Promise.all([
      Inquiry.countDocuments({ buyer: buyerId }),
      Inquiry.countDocuments({ buyer: buyerId, status: 'pending' }),
      Inquiry.countDocuments({ buyer: buyerId, status: 'responded' }),
      Inquiry.countDocuments({ buyer: buyerId, status: 'responded', isResponseRead: false })
    ]);

    const stats = {
      total,
      pending,
      responded,
      unreadResponses
    };

    return responseHandler.success(res, 200, stats, 'Statistics retrieved successfully');
  } catch (error) {
    console.error('Error getting inquiry stats:', error);
    return responseHandler.error(res, 500, 'Error retrieving statistics', error);
  }
};

// @desc    Close inquiry
// @route   PUT /api/marketplace/inquiries/:id/close
// @access  Private (Buyer or Farmer)
exports.closeInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const inquiry = await Inquiry.findById(id);

    if (!inquiry) {
      return responseHandler.error(res, 404, 'Inquiry not found');
    }

    // Check if user is buyer or farmer
    if (inquiry.buyer !== userId && inquiry.farmer !== userId) {
      return responseHandler.error(res, 403, 'Not authorized');
    }

    inquiry.status = 'closed';
    await inquiry.save();

    return responseHandler.success(res, 200, inquiry, 'Inquiry closed successfully');
  } catch (error) {
    console.error('Error closing inquiry:', error);
    return responseHandler.error(res, 500, 'Error closing inquiry', error);
  }
};

module.exports = exports;
