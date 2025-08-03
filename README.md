# Sistem Informasi Manajemen Desa (SIMADE) Sederhana

![Contoh Tampilan Dasbor](https://i.imgur.com/your-dashboard-image.png) <!-- Ganti dengan URL gambar dasbor Anda -->

Selamat datang di proyek Sistem Informasi Manajemen Desa (SIMADE) Sederhana. Aplikasi web ini dirancang untuk membantu aparat desa dalam mengelola data kependudukan secara digital. Sistem ini dibangun menggunakan teknologi yang mudah diakses dan gratis, seperti Google Sheets sebagai database dan Google Apps Script sebagai backend, dengan antarmuka yang modern menggunakan AdminLTE dan di-hosting di Firebase.

---

##  Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Teknologi yang Digunakan](#teknologi-yang-digunakan)
- [Panduan Instalasi & Konfigurasi](#panduan-instalasi--konfigurasi)
  - [Langkah 1: Persiapan Google Sheet (Database)](#langkah-1-persiapan-google-sheet-database)
  - [Langkah 2: Konfigurasi Backend (Google Apps Script)](#langkah-2-konfigurasi-backend-google-apps-script)
  - [Langkah 3: Konfigurasi Frontend (Kode HTML)](#langkah-3-konfigurasi-frontend-kode-html)
  - [Langkah 4: Publikasi ke Firebase Hosting](#langkah-4-publikasi-ke-firebase-hosting)
- [Panduan Penggunaan](#panduan-penggunaan)
- [Struktur File](#struktur-file)
- [Rencana Pengembangan](#rencana-pengembangan)

---

## Fitur Utama ✨

Aplikasi ini memiliki dua tingkat akses dengan fitur yang berbeda:

#### Untuk Semua Pengguna (User & Admin):
-   **Login Aman:** Sistem otentikasi berbasis sesi.
-   **Dasbor Penduduk:** Menampilkan daftar lengkap penduduk dengan fitur pencarian.
-   **Detail Penduduk:** Melihat biodata lengkap setiap penduduk.
-   **Manajemen Kartu Keluarga (KK):** Melihat daftar keluarga dan rincian anggota per KK.
-   **Statistik Desa:** Visualisasi data demografi dalam bentuk grafik (jumlah penduduk, jenis kelamin, kelompok usia, pekerjaan, dusun, dan jumlah KK).
-   **Galeri Desa:** Menampilkan album foto kegiatan desa yang dapat diatur oleh admin.

#### Khusus Admin:
-   **Admin Panel Terproteksi:** Halaman pengaturan yang hanya bisa diakses oleh pengguna dengan peran `admin`.
-   **Manajemen Pengguna:** Admin dapat menambah, mengedit (role & password), dan menghapus akun pengguna lain langsung dari panel.
-   **Manajemen Galeri Dinamis:** Admin dapat mengatur hingga 5 album foto dari folder Google Drive yang berbeda dan memilih album mana saja yang akan ditampilkan di halaman galeri.

---

## Teknologi yang Digunakan 🛠️

-   **Frontend:** HTML, CSS, JavaScript, [AdminLTE 3](https://adminlte.io/) (Template Dasbor), [jQuery](https://jquery.com/), [Chart.js](https://www.chartjs.org/) (Grafik).
-   **Backend:** [Google Apps Script (GAS)](https://developers.google.com/apps-script).
-   **Database:** [Google Sheets](https://www.google.com/sheets/about/).
-   **Hosting:** [Firebase Hosting](https://firebase.google.com/products/hosting).

---

## Panduan Instalasi & Konfigurasi 🚀

Ikuti langkah-langkah berikut untuk menjalankan aplikasi ini di akun Google dan Firebase Anda sendiri.

### Langkah 1: Persiapan Google Sheet (Database)

Ini adalah "jantung" dari data Anda.

1.  **Buat Google Sheet Baru:** Buka [sheets.google.com](https://sheets.google.com) dan buat spreadsheet baru. Beri nama, misalnya, "Database Desa Tombulang".
2.  **Salin ID Spreadsheet:** Buka spreadsheet tersebut. ID-nya ada di URL, contoh: `https://docs.google.com/spreadsheets/d/`**`INI_ADALAH_ID_NYA`**`/edit`. Salin ID ini.
3.  **Buat 3 Sheet (Lembar Kerja):**
    * **Sheet `DataPenduduk`:** Buat header kolom persis seperti urutan ini:
        `NIK`, `No KK`, `Nama`, `Tempat Lahir`, `Tanggal Lahir`, `Agama`, `Pekerjaan`, `Jenis Kelamin`, `Status Hubungan`, `Pendidikan Terakhir`, `Umur`, ... (kolom lain), `Dusun` (di kolom W).
    * **Sheet `SheetLoginWeb`:** Buat 3 header kolom: `Username`, `Password`, `Role`.
    * **Sheet `Pengumuman`:** Buat 5 header kolom: `ID`, `Judul`, `Isi`, `Tanggal`, `Status`.
4.  **Buat Akun Admin Pertama:** Di sheet `SheetLoginWeb`, isi baris pertama dengan data Anda. Contoh:
    -   Username: `admin`
    -   Password: `password_aman_anda`
    -   Role: `admin`

### Langkah 2: Konfigurasi Backend (Google Apps Script)

Kita akan membuat dua skrip: satu untuk data utama, satu lagi khusus untuk galeri.

#### A. Skrip GAS Utama (Login, Data, Admin)

1.  Buka [script.google.com](https://script.google.com) dan buat **proyek baru**.
2.  Salin **seluruh kode** dari file `gas_utama.js` dan tempelkan ke editor.
3.  **Ubah ID Sheet:** Di bagian paling atas skrip, ganti nilai `sheetId` dengan ID Spreadsheet yang Anda salin di Langkah 1.
4.  **Deploy Skrip:**
    * Klik **Deploy** > **New deployment**.
    * Klik ikon roda gigi, pilih **Web app**.
    * Pada "Who has access", pilih **"Anyone"**.
    * Klik **Deploy**.
    * Salin **URL Web app** yang muncul. Simpan di Notepad, beri nama "URL GAS UTAMA".

#### B. Skrip GAS Galeri

1.  Buat **proyek baru** lagi di [script.google.com](https://script.google.com).
2.  Salin **seluruh kode** dari file `gas_galeri.js` dan tempelkan ke editor.
3.  **Deploy Skrip:**
    * Lakukan proses *deployment* yang sama seperti di atas (Deploy > New deployment > Web app > Anyone).
    * Salin **URL Web app** yang muncul. Simpan di Notepad, beri nama "URL GAS GALERI".

### Langkah 3: Konfigurasi Frontend (Kode HTML)

1.  **Download Semua File HTML:** Pastikan Anda memiliki semua file (`index.html`, `main.html`, `keluarga.html`, `statistik.html`, `galeri.html`, `admin_panel.html`).
2.  **Update URL Skrip:** Buka setiap file HTML tersebut dengan editor teks.
    * Cari baris `const SCRIPT_URL = "URL_GAS_UTAMA_ANDA";` dan ganti dengan **URL GAS UTAMA** yang sudah Anda simpan.
    * Di file `galeri.html`, cari juga baris `const GALLERY_SCRIPT_URL = "URL_GAS_GALERI_ANDA";` dan ganti dengan **URL GAS GALERI**.

### Langkah 4: Publikasi ke Firebase Hosting

1.  **Install Firebase CLI:** Jika belum, install alat bantu Firebase dengan mengikuti [panduan resmi ini](https://firebase.google.com/docs/cli).
2.  **Login ke Firebase:** Buka terminal atau command prompt, lalu jalankan `firebase login`.
3.  **Inisialisasi Proyek:**
    * Buat sebuah folder baru di komputer Anda (misal, `proyek-simade`).
    * Letakkan semua file HTML yang sudah di-update ke dalam folder tersebut.
    * Buka terminal di dalam folder itu, lalu jalankan `firebase init`.
    * Pilih **Hosting: Configure files for Firebase Hosting...**.
    * Pilih proyek Firebase yang sudah ada atau buat yang baru.
    * Saat ditanya "What do you want to use as your public directory?", ketik `.` (satu titik) lalu Enter. Ini berarti folder saat ini adalah folder publik.
    * Jawab "No" untuk "Configure as a single-page app?".
4.  **Deploy ke Firebase:** Setelah inisialisasi selesai, jalankan perintah `firebase deploy`.
5.  Tunggu proses selesai, dan Firebase akan memberikan Anda URL website Anda yang sudah live!

---

## Panduan Penggunaan

1.  Buka URL website Anda dari Firebase.
2.  Login menggunakan akun `admin` yang Anda buat di Langkah 1.
3.  Setelah login, Anda akan melihat menu "PENGATURAN" di sidebar kiri. Klik **Admin Panel**.
4.  **Mengatur Galeri:** Masukkan nama album dan ID folder Google Drive Anda. Centang album yang ingin Anda tampilkan, lalu klik "Simpan".
5.  **Mengelola Pengguna:** Tambah atau edit pengguna lain. Pengguna dengan peran `user` tidak akan melihat menu "PENGATURAN".

---

## Struktur File


/
├── index.html            # Halaman Login
├── main.html             # Dasbor utama (daftar penduduk)
├── keluarga.html         # Halaman manajemen Kartu Keluarga
├── statistik.html        # Halaman statistik & grafik
├── galeri.html           # Halaman galeri foto
├── admin_panel.html      # Halaman pengaturan untuk admin
├── gas_utama.js          # Kode untuk Skrip GAS Utama
└── gas_galeri.js         # Kode untuk Skrip GAS Galeri


---

## Rencana Pengembangan

Proyek ini memiliki banyak ruang untuk berkembang. Beberapa ide fitur selanjutnya:
-   [ ] **Pengajuan Surat Online:** Warga bisa mengajukan surat keterangan dari website.
-   [ ] **Manajemen Data CRUD:** Admin bisa menambah/mengubah/menghapus data penduduk dari web.
-   [ ] **Papan Pengumuman:** Admin bisa mempublikasikan berita atau pengumuman.

Terima kasih telah menggunakan proyek ini!
