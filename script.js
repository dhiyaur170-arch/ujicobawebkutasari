"use strict";

// Kunci kebun, etalase, dan jalur sesuai dengan data-program di index.html.
const langkahProgram = {
  kebun: {
    tujuan: "Ajak beberapa keluarga mencoba kebun sayur kecil dan mencatat hasil panen pertama.",
    langkah: [
      "Catat pekarangan yang bisa dipakai dan waktu warga untuk merawatnya.",
      "Pilih satu atau dua sayuran yang biasa dimasak warga.",
      "Bagi jadwal menyiram, lalu catat biaya bibit dan hasil panen."
    ]
  },
  etalase: {
    tujuan: "Susun katalog sederhana agar pembeli bisa mengenal produk warga dan memesan langsung ke pemilik usaha.",
    langkah: [
      "Ajak pemilik usaha yang bersedia menampilkan produknya.",
      "Siapkan foto, keterangan produk, harga, dan kontak pemesanan yang disetujui.",
      "Uji satu pesanan dan sepakati siapa yang memperbarui katalog."
    ]
  },
  jalur: {
    tujuan: "Mulai dari satu jalur yang sering dilewati warga. Catatan lokasi membantu memilih pekerjaan yang bisa ditangani bersama.",
    langkah: [
      "Catat letak jalan atau saluran yang perlu dirawat.",
      "Tentukan bersama RT pekerjaan ringan yang cocok untuk kerja bakti.",
      "Dokumentasikan hasil dan teruskan kebutuhan perbaikan besar kepada pemerintah desa."
    ]
  }
};

// Navigasi
const nav = document.querySelector("#navigasi");
const menu = document.querySelector("#menu-toggle");
const tautan = [...nav.querySelectorAll("a")];
const bagian = tautan.map(link => document.querySelector(link.hash));

function tampilkanMenu(terbuka) {
  nav.classList.toggle("open", terbuka);
  menu.setAttribute("aria-expanded", String(terbuka));
  menu.setAttribute("aria-label", terbuka ? "Tutup menu" : "Buka menu");
  menu.querySelector("use").setAttribute("href", terbuka ? "#close" : "#menu");
}

menu.addEventListener("click", () => {
  tampilkanMenu(menu.getAttribute("aria-expanded") === "false");
});

nav.addEventListener("click", () => tampilkanMenu(false));

document.addEventListener("click", event => {
  if (!event.target.closest(".masthead")) tampilkanMenu(false);
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && menu.getAttribute("aria-expanded") === "true") {
    tampilkanMenu(false);
    menu.focus();
  }
});

function tandaiBagian() {
  const batas = document.querySelector(".masthead").offsetHeight + 40;
  let aktif = bagian[0];

  for (const section of bagian) {
    if (section.getBoundingClientRect().top <= batas) aktif = section;
  }

  for (const link of tautan) {
    if (link.hash === "#" + aktif.id) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  }
}

window.addEventListener("scroll", tandaiBagian, { passive: true });
window.addEventListener("resize", tandaiBagian);
tandaiBagian();

// Dialog rincian program dan usulan
const detail = document.querySelector("#detail");
const usulan = document.querySelector("#usulan");
const topik = document.querySelector("#topik");
const gagasan = document.querySelector("#gagasan");
const form = document.querySelector("#draft-form");
const pesan = document.querySelector("#pesan");
const kunciDraf = "kutasari.usulan.v1";
let bidangTerpilih = "";

function bukaDialog(dialog) {
  tampilkanMenu(false);
  dialog.showModal();
  document.body.classList.add("modal-open");
}

for (const dialog of [detail, usulan]) {
  dialog.querySelector(".dialog-close").addEventListener("click", () => {
    dialog.close();
  });
  dialog.addEventListener("close", () => {
    const masihTerbuka = Boolean(document.querySelector("dialog[open]"));
    document.body.classList.toggle("modal-open", masihTerbuka);
  });
}

document.querySelectorAll("[data-program]").forEach(tombol => {
  tombol.addEventListener("click", () => {
    const data = langkahProgram[tombol.dataset.program];
    const kartu = tombol.closest(".card");

    bidangTerpilih = kartu.querySelector(".category").textContent.trim();
    document.querySelector("#detail-title").textContent = kartu.querySelector("h3").textContent;
    document.querySelector("#detail-desc").textContent = data.tujuan;

    const langkah = data.langkah.map(teks => {
      const item = document.createElement("li");
      item.textContent = teks;
      return item;
    });

    document.querySelector("#detail-steps").replaceChildren(...langkah);
    bukaDialog(detail);
  });
});

// Muat kembali draf dari browser ketika halaman dibuka.
function pulihkanDraf() {
  try {
    const data = JSON.parse(localStorage.getItem(kunciDraf));

    if (data && typeof data.teks === "string" && data.teks.trim()) {
      gagasan.value = data.teks;
      if ([...topik.options].some(option => option.value === data.bidang)) {
        topik.value = data.bidang;
      }
      pesan.textContent = "Draf tersimpan sudah dimuat.";
    }
  } catch {
    pesan.textContent = "Draf lama tidak dapat dibaca. Kamu tetap bisa menulis dan mengunduh usulan.";
  }
}

pulihkanDraf();

function bukaUsulan(bidang) {
  if (bidang && !gagasan.value.trim()) topik.value = bidang;
  bukaDialog(usulan);
}

document.querySelectorAll("[data-usulan]").forEach(tombol => {
  tombol.addEventListener("click", () => bukaUsulan());
});

document.querySelector("#usulan-terkait").addEventListener("click", () => {
  detail.close();
  bukaUsulan(bidangTerpilih);
});

form.addEventListener("input", () => {
  gagasan.setCustomValidity("");
  pesan.textContent = "";
});

function drafValid() {
  gagasan.setCustomValidity(gagasan.value.trim() ? "" : "Tuliskan usulan terlebih dahulu.");
  return form.reportValidity();
}

// Simpan satu draf di perangkat pengguna.
form.addEventListener("submit", event => {
  event.preventDefault();
  if (!drafValid()) return;

  try {
    const draf = { bidang: topik.value, teks: gagasan.value.trim() };
    localStorage.setItem(kunciDraf, JSON.stringify(draf));
    pesan.textContent = "Draf tersimpan di browser ini.";
  } catch {
    pesan.textContent = "Browser tidak dapat menyimpan draf. Gunakan Unduh .txt untuk menyimpan salinan.";
  }
});

// Unduh usulan sebagai file teks.
document.querySelector("#unduh").addEventListener("click", () => {
  if (!drafValid()) return;

  const isi = [
    "Draf usulan Desa Kutasari",
    "Bidang: " + topik.value,
    "",
    gagasan.value.trim()
  ].join("\n");

  const file = new Blob([isi], { type: "text/plain;charset=utf-8" });
  const alamat = URL.createObjectURL(file);
  const link = document.createElement("a");

  link.href = alamat;
  link.download = "usulan-kutasari.txt";
  document.body.append(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(alamat), 1000);
  pesan.textContent = "File usulan-kutasari.txt siap diunduh.";
});