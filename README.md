# 🌴 Wisata Pantai Modern - Sistem POS & Pintu Masuk Validator QR Code

Sistem manajemen terpadu destinasi wisata pantai modern yang memadukan **Frontend berbasis React.js (Vite)** dan **Backend API PHP Native** serta database **MySQL**. Dilengkapi fitur POS Kasir loket karcis, simulasi pintu otomatis (turnstile gate), scanner QR Code kamera live, feedback audio buzzer, dan suara sambutan otomatis (Text-To-Speech).

---

## 🌟 Fitur Utama Aplikasi

### 1. Halaman Publik (Landing Page)
* **Desain Tropis Modern**: Tampilan responsif dengan visual elegan, mode gelap/terang, dan micro-animation.
* **Informasi Dinamis**: Menampilkan profil pantai, tagline, jam operasional, galeri foto publik, dan daftar fasilitas langsung dari database.
* **Kartu Harga Tiket**: Daftar harga tiket beserta checklist fitur keuntungan tiket masuk.

### 2. Dashboard POS Kasir (Loket Tiket)
* **Input Penjualan Cepat**: Pengaturan jumlah tiket instan (tombol +/-) dan input nama pengunjung opsional (default ke "Umum").
* **Pratinjau Karcis Unik**: Dialog pratinjau struk karcis bergaya slip kertas termal dengan QR Code unik (format `TKT-YYYYMMDD-XXXX`).
* **Cetak Karcis Fisik**: Dilengkapi stylesheet cetak khusus (`@media print`) yang secara otomatis menyembunyikan antarmuka web dan membatasi ukuran kertas persis selebar kertas printer thermal kasir (`80mm`) tanpa lembar kosong tambahan (*over-print*).
* **Riwayat Kasir & Ringkasan**: Cetak ulang tiket dari tabel riwayat transaksi kasir hari ini, serta panel ringkasan jumlah pendapatan/pengunjung kasir aktif.

### 3. Halaman Portal Pintu Masuk Validator (`GateValidator.jsx`)
* **Standalone Validator View**: Halaman terpisah khusus dipasang pada terminal gerbang masuk tiket pengunjung.
* **Kamera QR Scanner**: Live webcam scanner menggunakan modul `html5-qrcode` untuk memindai karcis pengunjung secara instan (dilengkapi input kode manual sebagai alternatif).
* **Selamat Datang Suara (TTS)**: Menggunakan **Web Speech API (SpeechSynthesis)** untuk menyuarakan ucapan *"Selamat datang di [Nama Pantai], silakan masuk"* secara otomatis dengan logat bahasa Indonesia yang natural saat verifikasi sukses.
* **Feedback Audio Buzzer**: Menggunakan **Web Audio API** untuk menghasilkan bunyi beep ganda bernada tinggi (*Success Beep*) atau buzz bernada rendah (*Error Buzz*) secara lokal tanpa file audio statis.
* **Simulasi Palang Turnstile**: Animasi palang besi penutup CSS 3D yang otomatis berputar terbuka (menjadi hijau tegak) selama 5 detik, menghitung mundur, dan otomatis menutup kembali (merah melintang).

### 4. Portal Admin Pengelola
* **Overview Dasbor**: Statistik total pendapatan, total pengunjung, serta grafik mingguan kustom dinamis berbasis elemen SVG.
* **Pengaturan Pantai (Content Management)**: Form pengeditan Nama Pantai, Tagline, Deskripsi, Harga Tiket, checklist keuntungan tiket, serta file uploader foto utama.
* **Kelola Galeri**: Tambah foto baru atau hapus foto galeri publik dengan overlay interaktif.
* **CRUD Fasilitas & Petugas Kasir**: Form manajemen penuh untuk menambah, mengedit biodata, mengubah password, dan menghapus data kasir loket & fasilitas penunjang pantai.
* **Laporan Keuangan**: Filter pencarian riwayat transaksi berdasarkan rentang tanggal tertentu beserta rekap metrik cetak laporan.

---

## 🛠️ Spesifikasi Teknologi (Tech Stack)

### Frontend (Client-side)
* **React.js (Vite)** - Library UI dan bundler ultra cepat.
* **Lucide React** - Set ikon modern dan konsisten.
* **html5-qrcode** - Scanner QR code menggunakan kamera perangkat.
* **qrcode.react** - Generator QR Code dinamis berbasis SVG untuk cetakan karcis.
* **Web Audio API & Web Speech API** - Buzzer internal dan Text-To-Speech suara sambutan selamat datang.

