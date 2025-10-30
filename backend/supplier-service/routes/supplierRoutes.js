const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  getSuppliers,
  getSupplierById,
  getSupplierByEmail,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  approveSupplier,
  rejectSupplier,
  getSupplierStats
} = require('../controllers/supplierController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getSuppliers);
router.get('/:id', getSupplierById);
router.get('/:id/stats', getSupplierStats);

// Protected routes
router.post(
  '/register',
  [
    body('businessName', 'Business name is required').not().isEmpty(),
    body('firstName', 'Owner first name is required').not().isEmpty(),
    body('lastName', 'Owner last name is required').not().isEmpty(),
    body('email', 'Please provide a valid email').isEmail(),
    body('phone', 'Please provide a valid 10-digit phone number').matches(/^[0-9]{10}$/),
    body('gstNumber', 'GST number is required').not().isEmpty(),
    body('panNumber', 'PAN number is required').not().isEmpty(),
    body('businessType', 'Business type is required').isIn(['wholesaler', 'manufacturer', 'distributor', 'retailer'])
  ],
  createSupplier
);

// Public route: no auth middleware here
//router.post('/register', createSupplier);

router.put('/:id', protect, updateSupplier);
router.delete('/:id', protect, authorize('admin'), deleteSupplier);

// Admin only routes
router.put('/:id/approve', protect, authorize('admin'), approveSupplier);
router.put('/:id/reject', protect, authorize('admin'), rejectSupplier);

module.exports = router;