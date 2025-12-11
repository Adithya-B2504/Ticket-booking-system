const pool = require('../config/database');

/**
 * Create a new movie
 * @param {Object} movieData - Movie details
 * @returns {Promise<Object>} Created movie
 */
async function createMovie({ title, description, duration_minutes }) {
    const result = await pool.query(
        'INSERT INTO movies (title, description, duration_minutes) VALUES ($1, $2, $3) RETURNING *',
        [title, description || null, duration_minutes]
    );
    return result.rows[0];
}

/**
 * Get all movies
 * @returns {Promise<Array>} List of movies
 */
async function getAllMovies() {
    const result = await pool.query('SELECT * FROM movies ORDER BY created_at DESC');
    return result.rows;
}

/**
 * Get movie by ID
 * @param {number} movieId - Movie ID
 * @returns {Promise<Object|null>} Movie or null
 */
async function getMovieById(movieId) {
    const result = await pool.query('SELECT * FROM movies WHERE id = $1', [movieId]);
    return result.rows[0] || null;
}

/**
 * Update movie
 * @param {number} movieId - Movie ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object|null>} Updated movie or null
 */
async function updateMovie(movieId, updates) {
    const { title, description, duration_minutes } = updates;
    const result = await pool.query(
        `UPDATE movies 
         SET title = COALESCE($1, title),
             description = COALESCE($2, description),
             duration_minutes = COALESCE($3, duration_minutes)
         WHERE id = $4
         RETURNING *`,
        [title, description, duration_minutes, movieId]
    );
    return result.rows[0] || null;
}

/**
 * Delete movie
 * @param {number} movieId - Movie ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteMovie(movieId) {
    const result = await pool.query('DELETE FROM movies WHERE id = $1 RETURNING id', [movieId]);
    return result.rows.length > 0;
}

module.exports = {
    createMovie,
    getAllMovies,
    getMovieById,
    updateMovie,
    deleteMovie
};
