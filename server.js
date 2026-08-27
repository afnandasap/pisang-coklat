require("dotenv").config();
const bcrypt = require("bcrypt");
const session = require("express-session");
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const app = express();
const pool = require("./db-postgres");
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});
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

app.post("/pesanan", function(req, res) {

    const {
        nama,
        whatsapp,
        alamat,
        catatan,
        keranjang
    } = req.body;

    let total = 0;

    keranjang.forEach(function(produk) {

        total += produk.harga * produk.jumlah;

    });

    const sqlPesanan = `
        INSERT INTO pesanan
        (nama, whatsapp, alamat, catatan, total)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sqlPesanan,
        [
            nama,
            whatsapp,
            alamat,
            catatan,
            total
        ],
        function(error, result) {

            if (error) {

                console.error(error);

                return res.status(500).json({
                    pesan: "Gagal menyimpan pesanan"
                });
            }

            const pesananId = result.insertId;

            let detail = [];

            keranjang.forEach(function(produk) {

                let subtotal =
                    produk.harga * produk.jumlah;

                detail.push([
                    pesananId,
                    produk.nama,
                    produk.harga,
                    produk.jumlah,
                    subtotal
                ]);

            });

            const sqlDetail = `
                INSERT INTO detail_pesanan
                (
                    pesanan_id,
                    nama_produk,
                    harga,
                    jumlah,
                    subtotal
                )
                VALUES ?
            `;

            db.query(
                sqlDetail,
                [detail],
                function(error) {

                    if (error) {

                        console.error(error);

                        return res.status(500).json({
                            pesan:
                            "Pesanan tersimpan tetapi detail gagal"
                        });
                    }

                    res.json({
                        pesan:
                        "Pesanan berhasil disimpan",
                        pesananId:
                        pesananId
                    });

                }
            );

        }
    );

});

app.get(
    "/pesanan",
    cekLogin,
    function(req, res) {

    const sqlPesanan = `
        SELECT *
        FROM pesanan
        ORDER BY id DESC
    `;

    db.query(sqlPesanan, function(error, pesanan) {

        if (error) {
            console.error(error);

            return res.status(500).json({
                pesan: "Gagal mengambil data pesanan"
            });
        }

        if (pesanan.length === 0) {
            return res.json([]);
        }

        const sqlDetail = `
            SELECT *
            FROM detail_pesanan
            ORDER BY id ASC
        `;

        db.query(sqlDetail, function(error, detail) {

            if (error) {
                console.error(error);

                return res.status(500).json({
                    pesan: "Gagal mengambil detail pesanan"
                });
            }

            const hasil = pesanan.map(function(itemPesanan) {

                const produkPesanan = detail.filter(function(itemDetail) {

                    return itemDetail.pesanan_id === itemPesanan.id;

                });

                return {
                    ...itemPesanan,
                    produk: produkPesanan
                };
            });

            res.json(hasil);

        });

    });

});

app.patch(
    "/pesanan/:id/status",
    cekLogin,
    function(req, res) {

    const id = req.params.id;
    const status = req.body.status;

    const statusValid = [
        "Baru",
        "Diproses",
        "Selesai",
        "Dibatalkan"
    ];

    if (!statusValid.includes(status)) {

        return res.status(400).json({
            pesan: "Status tidak valid"
        });
    }

    const sql = `
        UPDATE pesanan
        SET status = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [status, id],
        function(error, result) {

            if (error) {

                console.error(error);

                return res.status(500).json({
                    pesan: "Gagal mengubah status"
                });
            }

            if (result.affectedRows === 0) {

                return res.status(404).json({
                    pesan: "Pesanan tidak ditemukan"
                });
            }

            res.json({
                pesan: "Status berhasil diubah"
            });
        }
    );

});

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

app.post("/login", function(req, res) {

    const {
        username,
        password
    } = req.body;

    if (!username || !password) {

        return res.status(400).json({
            pesan: "Username dan password wajib diisi"
        });
    }

    const sql = `
        SELECT *
        FROM admin
        WHERE username = ?
        LIMIT 1
    `;

    db.query(
        sql,
        [username],
        function(error, hasil) {

            if (error) {

                console.error(error);

                return res.status(500).json({
                    pesan: "Terjadi kesalahan server"
                });
            }

            if (hasil.length === 0) {

                return res.status(401).json({
                    pesan: "Username atau password salah"
                });
            }

            const admin = hasil[0];

            bcrypt.compare(
                password,
                admin.password,
                function(error, cocok) {

                    if (error) {

                        console.error(error);

                        return res.status(500).json({
                            pesan: "Terjadi kesalahan server"
                        });
                    }

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
                }
            );
        }
    );
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

db.connect(function(error) {

    if (error) {
        console.error("Database gagal terhubung:");
        console.error(error);
        return;
    }

    console.log("Database MySQL berhasil terhubung!");
});

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