const { validationResult } = require('express-validator');
const productService = require('../services/productService');
const responseHandler = require('../utils/responseHandler');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    // Apply filters if provided in query params
    const filter = {};
    
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    if (req.query.isOrganic) {
      filter.isOrganic = req.query.isOrganic === 'true';
    }
    
    if (req.query.seller) {
      filter.seller = req.query.seller;
    }
    
    if (req.query.minPrice || req.query.maxPrice) {
      filter['price.value'] = {};
      
      if (req.query.minPrice) {
        filter['price.value'].$gte = parseFloat(req.query.minPrice);
      }
      
      if (req.query.maxPrice) {
        filter['price.value'].$lte = parseFloat(req.query.maxPrice);
      }
    }
    
    // Only show active products unless explicitly requested
    if (req.query.showInactive !== 'true') {
      filter.isActive = true;
    }
    
    const products = await productService.getAllProducts(filter);
    
    return responseHandler.success(res, 200, products, 'Products retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving products', error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    
    if (!product) {
      return responseHandler.notFound(res, 'Product not found');
    }

    return responseHandler.success(res, 200, product, 'Product retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving product', error);
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private
exports.createProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseHandler.badRequest(res, 'Validation error', errors.array());
  }

  try {
    // Set seller to current user
    const productData = {
      ...req.body,
      seller: req.user.id
    };
    
    const product = await productService.createProduct(productData);
    
    return responseHandler.success(res, 201, product, 'Product created successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error creating product', error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
exports.updateProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseHandler.badRequest(res, 'Validation error', errors.array());
  }

  try {
    let product = await productService.getProductById(req.params.id);
    
    if (!product) {
      return responseHandler.notFound(res, 'Product not found');
    }

    // Check if user owns the product or is admin
    if (product.seller !== req.user.id && req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to update this product');
    }

    // Prevent seller change
    if (req.body.seller && req.body.seller !== product.seller) {
      return responseHandler.badRequest(res, 'Cannot change product seller');
    }

    // Update product
    product = await productService.updateProduct(req.params.id, req.body);
    
    return responseHandler.success(res, 200, product, 'Product updated successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error updating product', error);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private
exports.deleteProduct = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    
    if (!product) {
      return responseHandler.notFound(res, 'Product not found');
    }

    // Check if user owns the product or is admin
    if (product.seller !== req.user.id && req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to delete this product');
    }

    await productService.deleteProduct(req.params.id);
    
    return responseHandler.success(res, 200, {}, 'Product deleted successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error deleting product', error);
  }
};

// @desc    Get products by seller
// @route   GET /api/products/seller/:sellerId
// @access  Public
exports.getProductsBySeller = async (req, res) => {
  try {
    const products = await productService.getProductsBySeller(req.params.sellerId);
    
    // Only show active products unless explicitly requested or seller is the current user
    const showInactive = req.query.showInactive === 'true' || 
                         (req.user && req.params.sellerId === req.user.id);
    
    const filteredProducts = showInactive 
      ? products 
      : products.filter(product => product.isActive);
    
    return responseHandler.success(res, 200, filteredProducts, 'Products retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving products', error);
  }
};

// @desc    Get products by category
// @route   GET /api/products/category/:category
// @access  Public
exports.getProductsByCategory = async (req, res) => {
  try {
    const products = await productService.getProductsByCategory(req.params.category);
    
    // Only show active products
    const filteredProducts = products.filter(product => product.isActive);
    
    return responseHandler.success(res, 200, filteredProducts, 'Products retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving products', error);
  }
};

// @desc    Search products
// @route   GET /api/products/search/:query
// @access  Public
exports.searchProducts = async (req, res) => {
  try {
    const products = await productService.searchProducts(req.params.query);
    
    // Only show active products
    const filteredProducts = products.filter(product => product.isActive);
    
    return responseHandler.success(res, 200, filteredProducts, 'Products retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error searching products', error);
  }
};

// @desc    Get nearby products
// @route   GET /api/products/nearby
// @access  Public
exports.getNearbyProducts = async (req, res) => {
  try {
    const { longitude, latitude, distance = 10000 } = req.query; // distance in meters
    
    if (!longitude || !latitude) {
      return responseHandler.badRequest(res, 'Longitude and latitude are required');
    }

    const products = await productService.getNearbyProducts(
      parseFloat(longitude),
      parseFloat(latitude),
      parseFloat(distance)
    );
    
    // Only show active products
    const filteredProducts = products.filter(product => product.isActive);
    
    return responseHandler.success(res, 200, filteredProducts, 'Nearby products retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving nearby products', error);
  }
};

// @desc    Add product review
// @route   POST /api/products/:id/reviews
// @access  Private
exports.addProductReview = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseHandler.badRequest(res, 'Validation error', errors.array());
  }

  try {
    const product = await productService.getProductById(req.params.id);
    
    if (!product) {
      return responseHandler.notFound(res, 'Product not found');
    }

    // Check if user has already reviewed this product
    const existingReview = product.reviews.find(review => review.user === req.user.id);
    
    if (existingReview) {
      return responseHandler.badRequest(res, 'You have already reviewed this product');
    }

    // Create review
    const review = {
      user: req.user.id,
      rating: req.body.rating,
      comment: req.body.comment
    };
    
    const updatedProduct = await productService.addProductReview(req.params.id, review);
    
    return responseHandler.success(res, 200, updatedProduct, 'Review added successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error adding review', error);
  }
};