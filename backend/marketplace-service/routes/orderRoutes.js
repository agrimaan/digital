
const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const { 
  getOrders, 
  getOrder, 
  createOrder, 
  updateOrderStatus, 
  updatePaymentStatus,
  updateShipmentDetails,
  getOrdersByBuyer,
  getOrdersBySeller,
  getOrderStatistics
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

// Validation middleware
const validateOrderCreation = [
  check('items', 'Items are required').isArray({ min: 1 }),
  check('items.*.product', 'Product ID is required for each item').not().isEmpty(),
  check('items.*.quantity', 'Quantity is required for each item').isNumeric(),
  check('paymentMethod', 'Payment method is required').isIn([
    'cash', 'bank_transfer', 'credit_card', 'debit_card', 'upi', 'wallet', 'crypto'
  ]),
  check('shippingAddress.street', 'Shipping street is required').not().isEmpty(),
  check('shippingAddress.city', 'Shipping city is required').not().isEmpty(),
  check('shippingAddress.state', 'Shipping state is required').not().isEmpty(),
  check('shippingAddress.country', 'Shipping country is required').not().isEmpty(),
  check('shippingAddress.postalCode', 'Shipping postal code is required').not().isEmpty(),
  check('shippingAddress.contactName', 'Shipping contact name is required').not().isEmpty(),
  check('shippingAddress.contactPhone', 'Shipping contact phone is required').not().isEmpty()
];

const validateOrderStatusUpdate = [
  check('status', 'Status is required').isIn([
    'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
  ])
];

const validatePaymentStatusUpdate = [
  check('paymentStatus', 'Payment status is required').isIn([
    'pending', 'paid', 'failed', 'refunded'
  ])
];

const validateShipmentUpdate = [
  check('carrier', 'Carrier must not be empty if provided').optional().not().isEmpty(),
  check('trackingNumber', 'Tracking number must not be empty if provided').optional().not().isEmpty(),
  check('estimatedDelivery', 'Estimated delivery must be a valid date if provided')
    .optional()
    .isISO8601()
    .toDate(),
  check('actualDelivery', 'Actual delivery must be a valid date if provided')
    .optional()
    .isISO8601()
    .toDate()
];

// Buyer routes - accessible by buyers
router.post('/', protect, validateOrderCreation, createOrder);
router.get('/buyer', protect, getOrdersByBuyer);
router.get('/buyer/:id', protect, getOrder);

// Seller routes - accessible by farmers/sellers
router.get('/seller', protect, getOrdersBySeller);

// Admin routes - accessible by admins only
router.get('/', protect, authorize('admin', 'super-admin'), getOrders);
router.get('/statistics', protect, authorize('admin', 'super-admin'), getOrderStatistics);
router.put('/:id/status', protect, authorize('admin', 'super-admin', 'farmer'), validateOrderStatusUpdate, updateOrderStatus);
router.put('/:id/payment', protect, authorize('admin', 'super-admin'), validatePaymentStatusUpdate, updatePaymentStatus);
router.put('/:id/shipment', protect, authorize('admin', 'super-admin', 'farmer'), validateShipmentUpdate, updateShipmentDetails);

// Get single order - accessible by buyer, seller, or admin
router.get('/:id', protect, getOrder);

module.exports = router;
