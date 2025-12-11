const express = require('express');
const pool = require('../db');
const router = express.Router();

// POST /admin/movies - Create a movie
router.post('/movies', async (req, res) => {
    const { title, description, duration_minutes } = req.body;

    if (!title || !duration_minutes) {
        return res.status(400).json({ error: 'title and duration_minutes are required' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO movies (title, description, duration_minutes) VALUES ($1, $2, $3) RETURNING *',
            [title, description || null, duration_minutes]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating movie:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /admin/shows - Create a show
router.post('/shows', async (req, res) => {
    const { movie_id, screen_name, start_time, total_seats } = req.body;

    if (!movie_id || !screen_name || !start_time || !total_seats) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (total_seats <= 0) {
        return res.status(400).json({ error: 'total_seats must be positive' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO shows (movie_id, screen_name, start_time, total_seats) VALUES ($1, $2, $3, $4) RETURNING *',
            [movie_id, screen_name, start_time, total_seats]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating show:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /admin/shows - List all shows with movie details
router.get('/shows', async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT s.*, m.title as movie_title, m.description, m.duration_minutes
      FROM shows s
      JOIN movies m ON s.movie_id = m.id
      ORDER BY s.start_time
    `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching shows:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
