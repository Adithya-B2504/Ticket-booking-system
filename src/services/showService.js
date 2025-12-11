const pool = require('../config/database');

/**
 * Create a new show
 * @param {Object} showData - Show details
 * @returns {Promise<Object>} Created show
 */
async function createShow({ movie_id, screen_name, start_time, total_seats }) {
    const result = await pool.query(
        'INSERT INTO shows (movie_id, screen_name, start_time, total_seats) VALUES ($1, $2, $3, $4) RETURNING *',
        [movie_id, screen_name, start_time, total_seats]
    );
    return result.rows[0];
}

/**
 * Get all shows with movie details (Admin view)
 * @returns {Promise<Array>} List of shows
 */
async function getAllShowsWithMovies() {
    const result = await pool.query(`
        SELECT s.*, m.title as movie_title, m.description, m.duration_minutes
        FROM shows s
        JOIN movies m ON s.movie_id = m.id
        ORDER BY s.start_time
    `);
    return result.rows;
}

/**
 * Get available shows for users (future shows with seat availability)
 * @returns {Promise<Array>} List of available shows
 */
async function getAvailableShows() {
    const result = await pool.query(`
        SELECT 
            s.id,
            s.screen_name,
            s.start_time,
            s.total_seats,
            m.title as movie_title,
            m.description,
            m.duration_minutes,
            COALESCE(SUM(CASE WHEN b.status = 'CONFIRMED' THEN b.seats_booked ELSE 0 END), 0) as booked_seats,
            s.total_seats - COALESCE(SUM(CASE WHEN b.status = 'CONFIRMED' THEN b.seats_booked ELSE 0 END), 0) as available_seats
        FROM shows s
        JOIN movies m ON s.movie_id = m.id
        LEFT JOIN bookings b ON s.id = b.show_id
        WHERE s.start_time > NOW()
        GROUP BY s.id, m.id
        ORDER BY s.start_time
    `);
    return result.rows;
}

/**
 * Get show by ID
 * @param {number} showId - Show ID
 * @returns {Promise<Object|null>} Show or null
 */
async function getShowById(showId) {
    const result = await pool.query('SELECT * FROM shows WHERE id = $1', [showId]);
    return result.rows[0] || null;
}

/**
 * Get show with lock (for booking transactions)
 * @param {Object} client - Database client
 * @param {number} showId - Show ID
 * @returns {Promise<Object|null>} Locked show or null
 */
async function getShowWithLock(client, showId) {
    const result = await client.query(
        'SELECT * FROM shows WHERE id = $1 FOR UPDATE',
        [showId]
    );
    return result.rows[0] || null;
}

/**
 * Calculate available seats for a show
 * @param {Object} client - Database client
 * @param {number} showId - Show ID
 * @returns {Promise<number>} Number of available seats
 */
async function calculateAvailableSeats(client, showId) {
    const bookedResult = await client.query(
        `SELECT COALESCE(SUM(seats_booked), 0) as total_booked 
         FROM bookings 
         WHERE show_id = $1 AND status = 'CONFIRMED'`,
        [showId]
    );

    const showResult = await client.query(
        'SELECT total_seats FROM shows WHERE id = $1',
        [showId]
    );

    if (showResult.rows.length === 0) {
        return 0;
    }

    const totalSeats = showResult.rows[0].total_seats;
    const totalBooked = parseInt(bookedResult.rows[0].total_booked);

    return totalSeats - totalBooked;
}

/**
 * Update show details
 * @param {number} showId - Show ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object|null>} Updated show or null
 */
async function updateShow(showId, updates) {
    const { screen_name, start_time, total_seats } = updates;
    const result = await pool.query(
        `UPDATE shows 
         SET screen_name = COALESCE($1, screen_name),
             start_time = COALESCE($2, start_time),
             total_seats = COALESCE($3, total_seats)
         WHERE id = $4
         RETURNING *`,
        [screen_name, start_time, total_seats, showId]
    );
    return result.rows[0] || null;
}

/**
 * Delete show
 * @param {number} showId - Show ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteShow(showId) {
    const result = await pool.query('DELETE FROM shows WHERE id = $1 RETURNING id', [showId]);
    return result.rows.length > 0;
}

module.exports = {
    createShow,
    getAllShowsWithMovies,
    getAvailableShows,
    getShowById,
    getShowWithLock,
    calculateAvailableSeats,
    updateShow,
    deleteShow
};
