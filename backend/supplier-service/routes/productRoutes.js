
const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const { 
  getProducts,
  getProductsBySupplier,
  getProductById,
  getProductPriceForFarmer,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  calculatePrice,
  approveProduct,
  updateStock
} = require('../controllers/productController');
const { protect, authorize } = require('@agrimaan/shared').middleware;

// Validation middleware
const validateProductCreation = [
  check('name', 'Product name is required').not().isEmpty(),
  check('description', 'Product description is required').not().isEmpty(),
  check('category', 'Category is required').not().isEmpty(),
  check('category', 'Category must be one of: seeds, fertilizers, pesticides, equipment, organic, sustainable')
    .isIn(['seeds', 'fertilizers', 'pesticides', 'equipment', 'organic', 'sustainable']),
  check('supplierId', 'Supplier ID is required').not().isEmpty(),
  check('pricing.basePrice', 'Base price is required and must be a positive number').isFloat({ min: 0 }),
  check('pricing.unit', 'Price unit is required').not().isEmpty(),
  check('pricing.unit', 'Price unit must be one of: kg, ton, piece, package, liter, quintal')
    .isIn(['kg', 'ton', 'piece', 'package', 'liter', 'quintal']),
  check('inventory.availableQuantity', 'Available quantity is required and must be a non-negative number').isInt({ min: 0 })
];

const validateProductUpdate = [
  check('name', 'Product name must not be empty if provided').optional().not().isEmpty(),
  check('category', 'Category must be valid if provided')
    .optional()
    .isIn(['seeds', 'fertilizers', 'pesticides', 'equipment', 'organic', 'sustainable']),
  check('pricing.basePrice', 'Base price must be a positive number if provided').optional().isFloat({ min: 0 }),
  check('pricing.unit', 'Price unit must be valid if provided')
    .optional()
    .isIn(['kg', 'ton', 'piece', 'package', 'liter', 'quintal']),
  check('inventory.availableQuantity', 'Available quantity must be a non-negative number if provided').optional().isInt({ min: 0 })
];

// Routes
router
  .route('/')
  .get(getProducts)
  .post(protect, authorize('supplier'), validateProductCreation, createProduct);

router
  .route('/supplier/:supplierId')
  .get(getProductsBySupplier);

router
  .route('/:id')
  .get(getProduct)
  .put(protect, authorize('supplier', 'admin'), validateProductUpdate, updateProduct)
  .delete(protect, authorize('supplier', 'admin'), deleteProduct);

router
  .route('/:id/price/:farmerId')
  .get(getProductPriceForFarmer);



// Public routes
router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/:id/calculate-price', calculatePrice);



// Admin only routes
router.put('/:id/approve', protect, authorize('admin'), approveProduct);

module.exports = router;
