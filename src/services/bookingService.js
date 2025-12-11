const pool = require('../config/database');
const { getShowWithLock, calculateAvailableSeats } = require('./showService');

/**
 * Create a booking with transaction safety
 * @param {Object} bookingData - Booking details
 * @returns {Promise<Object>} Booking result with status
 */
async function createBooking({ show_id, user_email, seats_booked }) {
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

        // Insert booking record
        const bookingResult = await client.query(
            `INSERT INTO bookings (show_id, user_email, seats_booked, status) 
             VALUES ($1, $2, $3, $4) 
             RETURNING *`,
            [show_id, user_email, seats_booked, bookingStatus]
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

module.exports = {
    createBooking,
    getBookingById,
    getBookingsByEmail,
    confirmBooking,
    cancelBooking,
    expirePendingBookings,
    getAllBookings
};
