const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  calculatePrice,
  approveProduct,
  updateStock
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/:id/calculate-price', calculatePrice);

// Protected routes
router.post(
  '/',
  protect,
  [
    body('supplierId', 'Supplier ID is required').not().isEmpty(),
    body('name', 'Product name is required').not().isEmpty(),
    body('category', 'Category is required').isIn(['seeds', 'fertilizers', 'pesticides', 'equipment', 'tools', 'irrigation', 'other']),
    body('subcategory', 'Subcategory is required').not().isEmpty(),
    body('description', 'Description is required').not().isEmpty(),
    body('basePrice', 'Base price is required').isFloat({ min: 0 }),
    body('unit', 'Unit is required').isIn(['kg', 'gram', 'liter', 'ml', 'piece', 'packet', 'bag', 'box']),
    body('unitSize', 'Unit size is required').isFloat({ min: 0 }),
    body('stockQuantity', 'Stock quantity is required').isInt({ min: 0 })
  ],
  createProduct
);

router.put('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);
router.put('/:id/stock', protect, updateStock);

// Admin only routes
router.put('/:id/approve', protect, authorize('admin'), approveProduct);

module.exports = router;