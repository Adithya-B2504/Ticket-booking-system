# Modex - Movie Ticket Booking System

A production-ready movie ticket booking REST API built with Node.js, Express, and PostgreSQL. Features include seat availability management, concurrent booking handling with row-level locking, and automatic expiry of pending bookings.

## 🏗️ Architecture

This project follows a clean, layered architecture:

```
modex/
├── src/
│   ├── config/          # Configuration files (database, etc.)
│   ├── controllers/     # Request handlers (business logic orchestration)
│   ├── services/        # Business logic (reusable operations)
│   ├── routes/          # API route definitions
│   ├── middleware/      # Express middleware (validation, error handling)
│   ├── workers/         # Background jobs (booking expiry)
│   └── app.js           # Express app setup
├── index.js             # Application entry point
├── .env                 # Environment variables (not in git)
├── package.json         # Dependencies and scripts
└── README.md            # This file
```

## 🚀 Features

- **Movie Management**: CRUD operations for movies
- **Show Management**: Create and manage movie shows with seat capacity
- **Booking System**: 
  - Concurrent booking handling with PostgreSQL row-level locking
  - Prevents double-booking
  - PENDING → CONFIRMED booking flow
  - Automatic expiry of unconfirmed bookings (2 minutes)
- **Seat Availability**: Real-time seat availability calculation
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Centralized error handling with detailed responses
- **Background Worker**: Automatic cleanup of expired bookings

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd modex
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/modex
   PORT=3000
   NODE_ENV=development
   ```

4. **Set up the database**
   
   Create the PostgreSQL database and tables:
   ```sql
   CREATE DATABASE modex;

   \c modex

   CREATE TABLE movies (
       id SERIAL PRIMARY KEY,
       title VARCHAR(200) NOT NULL,
       description TEXT,
       duration_minutes INTEGER NOT NULL,
       created_at TIMESTAMP DEFAULT NOW()
   );

   CREATE TABLE shows (
       id SERIAL PRIMARY KEY,
       movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
       screen_name VARCHAR(100) NOT NULL,
       start_time TIMESTAMP NOT NULL,
       total_seats INTEGER NOT NULL CHECK (total_seats > 0),
       created_at TIMESTAMP DEFAULT NOW()
   );

   CREATE TABLE bookings (
       id SERIAL PRIMARY KEY,
       show_id INTEGER REFERENCES shows(id) ON DELETE CASCADE,
       user_email VARCHAR(255) NOT NULL,
       seats_booked INTEGER NOT NULL CHECK (seats_booked > 0),
       status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED')),
       created_at TIMESTAMP DEFAULT NOW()
   );

   CREATE INDEX idx_bookings_show_status ON bookings(show_id, status);
   CREATE INDEX idx_bookings_status_created ON bookings(status, created_at);
   CREATE INDEX idx_shows_start_time ON shows(start_time);
   ```

5. **Run the application**
   ```bash
   # Development mode (with auto-reload)
   npm run dev

   # Production mode
   npm start
   ```

## 📚 API Documentation

### Base URL
```
http://localhost:3000
```

### Health Check
```http
GET /health
```

### Admin Endpoints

#### Movies

**Create Movie**
```http
POST /admin/movies
Content-Type: application/json

{
  "title": "Inception",
  "description": "A mind-bending thriller",
  "duration_minutes": 148
}
```

**Get All Movies**
```http
GET /admin/movies
```

**Update Movie**
```http
PATCH /admin/movies/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "duration_minutes": 150
}
```

**Delete Movie**
```http
DELETE /admin/movies/:id
```

#### Shows

**Create Show**
```http
POST /admin/shows
Content-Type: application/json

{
  "movie_id": 1,
  "screen_name": "Screen 1",
  "start_time": "2025-12-15T18:00:00Z",
  "total_seats": 100
}
```

**Get All Shows**
```http
GET /admin/shows
```

**Update Show**
```http
PATCH /admin/shows/:id
Content-Type: application/json

{
  "total_seats": 120
}
```

**Delete Show**
```http
DELETE /admin/shows/:id
```

**Get All Bookings**
```http
GET /admin/bookings
```

### User Endpoints

**Get Available Shows**
```http
GET /shows
```
Returns only future shows with seat availability.

**Get Show Details**
```http
GET /shows/:id
```

**Book Seats**
```http
POST /shows/:id/book
Content-Type: application/json

{
  "user_email": "user@example.com",
  "seats_booked": 2
}
```
Creates a PENDING booking. Must be confirmed within 2 minutes.

**Get Booking Details**
```http
GET /bookings/:id
```

**Get User Bookings**
```http
GET /bookings?email=user@example.com
```

**Confirm Booking**
```http
PATCH /bookings/:id/confirm
```
Confirms a PENDING booking (simulates payment confirmation).

**Cancel Booking**
```http
PATCH /bookings/:id/cancel
```

## 🔒 Concurrency Control

The system uses PostgreSQL row-level locking to prevent double-booking:

```javascript
BEGIN;
SELECT * FROM shows WHERE id = $1 FOR UPDATE;  // Lock the row
// Check availability
// Insert booking
COMMIT;
```

This ensures that only one booking transaction can modify a show's seats at a time.

## ⏰ Booking Expiry

A background worker runs every 30 seconds to expire PENDING bookings older than 2 minutes:

```javascript
UPDATE bookings 
SET status = 'FAILED'
WHERE status = 'PENDING' 
  AND created_at < NOW() - INTERVAL '2 minutes'
```

## 🧪 Testing

Test the API using curl, Postman, or any HTTP client:

```bash
# Health check
curl http://localhost:3000/health

# Create a movie
curl -X POST http://localhost:3000/admin/movies \
  -H "Content-Type: application/json" \
  -d '{"title":"Inception","duration_minutes":148}'

# Get available shows
curl http://localhost:3000/shows
```

## 📊 Database Schema

See `SYSTEM_DESIGN.md` for detailed architecture and scaling strategies.

## 🚢 Deployment

### Environment Variables for Production
```env
DATABASE_URL=<production-database-url>
PORT=3000
NODE_ENV=production
```

### Recommended Platforms
- **Backend**: Railway, Render, Heroku, AWS EC2
- **Database**: Neon, Supabase, AWS RDS, Railway PostgreSQL

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

ISC

## 👨‍💻 Author

Your Name

## 🙏 Acknowledgments

- Built with Express.js and PostgreSQL
- Inspired by real-world booking systems
- See `SYSTEM_DESIGN.md` for architectural decisions