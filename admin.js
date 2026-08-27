async function cekLoginAdmin() {

    try {

        const response =
            await fetch("/cek-login");

        if (!response.ok) {

            window.location.href =
                "/admin-login.html";

            return false;
        }

        return true;

    } catch (error) {

        window.location.href =
            "/admin-login.html";

        return false;
    }
}

async function ambilPesanan() {

    const daftarPesanan =
        document.getElementById("daftar-pesanan");

    try {

        const response =
            await fetch("/pesanan");

        const data =
            await response.json();

        console.log(
            "Data pesanan:",
            data
        );


        if (!response.ok) {

            daftarPesanan.innerHTML =
                "<p>Gagal mengambil pesanan.</p>";

            return;
        }


        daftarPesanan.innerHTML = "";


        if (data.length === 0) {

            daftarPesanan.innerHTML =
                "<p>Belum ada pesanan.</p>";

            return;
        }


        data.forEach(function(pesanan) {

            const card =
                document.createElement("div");

            card.classList.add(
                "card-pesanan"
            );


            let daftarProduk = "";


            if (
                Array.isArray(pesanan.produk) &&
                pesanan.produk.length > 0
            ) {

                pesanan.produk.forEach(
                    function(produk) {

                        daftarProduk += `
                            <div class="produk-pesanan">

                                <span>
                                    ${produk.nama_produk}
                                    x${produk.jumlah}
                                </span>

                                <span>
                                    Rp${Number(
                                        produk.subtotal
                                    ).toLocaleString("id-ID")}
                                </span>

                            </div>
                        `;

                    }
                );

            } else {

                daftarProduk =
                    "<p>Tidak ada detail produk.</p>";
            }


            card.innerHTML = `

                <h3>
                    Pesanan #${pesanan.id}
                </h3>


                <p>
                    <strong>Nama:</strong>
                    ${pesanan.nama}
                </p>


                <p>
                    <strong>WhatsApp:</strong>
                    ${pesanan.whatsapp}
                </p>


                <p>
                    <strong>Alamat:</strong>
                    ${pesanan.alamat}
                </p>


                <p>
                    <strong>Catatan:</strong>
                    ${pesanan.catatan || "-"}
                </p>


                <div class="daftar-produk">

                    <h4>Produk:</h4>

                    ${daftarProduk}

                </div>


                <div class="status-container">

                    <label>
                        <strong>Status:</strong>
                    </label>

                    <select
                        onchange="
                            ubahStatus(
                                ${pesanan.id},
                                this.value
                            )
                        "
                    >

                        <option
                            value="Baru"
                            ${
                                pesanan.status === "Baru"
                                ? "selected"
                                : ""
                            }
                        >
                            Baru
                        </option>


                        <option
                            value="Diproses"
                            ${
                                pesanan.status === "Diproses"
                                ? "selected"
                                : ""
                            }
                        >
                            Diproses
                        </option>


                        <option
                            value="Selesai"
                            ${
                                pesanan.status === "Selesai"
                                ? "selected"
                                : ""
                            }
                        >
                            Selesai
                        </option>


                        <option
                            value="Dibatalkan"
                            ${
                                pesanan.status === "Dibatalkan"
                                ? "selected"
                                : ""
                            }
                        >
                            Dibatalkan
                        </option>

                    </select>

                </div>


                <p class="total">

                    Total:
                    Rp${Number(
                        pesanan.total
                    ).toLocaleString("id-ID")}

                </p>
            `;


            daftarPesanan.appendChild(card);

        });


    } catch (error) {

        console.error(
            "ERROR AMBIL PESANAN:",
            error
        );

        daftarPesanan.innerHTML =
            "<p>Gagal mengambil data pesanan.</p>";
    }
}


async function ubahStatus(id, status) {

    try {

        let response = await fetch(
            `/pesanan/${id}/status`,
            {
                method: "PATCH",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    status: status
                })
            }
        );

        let hasil = await response.json();

        if (!response.ok) {

            alert(hasil.pesan);

            return;
        }

        console.log(hasil.pesan);

    } catch (error) {

        console.error(error);

        alert("Gagal mengubah status.");
    }
}

const formProduk =
    document.getElementById("form-produk");

formProduk.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();

        const nama =
            document.getElementById(
                "nama-produk"
            ).value;

        const deskripsi =
            document.getElementById(
                "deskripsi-produk"
            ).value;

        const harga =
            document.getElementById(
                "harga-produk"
            ).value;

        const inputGambar =
            document.getElementById(
                "gambar-produk"
            );

        const gambar =
            inputGambar.files[0];


        if (!gambar) {

            alert("Pilih foto produk.");

            return;
        }


        const formData =
            new FormData();

        formData.append(
            "nama",
            nama
        );

        formData.append(
            "deskripsi",
            deskripsi
        );

        formData.append(
            "harga",
            harga
        );

        formData.append(
            "gambar",
            gambar
        );


        try {

            const response =
                await fetch("/produk", {

                    method: "POST",

                    body: formData

                });


            const hasil =
                await response.json();


            if (!response.ok) {

                alert(hasil.pesan);

                return;
            }


            alert(
                "Produk berhasil ditambahkan!"
            );

            formProduk.reset();

            ambilProdukAdmin();


        } catch (error) {

            console.error(error);

            alert(
                "Gagal menambahkan produk."
            );
        }
    }
);

