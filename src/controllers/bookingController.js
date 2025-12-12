const bookingService = require('../services/bookingService');

/**
 * Create a new booking
 */
async function createBooking(req, res, next) {
    try {
        const showId = parseInt(req.params.id);
        const { user_email, seat_numbers } = req.body;

        if (!user_email || !seat_numbers) {
            return res.status(400).json({
                error: 'user_email and seat_numbers are required'
            });
        }

        if (!Array.isArray(seat_numbers) || seat_numbers.length === 0) {
            return res.status(400).json({
                error: 'seat_numbers must be a non-empty array'
            });
        }

        const result = await bookingService.createBooking({
            show_id: showId,
            user_email,
            seat_numbers
        });

        if (!result.success) {
            return res.status(result.statusCode).json({ error: result.error });
        }

        res.status(result.statusCode).json({
            booking: result.booking,
            message: result.message
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Confirm a pending booking
 */
async function confirmBooking(req, res, next) {
    try {
        const bookingId = parseInt(req.params.id);
        const result = await bookingService.confirmBooking(bookingId);

        if (!result.success) {
            return res.status(result.statusCode).json({ error: result.error });
        }

        res.status(result.statusCode).json({
            booking: result.booking,
            message: result.message
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Cancel a booking
 */
async function cancelBooking(req, res, next) {
    try {
        const bookingId = parseInt(req.params.id);
        const result = await bookingService.cancelBooking(bookingId);

        if (!result.success) {
            return res.status(result.statusCode).json({ error: result.error });
        }

        res.status(result.statusCode).json({
            booking: result.booking,
            message: result.message
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    createBooking,
    confirmBooking,
    cancelBooking
};
