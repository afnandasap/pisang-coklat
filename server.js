require("dotenv").config();
const bcrypt = require("bcrypt");
const session = require("express-session");
const express = require("express");
const cors = require("cors");
//const mysql = require("mysql2");
const app = express();
const pool = require("./db-postgres");
// const db = mysql.createConnection({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME
// });
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({

    destination: function(req, file, cb) {
        cb(null, "uploads/");
    },

    filename: function(req, file, cb) {

        const namaFile =
            Date.now() +
            "-" +
            file.originalname;

        cb(null, namaFile);
    }

});

const upload = multer({
    storage: storage
});


const PORT = 3000;


app.use(express.json());
app.use(cors());
app.use(express.static(__dirname));
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.get("/", function(req, res) {
    res.send("Server Pisang Coklat berjalan!");
});

app.use(
    session({
        secret: "pisang-coklat-secret",
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false
        }
    })
);

app.post("/pesanan", async function(req, res) {

    console.log("===== PESANAN BARU MASUK =====");
    console.log(req.body);

    const client = await pool.connect();

    try {

        const {
            nama,
            whatsapp,
            alamat,
            catatan,
            keranjang
        } = req.body;

        if (
            !nama ||
            !whatsapp ||
            !alamat ||
            !Array.isArray(keranjang) ||
            keranjang.length === 0
        ) {

            console.log("Data pesanan tidak lengkap");

            return res.status(400).json({
                pesan: "Data pesanan tidak lengkap"
            });
        }

        await client.query("BEGIN");

        let total = 0;

        keranjang.forEach(function(produk) {

            total +=
                Number(produk.harga) *
                Number(produk.jumlah);

        });

        console.log("Total:", total);


        const hasilPesanan =
            await client.query(
                `
                INSERT INTO pesanan
                (
                    nama,
                    whatsapp,
                    alamat,
                    catatan,
                    total
                )
                VALUES
                ($1, $2, $3, $4, $5)

                RETURNING *
                `,
                [
                    nama,
                    whatsapp,
                    alamat,
                    catatan || null,
                    total
                ]
            );


        const pesananBaru =
            hasilPesanan.rows[0];

        console.log(
            "Pesanan berhasil dibuat:",
            pesananBaru
        );


        for (const produk of keranjang) {

            const harga =
                Number(produk.harga);

            const jumlah =
                Number(produk.jumlah);

            const subtotal =
                harga * jumlah;


            const hasilDetail =
                await client.query(
                    `
                    INSERT INTO detail_pesanan
                    (
                        pesanan_id,
                        nama_produk,
                        harga,
                        jumlah,
                        subtotal
                    )
                    VALUES
                    ($1, $2, $3, $4, $5)

                    RETURNING *
                    `,
                    [
                        pesananBaru.id,
                        produk.nama,
                        harga,
                        jumlah,
                        subtotal
                    ]
                );


            console.log(
                "Detail masuk:",
                hasilDetail.rows[0]
            );
        }


        await client.query("COMMIT");

        console.log(
            "TRANSACTION COMMIT BERHASIL"
        );


        res.json({
            pesan:
                "Pesanan berhasil disimpan",

            pesananId:
                pesananBaru.id,

            total:
                total
        });


    } catch (error) {

        await client.query("ROLLBACK");

        console.error(
            "CHECKOUT POSTGRESQL ERROR:"
        );

        console.error(error);


        res.status(500).json({
            pesan:
                "Pesanan gagal disimpan"
        });


    } finally {

        client.release();
    }

});

app.get(
    "/pesanan",
    cekLogin,
    async function(req, res) {

        try {

            const hasilPesanan =
                await pool.query(`
                    SELECT *
                    FROM pesanan
                    ORDER BY id DESC
                `);


            const hasilDetail =
                await pool.query(`
                    SELECT *
                    FROM detail_pesanan
                    ORDER BY id ASC
                `);


            const pesanan =
                hasilPesanan.rows.map(
                    function(item) {

                        const produk =
                            hasilDetail.rows.filter(
                                function(detail) {

                                    return (
                                        detail.pesanan_id
                                        ===
                                        item.id
                                    );
                                }
                            );


                        return {
                            ...item,
                            produk: produk
                        };
                    }
                );


            res.json(pesanan);


        } catch (error) {

            console.error(error);

            res.status(500).json({
                pesan:
                    "Gagal mengambil pesanan"
            });
        }

    }
);

app.patch(
    "/pesanan/:id/status",
    cekLogin,
    async function(req, res) {

        try {

            const id =
                req.params.id;

            const status =
                req.body.status;


            const statusValid = [
                "Baru",
                "Diproses",
                "Selesai",
                "Dibatalkan"
            ];


            if (!statusValid.includes(status)) {

                return res.status(400).json({
                    pesan:
                        "Status tidak valid"
                });
            }


            const hasil =
                await pool.query(
                    `
                    UPDATE pesanan

                    SET status = $1

                    WHERE id = $2
                    `,
                    [
                        status,
                        id
                    ]
                );


            if (hasil.rowCount === 0) {

                return res.status(404).json({
                    pesan:
                        "Pesanan tidak ditemukan"
                });
            }


            res.json({
                pesan:
                    "Status berhasil diubah"
            });


        } catch (error) {

            console.error(error);

            res.status(500).json({
                pesan:
                    "Gagal mengubah status"
            });
        }

    }
);

