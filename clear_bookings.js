require('dotenv').config();
const pool = require('./src/config/database');

async function clearBookings() {
    try {
        console.log('Clearing all bookings...');
        await pool.query('DELETE FROM bookings');
        console.log('All bookings deleted successfully! 🎉');

        // Reset sequence if needed (optional)
        // await pool.query('ALTER SEQUENCE bookings_id_seq RESTART WITH 1');

    } catch (err) {
        console.error('Error clearing bookings:', err);
    } finally {
        pool.end();
    }
}

clearBookings();
