const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const { validationResult } = require('express-validator');

/**
 * @desc    Get all products
 * @route   GET /api/products
 * @access  Public
 */
exports.getProducts = async (req, res) => {
  try {
    const {
      supplierId,
      category,
      subcategory,
      status,
      isOrganic,
      isSustainable,
      minPrice,
      maxPrice,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = { isApproved: true };
    
    if (supplierId) query.supplierId = supplierId;
    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;
    if (status) query.status = status;
    if (isOrganic !== undefined) query.isOrganic = isOrganic === 'true';
    if (isSustainable !== undefined) query.isSustainable = isSustainable === 'true';
    
    if (minPrice || maxPrice) {
      query.basePrice = {};
      if (minPrice) query.basePrice.$gte = parseFloat(minPrice);
      if (maxPrice) query.basePrice.$lte = parseFloat(maxPrice);
    }
    
    if (search) {
      query.$text = { $search: search };
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const products = await Product.find(query)
      .populate('supplierId', 'businessName rating address.city address.state')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
  }
};

/**
 * @desc    Get product by ID
 * @route   GET /api/products/:id
 * @access  Public
 */
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('supplierId', 'businessName rating address phone email');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Increment view count
    product.viewCount += 1;
    await product.save();

    res.json({
      success: true,
      data: product
    });
  } catch (err) {
    console.error('Error fetching product:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
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
 * @desc    Create new product
 * @route   POST /api/products
 * @access  Private/Supplier
 */
exports.createProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }

  try {
    // Verify supplier exists and is approved
    const supplier = await Supplier.findById(req.body.supplierId);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    if (supplier.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Supplier must be approved to add products'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && req.user.id !== supplier._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add products for this supplier'
      });
    }

    // Generate SKU if not provided
    if (!req.body.sku) {
      req.body.sku = `${req.body.category.substring(0, 3).toUpperCase()}-${Date.now()}`;
    }

    const product = new Product(req.body);
    await product.save();

    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully. Awaiting admin approval.'
    });
  } catch (err) {
    console.error('Error creating product:', err);
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Product with this SKU already exists'
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
 * @desc    Update product
 * @route   PUT /api/products/:id
 * @access  Private/Supplier
 */
exports.updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && req.user.id !== product.supplierId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this product'
      });
    }

    // Prevent approval status change by non-admin
    if (req.body.isApproved !== undefined && req.user.role !== 'admin') {
      delete req.body.isApproved;
    }

    product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: product,
      message: 'Product updated successfully'
    });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
  }
};

/**
 * @desc    Delete product
 * @route   DELETE /api/products/:id
 * @access  Private/Supplier/Admin
 */
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && req.user.id !== product.supplierId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this product'
      });
    }

    await product.deleteOne();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
  }
};

/**
 * @desc    Calculate product price with discounts
 * @route   POST /api/products/:id/calculate-price
 * @access  Public
 */
exports.calculatePrice = async (req, res) => {
  try {
    const { quantity, farmerId } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (!product.isAvailable(quantity)) {
      return res.status(400).json({
        success: false,
        message: 'Product not available in requested quantity'
      });
    }

    // Calculate base price with volume discount
    let finalPrice = product.calculatePrice(quantity);
    let discounts = [];

    // Apply farmer rating discount if farmerId provided
    if (farmerId) {
      const FarmerRating = require('../models/FarmerRating');
      const farmerRating = await FarmerRating.findOne({ farmerId });
      
      if (farmerRating) {
        const ratingDiscount = farmerRating.benefits.maxDiscountPercentage;
        const discountAmount = finalPrice * (ratingDiscount / 100);
        finalPrice -= discountAmount;
        
        discounts.push({
          type: 'farmer_rating',
          tier: farmerRating.tier,
          percentage: ratingDiscount,
          amount: discountAmount
        });
      }
    }

    res.json({
      success: true,
      data: {
        productId: product._id,
        productName: product.name,
        quantity,
        basePrice: product.basePrice,
        pricePerUnit: finalPrice / quantity,
        totalPrice: finalPrice,
        discounts,
        totalDiscount: discounts.reduce((sum, d) => sum + d.amount, 0)
      }
    });
  } catch (err) {
    console.error('Error calculating price:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
  }
};

/**
 * @desc    Approve product
 * @route   PUT /api/products/:id/approve
 * @access  Private/Admin
 */
exports.approveProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    product.isApproved = true;
    product.approvedBy = req.user.id;
    product.approvedAt = new Date();
    
    await product.save();

    res.json({
      success: true,
      data: product,
      message: 'Product approved successfully'
    });
  } catch (err) {
    console.error('Error approving product:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
  }
};

/**
 * @desc    Update product stock
 * @route   PUT /api/products/:id/stock
 * @access  Private/Supplier
 */
exports.updateStock = async (req, res) => {
  try {
    const { quantity, operation } = req.body;

    if (!quantity || !operation) {
      return res.status(400).json({
        success: false,
        message: 'Quantity and operation are required'
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && req.user.id !== product.supplierId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update stock for this product'
      });
    }

    await product.updateStock(quantity, operation);

    res.json({
      success: true,
      data: product,
      message: 'Stock updated successfully'
    });
  } catch (err) {
    console.error('Error updating stock:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
  }
};