const express = require('express');
const { check } = require('express-validator');
const bookingController = require('../controllers/bookingController');
const { protect, authorize } = require('@agrimaan/shared').middleware;


const router = express.Router();

// All booking routes require authentication
router.use(protect);

// Booking CRUD
router.get('/', bookingController.getAllBookings);
router.get('/:id', bookingController.getBookingById);

router.post('/', [
  check('resource', 'Resource ID is required').not().isEmpty(),
  check('startDate', 'Start date is required').isISO8601(),
  check('endDate', 'End date is required').isISO8601()
], bookingController.createBooking);

router.put('/:id/status', [
  check('status', 'Status is required').isIn(['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'Rejected'])
], bookingController.updateBookingStatus);

router.put('/:id/cancel', bookingController.cancelBooking);

// Get bookings by user or resource
router.get('/user/:userId', bookingController.getUserBookings);
router.get('/resource/:resourceId', bookingController.getResourceBookings);

// Blockchain
router.post('/:id/blockchain', bookingController.registerOnBlockchain);

module.exports = router;
