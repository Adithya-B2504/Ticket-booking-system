const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const {
    validateMovieRequest,
    validateShowRequest,
    validateIdParam
} = require('../middleware/validator');

// Movie routes
router.post('/movies', validateMovieRequest, adminController.createMovie);
router.get('/movies', adminController.getAllMovies);
router.patch('/movies/:id', validateIdParam, adminController.updateMovie);
router.delete('/movies/:id', validateIdParam, adminController.deleteMovie);

// Show routes
router.post('/shows', validateShowRequest, adminController.createShow);
router.get('/shows', adminController.getAllShows);
router.patch('/shows/:id', validateIdParam, adminController.updateShow);
router.delete('/shows/:id', validateIdParam, adminController.deleteShow);

// Booking routes (admin view)
router.get('/bookings', adminController.getAllBookings);

module.exports = router;
