require("dotenv").config();

const { Pool } = require("pg");

const host = process.env.PGHOST || process.env.PG_HOST;
const port = process.env.PGPORT || process.env.PG_PORT;
const user = process.env.PGUSER || process.env.PG_USER;
const password = process.env.PGPASSWORD || process.env.PG_PASSWORD;
const database = process.env.PGDATABASE || process.env.PG_DATABASE;

console.log("=== POSTGRES CONFIG ===");
console.log("HOST:", host || "TIDAK ADA");
console.log("PORT:", port || "TIDAK ADA");
console.log("USER tersedia:", !!user);
console.log("PASSWORD tersedia:", !!password);
console.log("DATABASE:", database || "TIDAK ADA");

if (!host || !port || !user || !password || !database) {
    throw new Error("Konfigurasi PostgreSQL Railway belum lengkap");
}

const pool = new Pool({
    host: host,
    port: Number(port),
    user: user,
    password: password,
    database: database,
    connectionTimeoutMillis: 10000
});

pool.connect()
  .then(client => {
    console.log("TEST POSTGRES: koneksi berhasil");
    client.release();
  })
  .catch(err => {
    console.error("TEST POSTGRES ERROR:", err.message);
  });

module.exports = pool;