### Backend (Server-side & Database)
* **PHP Native (API)** - Penyedia endpoint logic CRUD dan otentikasi di `public/api/api.php`.
* **MySQL (PDO)** - Driver database aman dengan sistem transaksi.
* **Self-Installing Database (Zero-Config)**: PHP backend akan mendeteksi otomatis jika database `wisata_pantai` belum ada di MySQL lokal Anda. PHP akan membuat database, seluruh tabel (`users`, `settings`, `transactions`), akun default admin/kasir, data profil awal, serta transaksi buatan untuk 7 hari terakhir agar dasbor statistik dan grafik langsung terisi secara visual.

---

## 🚀 Panduan Instalasi & Menjalankan Lokal

### Prasyarat Awal:
1. Pastikan komputer Anda terinstal **Node.js** (untuk menjalankan Vite).
2. Nyalakan server lokal PHP & MySQL seperti **XAMPP**, **Laragon**, atau **WampServer**.
3. Pastikan username MySQL adalah `root` dan password kosong `""` (konfigurasi default XAMPP).

### Langkah 1: Kloning & Persiapan Folder
Pindahkan folder project `pariwisata` ke direktori web server Anda (misalnya `htdocs` jika menggunakan XAMPP):
```bash
# Untuk XAMPP Windows
C:\xampp\htdocs\pariwisata
```

### Langkah 2: Jalankan Mode Pengembangan (Vite Dev Server)
1. Buka Terminal/Command Prompt di direktori project `pariwisata`.
2. Jalankan perintah untuk mengunduh package node_modules:
   ```bash
   npm install
   ```
3. Jalankan server frontend Vite:
   ```bash
   npm run dev
   ```
4. Buka browser pada alamat: **`http://localhost:5173/`**
5. Jalankan server PHP bawaan atau pastikan Apache berjalan di port 80 (mengarah ke folder public api). Jika server PHP dijalankan terpisah, Anda dapat mengeksekusi ini di terminal baru:
   ```bash
   php -S localhost:8000
   ```
   *Vite terkonfigurasi otomatis untuk menghubungkan frontend ke localhost:8000 saat dijalankan di port 5173.*

### Langkah 3: Deployment Produksi (Rekomendasi Uji Coba Penuh)
Untuk menyatukan aplikasi (Frontend & Backend) dalam satu folder server produksi:
1. Jalankan perintah kompilasi frontend:
   ```bash
   npm run build
   ```
   *Perintah ini akan menciptakan folder `dist/` di dalam project Anda yang berisi seluruh kode frontend yang sudah dioptimasi beserta subfolder backend PHP API.*
2. Salin seluruh isi di dalam folder `dist/` ke folder web server Anda, misal: `C:\xampp\htdocs\pariwisata\`
3. Pastikan MySQL di XAMPP/Laragon aktif.
4. Buka browser pada alamat:
   **`http://localhost/pariwisata/`**
5. Database `wisata_pantai` beserta data contoh (seeding) otomatis dibuat di MySQL phpMyAdmin Anda seketika halaman pertama kali dimuat.

---

## 🔐 Kredensial Login Bawaan (Default Login)

Gunakan akun berikut untuk masuk ke portal dashboard petugas melalui tombol **"Masuk Petugas"** di pojok kanan atas navbar:

* **Petugas Administrator**:
  * **Username**: `admin`
  * **Password**: `admin123`
* **Petugas Kasir Loket**:
  * **Username**: `kasir`
  * **Password**: `kasir123`

---

## 📁 Struktur Folder Project

```text
pariwisata/
├── dist/                     # Hasil build produksi terintegrasi
├── public/
│   ├── api/
│   │   ├── api.php           # Backend API Controller (Auth, CRUD, DB Auto-setup)
│   │   └── uploads/          # Folder penyimpanan unggahan gambar pantai & galeri
│   └── favicon.ico
├── src/
│   ├── assets/               # Aset gambar lokal/logo
│   ├── components/
│   │   ├── CustomChart.jsx   # Grafik laporan statistik SVG
│   │   ├── Footer.jsx        # Footer website publik
│   │   ├── Navbar.jsx        # Navbar utama (Desktop & Mobile Drawer)
│   │   ├── StatCard.jsx      # Kartu metrik dasbor
│   │   └── TicketReceipt.jsx # Modal cetak struk kasir termal 80mm
│   ├── utils/
│   │   └── db.js             # File konfigurasi fetch API helper
│   ├── views/
│   │   ├── AdminDashboard.jsx # Panel kendali utama Administrator
│   │   ├── CashierDashboard.jsx # POS penjualan kasir & scanner loket
│   │   ├── GateValidator.jsx  # Portal scanner gerbang pintu masuk utama
│   │   ├── Home.jsx           # Landing page publik wisata pantai
│   │   └── Login.jsx          # Halaman masuk petugas
│   ├── App.css
│   ├── App.jsx               # Entry-point utama & routing views
│   ├── index.css             # Desain sistem global, variabel warna & tema gelap/terang
│   └── main.jsx
├── index.html
├── package.json
├── vite.config.js
└── README.md                 # Dokumentasi proyek
```
