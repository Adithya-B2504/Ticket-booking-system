/**
 * Validation middleware for common input patterns
 */

/**
 * Validate email format
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate positive integer
 */
function validatePositiveInteger(value) {
    const num = parseInt(value);
    return !isNaN(num) && num > 0 && Number.isInteger(num);
}

/**
 * Validate date is in the future
 */
function validateFutureDate(dateString) {
    const date = new Date(dateString);
    return date > new Date();
}

/**
 * Middleware to validate booking request
 */
function validateBookingRequest(req, res, next) {
    const { user_email, seat_numbers } = req.body;

    if (!user_email) {
        return res.status(400).json({ error: 'user_email is required' });
    }

    if (!validateEmail(user_email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!seat_numbers) {
        return res.status(400).json({ error: 'seat_numbers is required' });
    }

    if (!Array.isArray(seat_numbers)) {
        return res.status(400).json({ error: 'seat_numbers must be an array' });
    }

    if (seat_numbers.length === 0) {
        return res.status(400).json({ error: 'seat_numbers cannot be empty' });
    }

    if (seat_numbers.length > 10) {
        return res.status(400).json({ error: 'Cannot book more than 10 seats at once' });
    }

    // Validate each seat number is a positive integer
    for (const seat of seat_numbers) {
        if (!validatePositiveInteger(seat)) {
            return res.status(400).json({ error: 'All seat numbers must be positive integers' });
        }
    }

    next();
}

/**
 * Middleware to validate movie creation
 */
function validateMovieRequest(req, res, next) {
    const { title, duration_minutes } = req.body;

    if (!title || title.trim().length === 0) {
        return res.status(400).json({ error: 'title is required and cannot be empty' });
    }

    if (title.length > 200) {
        return res.status(400).json({ error: 'title cannot exceed 200 characters' });
    }

    if (!duration_minutes) {
        return res.status(400).json({ error: 'duration_minutes is required' });
    }

    if (!validatePositiveInteger(duration_minutes)) {
        return res.status(400).json({ error: 'duration_minutes must be a positive integer' });
    }

    if (duration_minutes > 500) {
        return res.status(400).json({ error: 'duration_minutes seems unrealistic (max 500)' });
    }

    next();
}

/**
 * Middleware to validate show creation
 */
function validateShowRequest(req, res, next) {
    const { movie_id, screen_name, start_time, total_seats } = req.body;

    if (!movie_id) {
        return res.status(400).json({ error: 'movie_id is required' });
    }

    if (!validatePositiveInteger(movie_id)) {
        return res.status(400).json({ error: 'movie_id must be a positive integer' });
    }

    if (!screen_name || screen_name.trim().length === 0) {
        return res.status(400).json({ error: 'screen_name is required and cannot be empty' });
    }

    if (!start_time) {
        return res.status(400).json({ error: 'start_time is required' });
    }

    if (!validateFutureDate(start_time)) {
        return res.status(400).json({ error: 'start_time must be in the future' });
    }

    if (!total_seats) {
        return res.status(400).json({ error: 'total_seats is required' });
    }

    if (!validatePositiveInteger(total_seats)) {
        return res.status(400).json({ error: 'total_seats must be a positive integer' });
    }

    if (total_seats > 1000) {
        return res.status(400).json({ error: 'total_seats cannot exceed 1000' });
    }

    next();
}

/**
 * Middleware to validate ID parameter
 */
function validateIdParam(req, res, next) {
    const id = parseInt(req.params.id);

    if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid ID parameter' });
    }

    next();
}

module.exports = {
    validateBookingRequest,
    validateMovieRequest,
    validateShowRequest,
    validateIdParam,
    validateEmail,
    validatePositiveInteger,
    validateFutureDate
};
