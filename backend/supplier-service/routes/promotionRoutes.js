
const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const { 
  getPromotions,
  getPromotionsBySupplier,
  getPromotion,
  createPromotion,
  updatePromotion,
  deletePromotion
} = require('../controllers/promotionController');
const { protect, authorize } = require('@agrimaan/shared').middleware;

// Validation middleware
const validatePromotionCreation = [
  check('name', 'Promotion name is required').not().isEmpty(),
  check('type', 'Promotion type is required').not().isEmpty(),
  check('type', 'Promotion type must be one of: percentage, fixed, buy-x-get-y, free-shipping')
    .isIn(['percentage', 'fixed', 'buy-x-get-y', 'free-shipping']),
  check('value', 'Promotion value is required and must be a non-negative number').isFloat({ min: 0 }),
  check('supplierId', 'Supplier ID is required').not().isEmpty(),
  check('startDate', 'Start date is required').not().isEmpty(),
  check('endDate', 'End date is required').not().isEmpty()
];

const validatePromotionUpdate = [
  check('name', 'Promotion name must not be empty if provided').optional().not().isEmpty(),
  check('type', 'Promotion type must be valid if provided')
    .optional()
    .isIn(['percentage', 'fixed', 'buy-x-get-y', 'free-shipping']),
  check('value', 'Promotion value must be a non-negative number if provided').optional().isFloat({ min: 0 })
];

// Routes
router
  .route('/')
  .get(getPromotions)
  .post(protect, authorize('supplier'), validatePromotionCreation, createPromotion);

router
  .route('/supplier/:supplierId')
  .get(getPromotionsBySupplier);

router
  .route('/:id')
  .get(getPromotion)
  .put(protect, authorize('supplier', 'admin'), validatePromotionUpdate, updatePromotion)
  .delete(protect, authorize('supplier', 'admin'), deletePromotion);

module.exports = router;
