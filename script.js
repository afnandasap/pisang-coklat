let keranjang = [];

function tambahKeranjang(nama, harga) {

    let produkAda = keranjang.find(function(produk) {
        return produk.nama === nama;
    });

    if (produkAda) {
        produkAda.jumlah = produkAda.jumlah + 1;
    } else {
        keranjang.push({
            nama: nama,
            harga: harga,
            jumlah: 1
        });
    }

    tampilkanKeranjang();
}


function tambahJumlah(index) {

    keranjang[index].jumlah++;

    tampilkanKeranjang();
}


function kurangiJumlah(index) {

    keranjang[index].jumlah--;

    if (keranjang[index].jumlah <= 0) {
        keranjang.splice(index, 1);
    }

    tampilkanKeranjang();
}


function hapusProduk(index) {

    keranjang.splice(index, 1);

    tampilkanKeranjang();
}


function tampilkanKeranjang() {

    let daftar = document.getElementById("daftar-keranjang");
    let jumlah = document.getElementById("jumlah-keranjang");
    let totalHarga = document.getElementById("total-harga");

    daftar.innerHTML = "";

    if (keranjang.length === 0) {

        daftar.innerHTML = "<p>Keranjang masih kosong.</p>";

        jumlah.textContent = 0;
        totalHarga.textContent = 0;

        return;
    }

    let total = 0;
    let totalJumlah = 0;

    keranjang.forEach(function(produk, index) {

        let subtotal = produk.harga * produk.jumlah;

        total = total + subtotal;
        totalJumlah = totalJumlah + produk.jumlah;

        let item = document.createElement("div");

        item.classList.add("item-keranjang");

        item.innerHTML = `
            <div>
                <h4>${produk.nama}</h4>

                <p>
                    Rp${produk.harga.toLocaleString("id-ID")}
                </p>
            </div>

            <div class="jumlah-produk">
                <button onclick="kurangiJumlah(${index})">-</button>

                <span>${produk.jumlah}</span>

                <button onclick="tambahJumlah(${index})">+</button>
            </div>

            <div>
                Rp${subtotal.toLocaleString("id-ID")}
            </div>

            <button
                class="hapus"
                onclick="hapusProduk(${index})"
            >
                Hapus
            </button>
        `;

        daftar.appendChild(item);
    });

    jumlah.textContent = totalJumlah;

    totalHarga.textContent = total.toLocaleString("id-ID");
}

function checkout() {

    if (keranjang.length === 0) {
        alert("Keranjang masih kosong.");
        return;
    }

    let formCheckout = document.getElementById("checkout-form");

    formCheckout.style.display = "block";

    formCheckout.scrollIntoView({
        behavior: "smooth"
    });
}

async function kirimPesanan(event) {

    event.preventDefault();

    const nama =
        document.getElementById("nama").value.trim();

    const whatsapp =
        document.getElementById("whatsapp").value.trim();

    const alamat =
        document.getElementById("alamat").value.trim();

    const catatan =
        document.getElementById("catatan").value.trim();

    if (!nama || !whatsapp || !alamat) {
        alert("Nama, WhatsApp, dan alamat wajib diisi.");
        return;
    }

    if (!Array.isArray(keranjang) || keranjang.length === 0) {
        alert("Keranjang masih kosong.");
        return;
    }

    try {

        const response = await fetch("/pesanan", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                nama,
                whatsapp,
                alamat,
                catatan,
                keranjang
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(
                data.pesan ||
                "Pesanan gagal disimpan."
            );
            return;
        }

        alert(
            "Pesanan berhasil disimpan!"
        );

        keranjang = [];

        localStorage.removeItem("keranjang");

        tampilkanKeranjang();

        document.getElementById(
            "checkout-form"
        ).reset();

    } catch (error) {

        console.error(
            "Checkout error:",
            error
        );

        alert(
            "Gagal mengirim pesanan."
        );
    }
}

let formPesanan = document.getElementById("form-pesanan");

formPesanan.addEventListener("submit", async function(event) {

    event.preventDefault();

    let nama = document.getElementById("nama").value;
    let whatsapp = document.getElementById("whatsapp").value;
    let alamat = document.getElementById("alamat").value;
    let catatan = document.getElementById("catatan").value;

    let dataPesanan = {
        nama: nama,
        whatsapp: whatsapp,
        alamat: alamat,
        catatan: catatan,
        keranjang: keranjang
    };

    try {

        let response = await fetch("http://localhost:3000/pesanan", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(dataPesanan)
        });

        let hasil = await response.json();

        console.log(hasil);

        alert("Pesanan berhasil dikirim ke server!");

    } catch (error) {

        console.error(error);

        alert("Gagal mengirim pesanan.");
    }
});

async function ambilProduk() {

    const container =
        document.getElementById("produk-container");

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

            card.classList.add("card");

            card.innerHTML = `

    ${
        item.gambar
        ?
        `
        <img
            src="/uploads/${item.gambar}"
            alt="${item.nama}"
            class="gambar-produk"
        >
        `
        :
        ""
    }

    <h3>${item.nama}</h3>

    <p>
        ${item.deskripsi || ""}
    </p>

    <h4>
        Rp${item.harga.toLocaleString("id-ID")}
    </h4>

    <button>
        Beli
    </button>
`;

const tombolBeli =
    card.querySelector("button");

tombolBeli.addEventListener(
    "click",
    function() {

        tambahKeranjang(
            item.nama,
            item.harga
        );

    }
);

            container.appendChild(card);
        });

    } catch (error) {

        console.error(error);

        container.innerHTML =
            "<p>Gagal mengambil produk.</p>";
    }
}

ambilProduk();