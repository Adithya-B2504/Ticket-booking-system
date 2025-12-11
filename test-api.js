#!/usr/bin/env node

/**
 * API Test Script for Modex
 * Tests all major endpoints
 */

const BASE_URL = 'http://localhost:3000';

async function makeRequest(method, path, body = null) {
    const url = `${BASE_URL}${path}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);
        const data = await response.json();

        console.log(`\n${method} ${path}`);
        console.log(`Status: ${response.status}`);
        console.log('Response:', JSON.stringify(data, null, 2));

        return { status: response.status, data };
    } catch (error) {
        console.error(`Error: ${error.message}`);
        return { error: error.message };
    }
}

async function runTests() {
    console.log('='.repeat(60));
    console.log('MODEX API TEST SUITE');
    console.log('='.repeat(60));

    // 1. Health Check
    console.log('\n--- 1. Health Check ---');
    await makeRequest('GET', '/health');

    // 2. Create a Movie
    console.log('\n--- 2. Create Movie ---');
    const movieResult = await makeRequest('POST', '/admin/movies', {
        title: 'Inception',
        description: 'A mind-bending thriller by Christopher Nolan',
        duration_minutes: 148
    });
    const movieId = movieResult.data?.id;

    // 3. Get All Movies
    console.log('\n--- 3. Get All Movies ---');
    await makeRequest('GET', '/admin/movies');

    // 4. Create a Show
    console.log('\n--- 4. Create Show ---');
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const showResult = await makeRequest('POST', '/admin/shows', {
        movie_id: movieId,
        screen_name: 'Screen 1',
        start_time: futureDate,
        total_seats: 100
    });
    const showId = showResult.data?.id;

    // 5. Get Available Shows (User View)
    console.log('\n--- 5. Get Available Shows (User) ---');
    await makeRequest('GET', '/shows');

    // 6. Book Seats
    console.log('\n--- 6. Book Seats ---');
    const bookingResult = await makeRequest('POST', `/shows/${showId}/book`, {
        user_email: 'john@example.com',
        seats_booked: 2
    });
    const bookingId = bookingResult.data?.booking?.id;

    // 7. Get Booking Details
    console.log('\n--- 7. Get Booking Details ---');
    await makeRequest('GET', `/bookings/${bookingId}`);

    // 8. Confirm Booking
    console.log('\n--- 8. Confirm Booking ---');
    await makeRequest('PATCH', `/bookings/${bookingId}/confirm`);

    // 9. Get User Bookings
    console.log('\n--- 9. Get User Bookings ---');
    await makeRequest('GET', '/bookings?email=john@example.com');

    // 10. Get All Bookings (Admin)
    console.log('\n--- 10. Get All Bookings (Admin) ---');
    await makeRequest('GET', '/admin/bookings');

    // 11. Test Validation Error
    console.log('\n--- 11. Test Validation (Invalid Email) ---');
    await makeRequest('POST', `/shows/${showId}/book`, {
        user_email: 'invalid-email',
        seats_booked: 2
    });

    // 12. Test Overbooking
    console.log('\n--- 12. Test Overbooking ---');
    await makeRequest('POST', `/shows/${showId}/book`, {
        user_email: 'jane@example.com',
        seats_booked: 150
    });

    console.log('\n' + '='.repeat(60));
    console.log('TEST SUITE COMPLETED');
    console.log('='.repeat(60));
}

// Run tests
runTests().catch(console.error);
