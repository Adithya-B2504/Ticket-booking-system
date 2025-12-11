const { expirePendingBookings } = require('../services/bookingService');

/**
 * Background worker to expire pending bookings
 */
async function expireBookingsJob() {
    try {
        const expiredCount = await expirePendingBookings(2); // 2 minutes expiry

        if (expiredCount > 0) {
            console.log(`[${new Date().toISOString()}] Expired ${expiredCount} pending booking(s)`);
        }
    } catch (err) {
        console.error('[Expiry Worker Error]', err.message);
    }
}

/**
 * Start the expiry worker
 * Runs every 30 seconds
 */
function startExpiryWorker() {
    // Run immediately on startup
    expireBookingsJob();

    // Then run every 30 seconds
    setInterval(expireBookingsJob, 30000);

    console.log('✓ Booking expiry worker started (runs every 30 seconds)');
}

/**
 * Stop the expiry worker (for graceful shutdown)
 */
function stopExpiryWorker(intervalId) {
    if (intervalId) {
        clearInterval(intervalId);
        console.log('✓ Booking expiry worker stopped');
    }
}

module.exports = {
    startExpiryWorker,
    stopExpiryWorker,
    expireBookingsJob
};
