const express = require('express');
const router = express.Router();
const buyerMarketplaceController = require('../controllers/buyerMarketplaceController');
const auth = require('../middleware/auth');

// Public routes (no authentication required)
router.get('/listings', buyerMarketplaceController.getAllListings);
router.get('/listings/nearby', buyerMarketplaceController.getNearbyListings);
router.get('/listings/crop/:cropName', buyerMarketplaceController.getListingsByCrop);
router.get('/listings/organic', buyerMarketplaceController.getOrganicListings);
router.get('/listings/featured', buyerMarketplaceController.getFeaturedListings);
router.get('/listings/:id', buyerMarketplaceController.getListing);
router.get('/varieties', buyerMarketplaceController.getAvailableVarieties);
router.get('/crops', buyerMarketplaceController.getAvailableCrops);
router.get('/statistics', buyerMarketplaceController.getMarketplaceStatistics);

// Private routes (authentication required)
router.post('/listings/:id/inquiry', auth, buyerMarketplaceController.recordInquiry);

module.exports = router;