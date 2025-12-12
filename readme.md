# Modex Cinema - Backend 🔧

The server-side application for the Modex Cinema Booking System. It handles data persistence, business logic, validation, and concurrency control for ticket bookings.

## 🚀 Key Features

*   **RESTful API**: Endpoints for shows, movies, and bookings.
*   **Concurrency Control**: Uses PostgreSQL **Row-Level Locking** (`FOR UPDATE`) to prevent race conditions (double bookings) when multiple users try to book the same seat simultaneously.
*   **Seat Management**: Tracks specific seat numbers for every booking.
*   **Validation**: Robust middleware for validating booking requests (email format, seat limits, range checks).
*   **Database**: PostgreSQL relational schema for data integrity.

## 🛠️ Tech Stack

*   **Node.js**: Runtime environment
*   **Express.js**: Web framework
*   **PostgreSQL**: Database
*   **pg (node-postgres)**: Database client
*   **dotenv**: Environment variable management

## 🏁 Getting Started

### Prerequisites

*   Node.js (v14+)
*   PostgreSQL installed and running

### Installation

1.  Navigate to the directory:
    ```bash
    cd modex-backend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  **Configuration**:
    Create a `.env` file in the `modex-backend` root:
    ```env
    PORT=3000
    DATABASE_URL=postgresql://user:password@localhost:5432/modex_db
    NODE_ENV=development
    ```

4.  Start the server:
    ```bash
    npm run dev
    ```
    Runs on [http://localhost:3000](http://localhost:3000).

## 🔌 API Documentation

### Shows
*   `GET /shows` - List all available future shows.
*   `GET /shows/:id` - Get details for a specific show.
*   `GET /shows/:id/booked-seats` - Get list of seat numbers that are already booked (`CONFIRMED` or `PENDING`).

### Bookings
*   `POST /shows/:id/book` - Create a new booking.
    *   **Body**: `{ "user_email": "...", "seat_numbers": [1, 2] }`
*   `GET /bookings/:id` - Get details of a successful booking.

### Admin
*   `POST /admin/movies` - Add a new movie.
*   `POST /admin/shows` - Schedule a new show.

## 💾 Database Schema

*   **movies**: Stores movie metadata (title, duration).
*   **shows**: Link movies to screens and times.
*   **bookings**: Stores user bookings, including an array of `seat_numbers`.

## 🧪 Development Utilities

*   **Clear Bookings**: To reset the booking data for testing:
    ```bash
    node clear_bookings.js
    ```