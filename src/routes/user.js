const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const bookingController = require('../controllers/bookingController');
const {
    validateBookingRequest,
    validateIdParam
} = require('../middleware/validator');

// Show routes (user view)
router.get('/shows', userController.getAvailableShows);
router.get('/shows/:id', validateIdParam, userController.getShowById);

// Booking routes
router.post('/shows/:id/book', validateIdParam, validateBookingRequest, bookingController.createBooking);
router.get('/bookings/:id', validateIdParam, userController.getBookingById);
router.get('/bookings', userController.getUserBookings);
router.patch('/bookings/:id/confirm', validateIdParam, bookingController.confirmBooking);
router.patch('/bookings/:id/cancel', validateIdParam, bookingController.cancelBooking);

module.exports = router;
