const express = require('express');
const adminRoutes = require('./admin');
const userRoutes = require('./user');

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Mount routes
router.use('/admin', adminRoutes);
router.use('/', userRoutes);

module.exports = router;
