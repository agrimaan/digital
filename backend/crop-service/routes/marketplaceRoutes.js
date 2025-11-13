const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const marketplaceController = require('../controllers/marketplaceController');
const auth = require('../middleware/auth');

// Validation rules
const publishValidation = [
  body('pricePerUnit')
    .isFloat({ min: 0.01 })
    .withMessage('Price per unit must be a positive number'),
  body('quantity')
    .isFloat({ min: 0.01 })
    .withMessage('Quantity must be a positive number'),
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
  body('isOrganic')
    .optional()
    .isBoolean()
    .withMessage('isOrganic must be a boolean'),
  body('certifications')
    .optional()
    .isArray()
    .withMessage('Certifications must be an array')
];

// Routes
router.post('/:id/publish', auth, publishValidation, marketplaceController.publishCropToMarketplace);
router.get('/marketplace/listings', auth, marketplaceController.getMarketplaceListings);
router.delete('/:id/marketplace', auth, marketplaceController.unlistFromMarketplace);

module.exports = router;