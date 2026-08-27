require("dotenv").config();

const { Pool } = require("pg");

const pool = new Pool({
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE
});

async function ambilProduk() {

    try {

        const hasil =
            await pool.query(
                `
                SELECT *
                FROM produk
                WHERE aktif = TRUE
                ORDER BY id ASC
                `
            );

        console.log(
            "PostgreSQL berhasil terhubung!"
        );

        console.log(
            "Daftar produk:"
        );

        console.table(hasil.rows);

    } catch (error) {

        console.error(
            "Terjadi error:"
        );

        console.error(
            error.message
        );

    } finally {

        await pool.end();
    }
}

ambilProduk();