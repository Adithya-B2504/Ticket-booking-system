const pool = require('../db');

async function expirePendingBookings() {
    try {
        const result = await pool.query(`
      UPDATE bookings 
      SET status = 'FAILED'
      WHERE status = 'PENDING' 
        AND created_at < NOW() - INTERVAL '2 minutes'
      RETURNING id
    `);

        if (result.rows.length > 0) {
            console.log(`Expired ${result.rows.length} pending bookings`);
        }
    } catch (err) {
        console.error('Error expiring bookings:', err);
    }
}

// Run every 30 seconds
function startExpiryWorker() {
    setInterval(expirePendingBookings, 30000);
    console.log('Booking expiry worker started');
}

module.exports = { startExpiryWorker };
