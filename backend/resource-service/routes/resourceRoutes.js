const express = require('express');
const { check } = require('express-validator');
const resourceController = require('../controllers/resourceController');
const { protect, authorize } = require('@agrimaan/shared').middleware;


const router = express.Router();

// Public routes
router.get('/', resourceController.getAllResources);
router.get('/available', resourceController.getAvailableResources);
router.get('/:id', resourceController.getResourceById);
router.get('/owner/:ownerId', resourceController.getResourcesByOwner);

// Protected routes
router.post('/', protect, [
  check('name', 'Resource name is required').not().isEmpty(),
  check('type', 'Resource type is required').not().isEmpty(),
  check('pricing.hourlyRate', 'Hourly rate is required').isNumeric()
], resourceController.createResource);

router.put('/:id', protect, resourceController.updateResource);
router.delete('/:id', protect, resourceController.deleteResource);

// Reviews
router.post('/:id/reviews', protect, [
  check('rating', 'Rating is required and must be between 1 and 5').isInt({ min: 1, max: 5 }),
  check('comment', 'Comment is required').not().isEmpty()
], resourceController.addReview);

// Analytics
router.get('/:id/analytics', protect, resourceController.getResourceAnalytics);

// Blockchain
router.post('/:id/blockchain', protect, resourceController.registerOnBlockchain);

module.exports = router;
