require('dotenv').config();
const pool = require('./src/config/database');

async function checkBookings() {
    try {
        console.log('Checking all bookings...');
        const res = await pool.query(`
            SELECT id, show_id, user_email, seats_booked, status, created_at, seat_numbers 
            FROM bookings 
            ORDER BY created_at DESC
        `);

        console.log('Total bookings found:', res.rows.length);
        console.log(JSON.stringify(res.rows, null, 2));

        const countRes = await pool.query(`
            SELECT status, SUM(seats_booked) as total_seats
            FROM bookings
            GROUP BY status
        `);
        console.log('Seat counts by status:');
        console.log(JSON.stringify(countRes.rows, null, 2));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
}

checkBookings();
