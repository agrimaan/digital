const express = require('express');
const { check } = require('express-validator');
const resourceController = require('../controllers/resourceController');
const { protect, authorize } = require('../../user-service/middleware/auth');

const router = express.Router();

// All routes require admin authentication
router.use(protect, authorize('admin', 'super-admin'));

// Resource management routes
router.get('/', resourceController.getAllResources);
router.get('/:id', resourceController.getResourceById);
router.post('/', [
  check('name', 'Resource name is required').not().isEmpty(),
  check('type', 'Resource type is required').not().isEmpty()
], resourceController.createResource);
router.put('/:id', resourceController.updateResource);
router.delete('/:id', resourceController.deleteResource);

// Resource analytics
router.get('/:id/analytics', resourceController.getResourceAnalytics);

// Resource verification
router.put('/:id/verify', resourceController.verifyResource);

module.exports = router;
