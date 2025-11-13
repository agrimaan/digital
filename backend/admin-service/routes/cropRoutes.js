const express = require('express');
const { check } = require('express-validator');
const cropController = require('../controllers/cropController');
//const { protect, authorize } = require('../../user-service/middleware/auth');
const { protect, authorize } = require('@agrimaan/shared').middleware;


const router = express.Router();

// All routes require admin authentication
router.use(protect, authorize('admin', 'super-admin'));

// Crop management routes
router.get('/', cropController.getAllCrops);
router.get('/:id', cropController.getCropById);
router.post('/', [
  check('name', 'Crop name is required').not().isEmpty(),
  check('type', 'Crop type is required').not().isEmpty()
], cropController.createCrop);
router.put('/:id', cropController.updateCrop);
router.delete('/:id', cropController.deleteCrop);

// Crop analytics
router.get('/:id/analytics', cropController.getCropAnalytics);
router.get('/:id/harvests', cropController.getCropHarvests);

module.exports = router;