const Product = require('../models/Product');

/**
 * Get all products
 * @param {Object} filter - Filter criteria
 * @returns {Promise<Array>} Array of products
 */
exports.getAllProducts = async (filter = {}) => {
  return await Product.find(filter);
};

/**
 * Get product by ID
 * @param {string} id - Product ID
 * @returns {Promise<Object>} Product object
 */
exports.getProductById = async (id) => {
  return await Product.findById(id);
};

/**
 * Create a new product
 * @param {Object} productData - Product data
 * @returns {Promise<Object>} Created product
 */
exports.createProduct = async (productData) => {
  return await Product.create(productData);
};

/**
 * Update product
 * @param {string} id - Product ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated product
 */
exports.updateProduct = async (id, updateData) => {
  return await Product.findByIdAndUpdate(
    id,
    { ...updateData, updatedAt: Date.now() },
    { new: true, runValidators: true }
  );
};

/**
 * Delete product
 * @param {string} id - Product ID
 * @returns {Promise<boolean>} True if deleted
 */
exports.deleteProduct = async (id) => {
  const product = await Product.findById(id);
  if (!product) {
    return false;
  }
  await product.remove();
  return true;
};

/**
 * Get products by seller
 * @param {string} sellerId - Seller ID
 * @returns {Promise<Array>} Array of products
 */
exports.getProductsBySeller = async (sellerId) => {
  return await Product.find({ seller: sellerId });
};

/**
 * Get products by category
 * @param {string} category - Product category
 * @returns {Promise<Array>} Array of products
 */
exports.getProductsByCategory = async (category) => {
  return await Product.find({ category });
};

/**
 * Search products
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of products
 */
exports.searchProducts = async (query) => {
  return await Product.find(
    { $text: { $search: query } },
    { score: { $meta: "textScore" } }
  ).sort({ score: { $meta: "textScore" } });
};

/**
 * Get nearby products
 * @param {number} longitude - Longitude
 * @param {number} latitude - Latitude
 * @param {number} distance - Distance in meters
 * @returns {Promise<Array>} Array of products
 */
exports.getNearbyProducts = async (longitude, latitude, distance = 10000) => {
  return await Product.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: distance
      }
    }
  });
};

/**
 * Add product review
 * @param {string} id - Product ID
 * @param {Object} review - Review data
 * @returns {Promise<Object>} Updated product
 */
exports.addProductReview = async (id, review) => {
  const product = await Product.findById(id);
  
  if (!product) {
    throw new Error('Product not found');
  }
  
  // Add review
  product.reviews.push(review);
  
  // Update ratings
  const totalRatings = product.reviews.reduce((sum, review) => sum + review.rating, 0);
  product.ratings.average = totalRatings / product.reviews.length;
  product.ratings.count = product.reviews.length;
  
  return await product.save();
};

/**
 * Update product quantity
 * @param {string} id - Product ID
 * @param {number} quantity - Quantity to add (positive) or subtract (negative)
 * @returns {Promise<Object>} Updated product
 */
exports.updateProductQuantity = async (id, quantity) => {
  const product = await Product.findById(id);
  
  if (!product) {
    throw new Error('Product not found');
  }
  
  product.quantity.available += quantity;
  
  if (product.quantity.available < 0) {
    throw new Error('Insufficient product quantity');
  }
  
  return await product.save();
};