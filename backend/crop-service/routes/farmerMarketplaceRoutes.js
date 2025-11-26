const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const farmerMarketplaceController = require('../controllers/farmerMarketplaceController');
const { protect } = require('@agrimaan/shared').middleware;

// Validation rules for creating listing
const createListingValidation = [
  body('cropId')
    .notEmpty()
    .withMessage('Crop ID is required')
    .isMongoId()
    .withMessage('Invalid crop ID'),
  body('quantity.available')
    .isFloat({ min: 0.01 })
    .withMessage('Quantity must be a positive number'),
  body('pricing.pricePerUnit')
    .isFloat({ min: 0.01 })
    .withMessage('Price per unit must be a positive number1'),
  body('negotiable')
    .optional()
    .isBoolean()
    .withMessage('Negotiable must be a boolean'),
  body('minimumOrderQuantity')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum order quantity must be a positive number'),
  body('grade')
    .optional()
    .isIn(['A', 'B', 'C', 'Premium', 'Standard'])
    .withMessage('Invalid grade'),
  body('isOrganic')
    .optional()
    .isBoolean()
    .withMessage('isOrganic must be a boolean'),
  body('certifications')
    .optional()
    .isArray()
    .withMessage('Certifications must be an array'),
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  body('visibility')
    .optional()
    .isIn(['public', 'private', 'verified_buyers_only'])
    .withMessage('Invalid visibility option'),
  body('expiresInDays')
    .optional()
    .isInt({ min: 1, max: 90 })
    .withMessage('Expiration must be between 1 and 90 days')
];

// Validation rules for updating listing
const updateListingValidation = [
  body('available')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Available quantity must be a positive number'),
  body('pricePerUnit')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Price per unit must be a positive number'),
  body('pricing.negotiable')
    .optional()
    .isBoolean()
    .withMessage('Negotiable must be a boolean'),
  body('pricing.minimumOrderQuantity')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum order quantity must be a positive number'),
  body('quality.grade')
    .optional()
    .isIn(['A', 'B', 'C', 'Premium', 'Standard'])
    .withMessage('Invalid grade'),
  body('quality.isOrganic')
    .optional()
    .isBoolean()
    .withMessage('isOrganic must be a boolean'),
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('visibility')
    .optional()
    .isIn(['public', 'private', 'verified_buyers_only'])
    .withMessage('Invalid visibility option'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Invalid status')
];

// Routes
router.post('/listings', protect, createListingValidation, farmerMarketplaceController.createListing);
router.get('/listings', protect, farmerMarketplaceController.getMyListings);
router.get('/listings/:id', protect, farmerMarketplaceController.getMyListing);
router.put('/listings/:id', protect, updateListingValidation, farmerMarketplaceController.updateListing);
router.delete('/listings/:id', protect, farmerMarketplaceController.deactivateListing);
router.post('/listings/:id/reactivate', protect, farmerMarketplaceController.reactivateListing);
router.get('/ready-crops', protect, farmerMarketplaceController.getReadyCrops);
router.get('/statistics', protect, farmerMarketplaceController.getStatistics);

module.exports = router;