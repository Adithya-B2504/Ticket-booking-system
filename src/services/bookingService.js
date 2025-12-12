const pool = require('../config/database');
const { getShowWithLock, calculateAvailableSeats } = require('./showService');

/**
 * Create a booking with transaction safety
 * @param {Object} bookingData - Booking details
 * @returns {Promise<Object>} Booking result with status
 */
async function createBooking({ show_id, user_email, seat_numbers }) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Lock the show row to prevent concurrent modifications
        const show = await getShowWithLock(client, show_id);

        if (!show) {
            await client.query('ROLLBACK');
            return {
                success: false,
                error: 'Show not found',
                statusCode: 404
            };
        }

        // Validate seat numbers
        if (!Array.isArray(seat_numbers) || seat_numbers.length === 0) {
            await client.query('ROLLBACK');
            return {
                success: false,
                error: 'seat_numbers must be a non-empty array',
                statusCode: 400
            };
        }

        const seats_booked = seat_numbers.length;

        // Check if any of the requested seats are already booked
        const bookedSeatsResult = await client.query(
            `SELECT DISTINCT unnest(seat_numbers) as seat_number
             FROM bookings
             WHERE show_id = $1 AND status IN ('PENDING', 'CONFIRMED')`,
            [show_id]
        );

        const alreadyBookedSeats = bookedSeatsResult.rows.map(row => row.seat_number);
        const conflictingSeats = seat_numbers.filter(seat => alreadyBookedSeats.includes(seat));

        if (conflictingSeats.length > 0) {
            await client.query('ROLLBACK');
            return {
                success: false,
                error: `Seats already booked: ${conflictingSeats.join(', ')}`,
                statusCode: 409
            };
        }

        // Validate seat numbers are within range
        const invalidSeats = seat_numbers.filter(seat => seat < 1 || seat > show.total_seats);
        if (invalidSeats.length > 0) {
            await client.query('ROLLBACK');
            return {
                success: false,
                error: `Invalid seat numbers: ${invalidSeats.join(', ')}. Must be between 1 and ${show.total_seats}`,
                statusCode: 400
            };
        }

        // Calculate available seats
        const availableSeats = await calculateAvailableSeats(client, show_id);

        let bookingStatus;
        let message;

        if (availableSeats >= seats_booked) {
            bookingStatus = 'PENDING';
            message = 'Booking pending. Please confirm within 2 minutes.';
        } else {
            bookingStatus = 'FAILED';
            message = `Booking failed. Only ${availableSeats} seats available.`;
        }

        // Insert booking record with seat_numbers
        const bookingResult = await client.query(
            `INSERT INTO bookings (show_id, user_email, seats_booked, seat_numbers, status) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`,
            [show_id, user_email, seats_booked, seat_numbers, bookingStatus]
        );

        await client.query('COMMIT');

        return {
            success: bookingStatus === 'PENDING',
            booking: bookingResult.rows[0],
            message,
            statusCode: 201
        };

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Get booking by ID with show and movie details
 * @param {number} bookingId - Booking ID
 * @returns {Promise<Object|null>} Booking details or null
 */
async function getBookingById(bookingId) {
    const result = await pool.query(
        `SELECT b.*, s.screen_name, s.start_time, m.title as movie_title
         FROM bookings b
         JOIN shows s ON b.show_id = s.id
         JOIN movies m ON s.movie_id = m.id
         WHERE b.id = $1`,
        [bookingId]
    );
    return result.rows[0] || null;
}

/**
 * Get all bookings for a user
 * @param {string} userEmail - User email
 * @returns {Promise<Array>} List of bookings
 */
async function getBookingsByEmail(userEmail) {
    const result = await pool.query(
        `SELECT b.*, s.screen_name, s.start_time, m.title as movie_title
         FROM bookings b
         JOIN shows s ON b.show_id = s.id
         JOIN movies m ON s.movie_id = m.id
         WHERE b.user_email = $1
         ORDER BY b.created_at DESC`,
        [userEmail]
    );
    return result.rows;
}

/**
 * Confirm a pending booking
 * @param {number} bookingId - Booking ID
 * @returns {Promise<Object>} Result with booking or error
 */
async function confirmBooking(bookingId) {
    const result = await pool.query(
        `UPDATE bookings 
         SET status = 'CONFIRMED' 
         WHERE id = $1 AND status = 'PENDING'
         RETURNING *`,
        [bookingId]
    );

    if (result.rows.length === 0) {
        return {
            success: false,
            error: 'Pending booking not found or already processed',
            statusCode: 404
        };
    }

    return {
        success: true,
        booking: result.rows[0],
        message: 'Booking confirmed successfully',
        statusCode: 200
    };
}

/**
 * Cancel a booking
 * @param {number} bookingId - Booking ID
 * @returns {Promise<Object>} Result with booking or error
 */
async function cancelBooking(bookingId) {
    const result = await pool.query(
        `UPDATE bookings 
         SET status = 'CANCELLED' 
         WHERE id = $1 AND status IN ('PENDING', 'CONFIRMED')
         RETURNING *`,
        [bookingId]
    );

    if (result.rows.length === 0) {
        return {
            success: false,
            error: 'Booking not found or cannot be cancelled',
            statusCode: 404
        };
    }

    return {
        success: true,
        booking: result.rows[0],
        message: 'Booking cancelled successfully',
        statusCode: 200
    };
}

/**
 * Expire pending bookings older than specified minutes
 * @param {number} expiryMinutes - Minutes after which to expire
 * @returns {Promise<number>} Number of expired bookings
 */
async function expirePendingBookings(expiryMinutes = 2) {
    const result = await pool.query(
        `UPDATE bookings 
         SET status = 'FAILED'
         WHERE status = 'PENDING' 
           AND created_at < NOW() - INTERVAL '${expiryMinutes} minutes'
         RETURNING id`
    );
    return result.rows.length;
}

/**
 * Get all bookings (admin)
 * @returns {Promise<Array>} List of all bookings
 */
async function getAllBookings() {
    const result = await pool.query(
        `SELECT b.*, s.screen_name, s.start_time, m.title as movie_title
         FROM bookings b
         JOIN shows s ON b.show_id = s.id
         JOIN movies m ON s.movie_id = m.id
         ORDER BY b.created_at DESC`
    );
    return result.rows;
}

/**
 * Get all booked seat numbers for a show
 * @param {number} showId - Show ID
 * @returns {Promise<Array>} Array of booked seat numbers
 */
async function getBookedSeatsForShow(showId) {
    const result = await pool.query(
        `SELECT DISTINCT unnest(seat_numbers) as seat_number
         FROM bookings
         WHERE show_id = $1 AND status IN ('PENDING', 'CONFIRMED')
         ORDER BY seat_number`,
        [showId]
    );
    return result.rows.map(row => row.seat_number);
}

module.exports = {
    createBooking,
    getBookingById,
    getBookingsByEmail,
    confirmBooking,
    cancelBooking,
    expirePendingBookings,
    getAllBookings,
    getBookedSeatsForShow
};
