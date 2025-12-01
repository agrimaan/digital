
const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const {
  createInquiry,
  getBuyerInquiries,
  getFarmerInquiries,
  getInquiry,
  respondToInquiry,
  markInquiryAsRead,
  getFarmerInquiryStats,
  getBuyerInquiryStats,
  closeInquiry
} = require('../controllers/inquiryController');
const { protect } = require('../middleware/auth');

// Validation middleware
const validateInquiryCreation = [
  check('listing', 'Listing ID is required').not().isEmpty(),
  check('farmer', 'Farmer ID is required').not().isEmpty(),
  check('cropName', 'Crop name is required').not().isEmpty(),
  check('message', 'Message is required').not().isEmpty()
];

const validateResponse = [
  check('message', 'Response message is required').not().isEmpty()
];

// All routes require authentication
router.use(protect);

// Buyer routes
router.post('/', validateInquiryCreation, createInquiry);
router.get('/buyer', getBuyerInquiries);
router.get('/buyer/stats', getBuyerInquiryStats);

// Farmer routes
router.get('/farmer', getFarmerInquiries);
router.get('/farmer/stats', getFarmerInquiryStats);
router.post('/:id/respond', validateResponse, respondToInquiry);
router.put('/:id/read', markInquiryAsRead);

// Common routes (buyer or farmer)
router.get('/:id', getInquiry);
router.put('/:id/close', closeInquiry);

module.exports = router;
