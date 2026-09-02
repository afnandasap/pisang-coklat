require("dotenv").config();

const { Pool } = require("pg");

const host =
    process.env.PGHOST ||
    process.env.PG_HOST;

const port =
    process.env.PGPORT ||
    process.env.PG_PORT ||
    5432;

const user =
    process.env.PGUSER ||
    process.env.PG_USER;

const password =
    process.env.PGPASSWORD ||
    process.env.PG_PASSWORD;

const database =
    process.env.PGDATABASE ||
    process.env.PG_DATABASE;

console.log("Konfigurasi PostgreSQL:");
console.log("Host tersedia:", !!host);
console.log("Port tersedia:", !!port);
console.log("User tersedia:", !!user);
console.log("Password tersedia:", !!password);
console.log("Database tersedia:", !!database);

const pool = new Pool({
    host,
    port: Number(port),
    user,
    password,
    database,
    connectionTimeoutMillis: 10000
});

module.exports = pool;