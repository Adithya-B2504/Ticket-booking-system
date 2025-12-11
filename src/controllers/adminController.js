const movieService = require('../services/movieService');
const showService = require('../services/showService');
const bookingService = require('../services/bookingService');

/**
 * Create a new movie
 */
async function createMovie(req, res, next) {
    try {
        const { title, description, duration_minutes } = req.body;

        if (!title || !duration_minutes) {
            return res.status(400).json({
                error: 'title and duration_minutes are required'
            });
        }

        const movie = await movieService.createMovie({
            title,
            description,
            duration_minutes
        });

        res.status(201).json(movie);
    } catch (err) {
        next(err);
    }
}

/**
 * Get all movies
 */
async function getAllMovies(req, res, next) {
    try {
        const movies = await movieService.getAllMovies();
        res.json(movies);
    } catch (err) {
        next(err);
    }
}

/**
 * Create a new show
 */
async function createShow(req, res, next) {
    try {
        const { movie_id, screen_name, start_time, total_seats } = req.body;

        if (!movie_id || !screen_name || !start_time || !total_seats) {
            return res.status(400).json({
                error: 'All fields (movie_id, screen_name, start_time, total_seats) are required'
            });
        }

        if (total_seats <= 0) {
            return res.status(400).json({
                error: 'total_seats must be positive'
            });
        }

        const show = await showService.createShow({
            movie_id,
            screen_name,
            start_time,
            total_seats
        });

        res.status(201).json(show);
    } catch (err) {
        next(err);
    }
}

/**
 * Get all shows with movie details (Admin view)
 */
async function getAllShows(req, res, next) {
    try {
        const shows = await showService.getAllShowsWithMovies();
        res.json(shows);
    } catch (err) {
        next(err);
    }
}

/**
 * Get all bookings (Admin view)
 */
async function getAllBookings(req, res, next) {
    try {
        const bookings = await bookingService.getAllBookings();
        res.json(bookings);
    } catch (err) {
        next(err);
    }
}

/**
 * Update a movie
 */
async function updateMovie(req, res, next) {
    try {
        const movieId = parseInt(req.params.id);
        const updates = req.body;

        const movie = await movieService.updateMovie(movieId, updates);

        if (!movie) {
            return res.status(404).json({ error: 'Movie not found' });
        }

        res.json(movie);
    } catch (err) {
        next(err);
    }
}

/**
 * Delete a movie
 */
async function deleteMovie(req, res, next) {
    try {
        const movieId = parseInt(req.params.id);
        const success = await movieService.deleteMovie(movieId);

        if (!success) {
            return res.status(404).json({ error: 'Movie not found' });
        }

        res.json({ message: 'Movie deleted successfully' });
    } catch (err) {
        next(err);
    }
}

/**
 * Update a show
 */
async function updateShow(req, res, next) {
    try {
        const showId = parseInt(req.params.id);
        const updates = req.body;

        const show = await showService.updateShow(showId, updates);

        if (!show) {
            return res.status(404).json({ error: 'Show not found' });
        }

        res.json(show);
    } catch (err) {
        next(err);
    }
}

/**
 * Delete a show
 */
async function deleteShow(req, res, next) {
    try {
        const showId = parseInt(req.params.id);
        const success = await showService.deleteShow(showId);

        if (!success) {
            return res.status(404).json({ error: 'Show not found' });
        }

        res.json({ message: 'Show deleted successfully' });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    createMovie,
    getAllMovies,
    createShow,
    getAllShows,
    getAllBookings,
    updateMovie,
    deleteMovie,
    updateShow,
    deleteShow
};
