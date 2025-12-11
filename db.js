const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // or use individual vars
    ssl: { rejectUnauthorized: false } // enable if your host (Render/Railway) needs SSL
});

module.exports = pool;
