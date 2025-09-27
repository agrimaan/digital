const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const { 
  getProducts, 
  getProduct, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  getProductsBySeller,
  getProductsByCategory,
  searchProducts,
  getNearbyProducts,
  addProductReview
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

// Validation middleware
const validateProductCreation = [
  check('name', 'Product name is required').not().isEmpty(),
  check('description', 'Product description is required').not().isEmpty(),
  check('category', 'Category is required').isIn([
    'crop', 'seed', 'fertilizer', 'pesticide', 'equipment', 'other'
  ]),
  check('price.value', 'Price value is required and must be a number').isNumeric(),
  check('price.unit', 'Price unit is required').isIn(['kg', 'ton', 'piece', 'package', 'liter']),
  check('quantity.available', 'Available quantity is required and must be a number').isNumeric(),
  check('quantity.unit', 'Quantity unit is required').isIn(['kg', 'ton', 'piece', 'package', 'liter']),
  check('location.coordinates', 'Location coordinates must be an array of [longitude, latitude]').isArray()
];

const validateProductUpdate = [
  check('name', 'Product name must not be empty if provided').optional().not().isEmpty(),
  check('category', 'Category must be valid if provided')
    .optional()
    .isIn(['crop', 'seed', 'fertilizer', 'pesticide', 'equipment', 'other']),
  check('price.value', 'Price value must be a number if provided')
    .optional()
    .isNumeric(),
  check('price.unit', 'Price unit must be valid if provided')
    .optional()
    .isIn(['kg', 'ton', 'piece', 'package', 'liter']),
  check('quantity.available', 'Available quantity must be a number if provided')
    .optional()
    .isNumeric(),
  check('quantity.unit', 'Quantity unit must be valid if provided')
    .optional()
    .isIn(['kg', 'ton', 'piece', 'package', 'liter']),
  check('location.coordinates', 'Location coordinates must be an array if provided')
    .optional()
    .isArray()
];

const validateProductReview = [
  check('rating', 'Rating is required and must be between 1 and 5')
    .isInt({ min: 1, max: 5 }),
  check('comment', 'Comment is required').not().isEmpty()
];

// Routes
router
  .route('/')
  .get(getProducts)
  .post(protect, validateProductCreation, createProduct);

router
  .route('/:id')
  .get(getProduct)
  .put(protect, validateProductUpdate, updateProduct)
  .delete(protect, deleteProduct);

router.get('/seller/:sellerId', getProductsBySeller);
router.get('/category/:category', getProductsByCategory);
router.get('/search/:query', searchProducts);
router.get('/nearby', getNearbyProducts);
router.post('/:id/reviews', protect, validateProductReview, addProductReview);

module.exports = router;