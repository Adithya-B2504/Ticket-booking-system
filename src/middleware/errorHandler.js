/**
 * Global error handling middleware
 * Catches all errors and sends appropriate responses
 */
function errorHandler(err, req, res, next) {
    // Log error for debugging
    console.error('Error occurred:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        body: req.body,
        timestamp: new Date().toISOString()
    });

    // Database errors
    if (err.code) {
        switch (err.code) {
            case '23505': // Unique violation
                return res.status(409).json({
                    error: 'Duplicate entry',
                    details: err.detail
                });
            case '23503': // Foreign key violation
                return res.status(400).json({
                    error: 'Referenced resource does not exist',
                    details: err.detail
                });
            case '23502': // Not null violation
                return res.status(400).json({
                    error: 'Required field missing',
                    details: err.detail
                });
            case '22P02': // Invalid text representation
                return res.status(400).json({
                    error: 'Invalid data format',
                    details: err.message
                });
        }
    }

    // Validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation failed',
            details: err.message
        });
    }

    // Default to 500 server error
    res.status(err.statusCode || 500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
}

/**
 * 404 Not Found handler
 */
function notFoundHandler(req, res) {
    res.status(404).json({
        error: 'Route not found',
        path: req.path,
        method: req.method
    });
}

module.exports = {
    errorHandler,
    notFoundHandler
};
