const showService = require('../services/showService');
const bookingService = require('../services/bookingService');

/**
 * Get all available shows for users
 */
async function getAvailableShows(req, res, next) {
    try {
        const shows = await showService.getAvailableShows();
        res.json(shows);
    } catch (err) {
        next(err);
    }
}

/**
 * Get show details by ID
 */
async function getShowById(req, res, next) {
    try {
        const showId = parseInt(req.params.id);
        const show = await showService.getShowById(showId);

        if (!show) {
            return res.status(404).json({ error: 'Show not found' });
        }

        res.json(show);
    } catch (err) {
        next(err);
    }
}

/**
 * Get booking details by ID
 */
async function getBookingById(req, res, next) {
    try {
        const bookingId = parseInt(req.params.id);
        const booking = await bookingService.getBookingById(bookingId);

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        res.json(booking);
    } catch (err) {
        next(err);
    }
}

/**
 * Get all bookings for a user by email
 */
async function getUserBookings(req, res, next) {
    try {
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({ error: 'email query parameter is required' });
        }

        const bookings = await bookingService.getBookingsByEmail(email);
        res.json(bookings);
    } catch (err) {
        next(err);
    }
}

/**
 * Get booked seats for a show
 */
async function getBookedSeats(req, res, next) {
    try {
        const showId = parseInt(req.params.id);
        const bookedSeats = await bookingService.getBookedSeatsForShow(showId);
        res.json({ booked_seats: bookedSeats });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getAvailableShows,
    getShowById,
    getBookingById,
    getUserBookings,
    getBookedSeats
};
