const express = require('express');
const router = express.Router();
const {
    createBooking,
    getBookings,
    getBooking,
    updateBooking,
    updateBookingStatus,
    deleteBooking,
    trackBooking,
    getBookingStats
} = require('../../booking/booking.controller');

// Import middleware (you'll need to create these)
const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes
router.get('/track/:trackingNumber', trackBooking);

// Protected routes (require authentication)
router.use(protect); // All routes below this require authentication

// Routes for all authenticated users
router.route('/')
    .post(createBooking)
    .get(getBookings);

router.get('/stats', getBookingStats);

router.route('/:id')
    .get(getBooking)
    .put(updateBooking)
    .delete(deleteBooking);

// Admin only route
router.patch('/:id/status', authorize('admin'), updateBookingStatus);

module.exports = router;