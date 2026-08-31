require("dotenv").config();

const { Pool } = require("pg");

console.log("DATABASE_URL ada:", !!process.env.DATABASE_URL);

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL tidak tersedia");
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

module.exports = pool;