app.get("/produk", async function(req, res) {

    try {

        const hasil =
            await pool.query(`
                SELECT *
                FROM produk
                WHERE aktif = TRUE
                ORDER BY id DESC
            `);

        res.json(hasil.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            pesan: "Gagal mengambil produk"
        });
    }

});

app.post(
    "/produk",
    cekLogin,
    upload.single("gambar"),
    async function(req, res) {

        try {

            const {
                nama,
                deskripsi,
                harga
            } = req.body;

            if (!nama || !harga) {

                return res.status(400).json({
                    pesan:
                        "Nama dan harga wajib diisi"
                });
            }

            if (!req.file) {

                return res.status(400).json({
                    pesan:
                        "Foto produk wajib dipilih"
                });
            }

            const gambar =
                req.file.filename;


            const sql = `
                INSERT INTO produk
                (
                    nama,
                    deskripsi,
                    harga,
                    gambar
                )
                VALUES
                ($1, $2, $3, $4)
                RETURNING id
            `;


            const hasil =
                await pool.query(
                    sql,
                    [
                        nama,
                        deskripsi,
                        Number(harga),
                        gambar
                    ]
                );


            res.json({
                pesan:
                    "Produk berhasil ditambahkan",

                id:
                    hasil.rows[0].id
            });


        } catch (error) {

            console.error(error);

            res.status(500).json({
                pesan:
                    "Gagal menambahkan produk"
            });
        }
    }
);

app.patch(
    "/produk/:id",
    cekLogin,
    async function(req, res) {

        try {

            const id =
                req.params.id;

            const {
                nama,
                deskripsi,
                harga
            } = req.body;


            if (!nama || !harga) {

                return res.status(400).json({
                    pesan:
                        "Nama dan harga wajib diisi"
                });
            }


            const hasil =
                await pool.query(
                    `
                    UPDATE produk

                    SET
                        nama = $1,
                        deskripsi = $2,
                        harga = $3

                    WHERE id = $4
                    `,

                    [
                        nama,
                        deskripsi,
                        Number(harga),
                        id
                    ]
                );


            if (hasil.rowCount === 0) {

                return res.status(404).json({
                    pesan:
                        "Produk tidak ditemukan"
                });
            }


            res.json({
                pesan:
                    "Produk berhasil diubah"
            });


        } catch (error) {

            console.error(error);

            res.status(500).json({
                pesan:
                    "Gagal mengubah produk"
            });
        }

    }
);

app.delete(
    "/produk/:id",
    cekLogin,
    async function(req, res) {

        try {

            const id =
                req.params.id;


            const hasil =
                await pool.query(
                    `
                    DELETE FROM produk
                    WHERE id = $1
                    `,
                    [id]
                );


            if (hasil.rowCount === 0) {

                return res.status(404).json({
                    pesan:
                        "Produk tidak ditemukan"
                });
            }


            res.json({
                pesan:
                    "Produk berhasil dihapus"
            });


        } catch (error) {

            console.error(error);

            res.status(500).json({
                pesan:
                    "Gagal menghapus produk"
            });
        }

    }
);

app.post("/login", async function(req, res) {

    try {

        const {
            username,
            password
        } = req.body;


        if (!username || !password) {

            return res.status(400).json({
                pesan:
                    "Username dan password wajib diisi"
            });
        }


        const hasil =
            await pool.query(
                `
                SELECT *
                FROM admin
                WHERE username = $1
                LIMIT 1
                `,
                [username]
            );


        if (hasil.rows.length === 0) {

            return res.status(401).json({
                pesan:
                    "Username atau password salah"
            });
        }


        const admin =
            hasil.rows[0];


        const cocok =
            await bcrypt.compare(
                password,
                admin.password
            );


        if (!cocok) {

            return res.status(401).json({
                pesan:
                    "Username atau password salah"
            });
        }


        req.session.admin = {
            id: admin.id,
            username: admin.username
        };


        res.json({
            pesan: "Login berhasil"
        });


    } catch (error) {

        console.error(
            "LOGIN ERROR:"
        );

        console.error(error);


        res.status(500).json({
            pesan:
                "Terjadi kesalahan server"
        });
    }

});

function cekLogin(req, res, next) {

    if (req.session.admin) {

        next();

    } else {

        res.status(401).json({
            pesan: "Silakan login terlebih dahulu"
        });
    }
}

app.get("/cek-login", function(req, res) {

    if (req.session.admin) {

        return res.json({
            login: true,
            admin: req.session.admin
        });
    }

    res.status(401).json({
        login: false
    });
});

app.post("/logout", function(req, res) {

    req.session.destroy(function(error) {

        if (error) {

            return res.status(500).json({
                pesan: "Gagal logout"
            });
        }

        res.json({
            pesan: "Logout berhasil"
        });
    });
});

pool.query("SELECT NOW()")
    .then(function(result) {

        console.log(
            "PostgreSQL berhasil terhubung!"
        );

    })
    .catch(function(error) {

        console.error(
            "PostgreSQL gagal terhubung:"
        );

        console.error(error.message);

    });

app.listen(PORT, function() {
    console.log("Server berjalan di http://localhost:" + PORT);
});

// db.connect(function(error) {

//     if (error) {
//         console.error("Database gagal terhubung:");
//         console.error(error);
//         return;
//     }

//     console.log("Database MySQL berhasil terhubung!");
// });

app.use(
    session({
    secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,

        cookie: {
            maxAge: 1000 * 60 * 60
        }
    })
);