const Supplier = require('../models/Supplier');
const { validationResult } = require('express-validator');

/**
 * @desc    Get all suppliers
 * @route   GET /api/suppliers
 * @access  Public/Admin
 */
exports.getSuppliers = async (req, res) => {
  try {
    const {
      status,
      businessType,
      city,
      state,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};
    
    if (status) query.status = status;
    if (businessType) query.businessType = businessType;
    if (city) query['address.city'] = new RegExp(city, 'i');
    if (state) query['address.state'] = new RegExp(state, 'i');
    
    if (search) {
      query.$or = [
        { businessName: new RegExp(search, 'i') },
        { ownerName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const suppliers = await Supplier.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-bankDetails -documents');

    const total = await Supplier.countDocuments(query);

    res.json({
      success: true,
      data: suppliers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error fetching suppliers:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
  }
};

/**
 * @desc    Get supplier by ID
 * @route   GET /api/suppliers/:id
 * @access  Public/Admin
 */
exports.getSupplierById = async (req, res) => {
    //const supplier = await Supplier.findById(req.params.id);
    try {
      console.log("email:", req.params.id);
      const supplier = await Supplier.find({ email: req.params.id })
    .populate('supplierId');

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
  
    // Hide sensitive data for non-admin users
    if (req.user && req.user.role !== 'admin' && req.user.id !== supplier._id.toString()) {
      supplier.bankDetails = undefined;
      supplier.documents = undefined;
    }

    res.json({
      success: true,
      data: supplier._id?.toString()
    });
  } catch (err) {
    console.error('Error fetching supplier:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
  }
};

/**
 * @desc    Create new supplier
 * @route   POST /api/suppliers
 * @access  Private
 */
exports.registerSupplier = async (req, res) => {
  const axios = require('axios');
  const USER_SVC = process.env.USER_SERVICE_URL || 'http://localhost:3002';
  
  exports.createSupplier = async (req, res) => {
    try {
      const { name, email, password, phone } = req.body;
  
      // call your user-service public registration (or create directly)
      const { data } = await axios.post(
        `${USER_SVC}/api/auth/register`,
        { name, email, password, phone, role: 'supplier' },
        { timeout: 8000 }
      );
  
      return res.status(201).json(data);
    } catch (err) {
      const status = err.response?.status || 500;
      return res.status(status).json({ message: err.response?.data?.message || err.message });
    }
};
}

/**
 * @desc    Create new supplier
 * @route   POST /api/suppliers
 * @access  Private
 */
exports.createSupplier = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }

  try {
    // Check if supplier already exists
    const existingSupplier = await Supplier.findOne({
      $or: [
        { email: req.body.email },
        { gstNumber: req.body.gstNumber }
      ]
    });

    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        message: 'Supplier with this email or GST number already exists'
      });
    }

    const supplier = new Supplier(req.body);
    await supplier.save();

    res.status(201).json({
      success: true,
      data: supplier,
      message: 'Supplier registered successfully. Awaiting for admin approval.'
    });   
  } catch (err) {
    console.error('Error creating supplier:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
  }

  //Now let us register supplier for the portal access
  try {
    this.registerSupplier();
  }
  catch (err) {
    console.error('Error registering supplier for the Agrimaan Portal:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
  }

};


/**
 * @desc    Update supplier
 * @route   PUT /api/suppliers/:id
 * @access  Private
 */
exports.updateSupplier = async (req, res) => {
  try {
    let supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && req.user.id !== supplier._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this supplier'
      });
    }

    // Prevent status change by non-admin
    if (req.body.status && req.user.role !== 'admin') {
      delete req.body.status;
    }

    supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: supplier,
      message: 'Supplier updated successfully'
    });
  } catch (err) {
    console.error('Error updating supplier:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
  }
};

/**
 * @desc    Delete supplier
 * @route   DELETE /api/suppliers/:id
 * @access  Private/Admin
 */
exports.deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    await supplier.deleteOne();

    res.json({
      success: true,
      message: 'Supplier deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting supplier:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
  }
};

/**
 * @desc    Approve supplier
 * @route   PUT /api/suppliers/:id/approve
 * @access  Private/Admin
 */
exports.approveSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    supplier.status = 'approved';
    supplier.verifiedBy = req.user.id;
    supplier.verifiedAt = new Date();
    
    await supplier.save();

    res.json({
      success: true,
      data: supplier,
      message: 'Supplier approved successfully'
    });
  } catch (err) {
    console.error('Error approving supplier:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
  }
};

/**
 * @desc    Reject supplier
 * @route   PUT /api/suppliers/:id/reject
 * @access  Private/Admin
 */
exports.rejectSupplier = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    supplier.status = 'rejected';
    supplier.rejectionReason = reason;
    supplier.verifiedBy = req.user.id;
    supplier.verifiedAt = new Date();
    
    await supplier.save();

    res.json({
      success: true,
      data: supplier,
      message: 'Supplier rejected'
    });
  } catch (err) {
    console.error('Error rejecting supplier:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
  }
};

/**
 * @desc    Get supplier statistics
 * @route   GET /api/suppliers/:id/stats
 * @access  Private
 */
exports.getSupplierStats = async (req, res) => {
  try {
    const supplier = await Supplier.find({ email: req.params.id })
    .populate('supplierId');
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Get product count
    const Product = require('../models/Product');
    const totalProducts = await Product.countDocuments({ supplierId: supplier._id })|| 0;
    const activeProducts = await Product.countDocuments({ 
      supplierId: supplier._id, 
      status: 'active' 
    });

    const stats = {
      totalProducts,
      activeProducts,
      totalSales: supplier.totalSales||0,
      totalOrders: supplier.totalOrders||0,
      rating: supplier.rating||0,
      totalRatings: supplier.totalRatings||0,
      status: supplier.status,
      isOperational: supplier.isOperational
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    console.error('Error fetching supplier stats:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
  }
};