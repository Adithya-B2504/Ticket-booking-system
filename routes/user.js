const express = require('express');
const pool = require('../db');
const router = express.Router();

// GET /shows - List all available shows with remaining seats
router.get('/shows', async (req, res) => {
    try {
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
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching shows:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /shows/:id/book - Book seats for a show
router.post('/shows/:id/book', async (req, res) => {
    const showId = parseInt(req.params.id);
    const { user_email, seats_booked } = req.body;

    if (!user_email || !seats_booked) {
        return res.status(400).json({ error: 'user_email and seats_booked are required' });
    }

    if (seats_booked <= 0) {
        return res.status(400).json({ error: 'seats_booked must be positive' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Lock the show row to prevent concurrent modifications
        const showResult = await client.query(
            'SELECT * FROM shows WHERE id = $1 FOR UPDATE',
            [showId]
        );

        if (showResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Show not found' });
        }

        const show = showResult.rows[0];

        // Calculate currently booked seats
        const bookedResult = await client.query(
            `SELECT COALESCE(SUM(seats_booked), 0) as total_booked 
       FROM bookings 
       WHERE show_id = $1 AND status = 'CONFIRMED'`,
            [showId]
        );

        const totalBooked = parseInt(bookedResult.rows[0].total_booked);
        const availableSeats = show.total_seats - totalBooked;

        let bookingStatus;
        if (availableSeats >= seats_booked) {
            bookingStatus = 'PENDING';  // Start as PENDING instead of CONFIRMED
        } else {
            bookingStatus = 'FAILED';
        }

        // Insert booking record
        const bookingResult = await client.query(
            `INSERT INTO bookings (show_id, user_email, seats_booked, status) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
            [showId, user_email, seats_booked, bookingStatus]
        );

        await client.query('COMMIT');

        res.status(201).json({
            booking: bookingResult.rows[0],
            message: bookingStatus === 'PENDING'
                ? 'Booking pending. Will confirm within 2 minutes.'
                : `Booking failed. Only ${availableSeats} seats available`
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error booking seats:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

// GET /bookings/:id - Get booking status
router.get('/bookings/:id', async (req, res) => {
    const bookingId = parseInt(req.params.id);

    try {
        const result = await pool.query(
            `SELECT b.*, s.screen_name, s.start_time, m.title as movie_title
       FROM bookings b
       JOIN shows s ON b.show_id = s.id
       JOIN movies m ON s.movie_id = m.id
       WHERE b.id = $1`,
            [bookingId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching booking:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PATCH /bookings/:id/confirm - Confirm a pending booking
router.patch('/bookings/:id/confirm', async (req, res) => {
    const bookingId = parseInt(req.params.id);

    try {
        const result = await pool.query(
            `UPDATE bookings 
       SET status = 'CONFIRMED' 
       WHERE id = $1 AND status = 'PENDING'
       RETURNING *`,
            [bookingId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pending booking not found' });
        }

        res.json({ booking: result.rows[0], message: 'Booking confirmed' });
    } catch (err) {
        console.error('Error confirming booking:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
