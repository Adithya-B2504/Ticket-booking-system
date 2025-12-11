# System Design Document - Movie Ticket Booking System

## 1. Architecture Overview

### Layered Architecture

```
Client Request
    ↓
Routes Layer (src/routes/)
    ↓
Middleware (validation, errors)
    ↓
Controllers (HTTP handlers)
    ↓
Services (business logic)
    ↓
Database (PostgreSQL)
```

### File Structure
```
modex/
├── src/
│   ├── config/          # Database connection
│   ├── controllers/     # HTTP handlers
│   ├── services/        # Business logic
│   ├── routes/          # API endpoints
│   ├── middleware/      # Validation & errors
│   ├── workers/         # Background jobs
│   └── app.js          # Express setup
└── index.js            # Entry point
```

## 2. Database Schema

```sql
movies (id, title, description, duration_minutes, created_at)
shows (id, movie_id, screen_name, start_time, total_seats, created_at)
bookings (id, show_id, user_email, seats_booked, status, created_at)
```

**Indexes:**
- `idx_bookings_show_status` on `bookings(show_id, status)`
- `idx_bookings_status_created` on `bookings(status, created_at)`
- `idx_shows_start_time` on `shows(start_time)`

## 3. Concurrency Control

**Row-Level Locking** prevents double-booking:

```javascript
BEGIN;
SELECT * FROM shows WHERE id = $1 FOR UPDATE;  // Lock row
// Check availability
// Insert booking
COMMIT;
```

**Why?**
- Simple and effective
- ACID guarantees from PostgreSQL
- No additional infrastructure needed

## 4. Booking Flow

1. **User books seats** → Status: `PENDING`
2. **User confirms** (payment) → Status: `CONFIRMED`
3. **Auto-expire** after 2 minutes → Status: `FAILED`

**Background Worker** runs every 30 seconds:
```sql
UPDATE bookings SET status = 'FAILED'
WHERE status = 'PENDING' 
  AND created_at < NOW() - INTERVAL '2 minutes'
```

## 5. Layer Responsibilities

| Layer | Purpose | Example |
|-------|---------|---------|
| **Routes** | Define endpoints | `POST /admin/movies` |
| **Middleware** | Validate input, handle errors | Email format check |
| **Controllers** | Handle HTTP, orchestrate | Parse request, call service |
| **Services** | Business logic, DB operations | Create booking with lock |
| **Config** | Database connection | Connection pool |
| **Workers** | Background tasks | Expire bookings |

## 6. Scaling Strategy

| Load | Solution |
|------|----------|
| 0-1K bookings/day | Current setup (single server) |
| 1K-10K/day | Add Redis cache, read replicas |
| 10K-100K/day | Database sharding, message queue |
| 100K+/day | Multi-region, distributed cache |

### Future Enhancements
- **Caching**: Redis for show listings (30s TTL)
- **Read Replicas**: Route reads to replicas, writes to primary
- **Message Queue**: RabbitMQ/SQS for async booking confirmation
- **CDN**: Cache static content (movie posters, etc.)

## 7. Design Decisions

| Decision | Why | Trade-off |
|----------|-----|-----------|
| Layered architecture | Maintainability, testability | More files |
| Row-level locking | Simple, guaranteed consistency | Lower throughput under high load |
| PENDING status | Better UX, handles payment | Needs expiry worker |
| Functional services | Stateless, simple | Less OOP |

## 8. Key Benefits

✅ **Separation of Concerns** - Each layer has one job  
✅ **Testability** - Test each layer independently  
✅ **Maintainability** - Easy to find and fix bugs  
✅ **Scalability** - Add features without breaking existing code  
✅ **Reusability** - Services used by multiple controllers  

## 9. Production Considerations

### Security
- Rate limiting (prevent abuse)
- Input validation (SQL injection prevention)
- JWT authentication (future)
- HTTPS/TLS

### Monitoring
- Track booking success/failure rate
- Monitor database connection pool
- Log errors centrally
- Alert on high failure rates

### Deployment
- **Backend**: Railway, Render, AWS EC2
- **Database**: Neon, Supabase, AWS RDS
- **Environment**: Use `.env` for secrets

---

## Summary

This is a **production-ready, layered architecture** that prioritizes:
- ✅ **Correctness** - No double-booking via row locks
- ✅ **Maintainability** - Clean separation of layers
- ✅ **Scalability** - Easy to add caching, replicas, queues