async function ambilProdukAdmin() {

    const container =
        document.getElementById("daftar-produk-admin");

    try {

        const response =
            await fetch("/produk");

        const produk =
            await response.json();

        container.innerHTML = "";

        if (produk.length === 0) {

            container.innerHTML =
                "<p>Belum ada produk.</p>";

            return;
        }

        produk.forEach(function(item) {

    const card =
        document.createElement("div");

        if (item.gambar) {

    const gambar =
        document.createElement("img");

    gambar.src =
        `/uploads/${item.gambar}`;

    gambar.alt =
        item.nama;

    gambar.classList.add(
        "gambar-produk-admin"
    );

    card.appendChild(gambar);
}

    card.classList.add("produk-admin-card");

    const judul =
        document.createElement("h3");

    judul.textContent = item.nama;


    const deskripsi =
        document.createElement("p");

    deskripsi.textContent =
        item.deskripsi || "-";


    const harga =
        document.createElement("p");

    harga.innerHTML = `
        <strong>
            Rp${item.harga.toLocaleString("id-ID")}
        </strong>
    `;


    const aksi =
        document.createElement("div");

    aksi.classList.add("aksi-produk");


    const tombolEdit =
        document.createElement("button");

    tombolEdit.textContent = "Edit";

    tombolEdit.classList.add(
        "tombol-edit"
    );

    tombolEdit.addEventListener(
        "click",
        function() {

            bukaEditProduk(item);

        }
    );


    const tombolHapus =
        document.createElement("button");

    tombolHapus.textContent = "Hapus";

    tombolHapus.classList.add(
        "tombol-hapus"
    );

    tombolHapus.addEventListener(
        "click",
        function() {

            hapusProdukAdmin(item.id);

        }
    );


    aksi.appendChild(tombolEdit);
    aksi.appendChild(tombolHapus);

    card.appendChild(judul);
    card.appendChild(deskripsi);
    card.appendChild(harga);
    card.appendChild(aksi);

    container.appendChild(card);

});

    } catch (error) {

        console.error(error);

        container.innerHTML =
            "<p>Gagal mengambil produk.</p>";
    }
}

async function mulaiAdmin() {

    const sudahLogin =
        await cekLoginAdmin();

    if (!sudahLogin) {
        return;
    }

    ambilPesanan();

    ambilProdukAdmin();
}

mulaiAdmin();

async function hapusProdukAdmin(id) {

    const yakin = confirm(
        "Yakin ingin menghapus produk ini?"
    );

    if (!yakin) {
        return;
    }

    try {

        const response =
            await fetch(`/produk/${id}`, {

                method: "DELETE"

            });

        const hasil =
            await response.json();

        if (!response.ok) {

            alert(hasil.pesan);

            return;
        }

        alert("Produk berhasil dihapus.");

        ambilProdukAdmin();

    } catch (error) {

        console.error(error);

        alert("Gagal menghapus produk.");
    }
}

function bukaEditProduk(produk) {

    const formEdit =
        document.getElementById("edit-produk");

    document.getElementById(
        "edit-id"
    ).value = produk.id;

    document.getElementById(
        "edit-nama"
    ).value = produk.nama;

    document.getElementById(
        "edit-deskripsi"
    ).value = produk.deskripsi || "";

    document.getElementById(
        "edit-harga"
    ).value = produk.harga;


    formEdit.style.display = "block";


    formEdit.scrollIntoView({
        behavior: "smooth"
    });
}

function batalEdit() {

    const formEdit =
        document.getElementById("edit-produk");

    formEdit.style.display = "none";

    document.getElementById(
        "form-edit-produk"
    ).reset();
}

const formEditProduk =
    document.getElementById(
        "form-edit-produk"
    );


formEditProduk.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        const id =
            document.getElementById(
                "edit-id"
            ).value;


        const nama =
            document.getElementById(
                "edit-nama"
            ).value;


        const deskripsi =
            document.getElementById(
                "edit-deskripsi"
            ).value;


        const harga =
            document.getElementById(
                "edit-harga"
            ).value;


        try {

            const response =
                await fetch(`/produk/${id}`, {

                    method: "PATCH",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        nama: nama,

                        deskripsi: deskripsi,

                        harga: Number(harga)

                    })

                });


            const hasil =
                await response.json();


            if (!response.ok) {

                alert(hasil.pesan);

                return;
            }


            alert(
                "Produk berhasil diubah!"
            );


            batalEdit();

            ambilProdukAdmin();


        } catch (error) {

            console.error(error);

            alert(
                "Gagal mengubah produk."
            );
        }

    }
);

async function logoutAdmin() {

    try {

        await fetch("/logout", {
            method: "POST"
        });

        window.location.href =
            "/admin-login.html";

    } catch (error) {

        console.error(error);

        alert("Gagal logout.");
    }
}