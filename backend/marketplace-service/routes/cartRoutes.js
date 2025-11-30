
const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartCount
} = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

// Validation middleware
const validateAddToCart = [
  check('listing', 'Listing ID is required').not().isEmpty(),
  check('cropName', 'Crop name is required').not().isEmpty(),
  check('quantity', 'Quantity must be a positive number').isInt({ min: 1 }),
  check('unit', 'Unit is required').not().isEmpty(),
  check('pricePerUnit', 'Price per unit must be a positive number').isFloat({ min: 0 }),
  check('seller', 'Seller ID is required').not().isEmpty()
];

const validateUpdateQuantity = [
  check('quantity', 'Quantity must be a positive number').isInt({ min: 1 })
];

// All routes require authentication
router.use(protect);

// Cart routes
router.get('/', getCart);
router.get('/count', getCartCount);
router.post('/items', validateAddToCart, addToCart);
router.put('/items/:listingId', validateUpdateQuantity, updateCartItem);
router.delete('/items/:listingId', removeFromCart);
router.delete('/', clearCart);

module.exports = router;
