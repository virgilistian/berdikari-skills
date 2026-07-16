# Panduan Instalasi — Ekstensi Isi Otomatis SIPADI

Ekstensi ini membantu mengisi formulir Laporan Pajak di SIPADI secara
otomatis, memakai data dari laporan pajak yang sudah dibuat di Berdikari.
Anda tetap harus memeriksa dan mengirim laporan secara manual — ekstensi ini
**tidak pernah** mengirim (submit) laporan dan **tidak pernah** menyimpan
kata sandi SIPADI Anda.

## Yang Perlu Disiapkan

- Google Chrome atau Microsoft Edge.
- Folder ekstensi `extensions/sipadi-autofill` (ada di dalam repo Berdikari).

## Langkah 1 — Aktifkan Mode Pengembang

**Di Google Chrome:**
1. Buka Chrome, ketik `chrome://extensions` di kolom alamat, lalu tekan Enter.
2. Di pojok kanan atas, aktifkan tombol **Developer mode** (Mode Pengembang).

**Di Microsoft Edge:**
1. Buka Edge, ketik `edge://extensions` di kolom alamat, lalu tekan Enter.
2. Di pojok kiri bawah, aktifkan tombol **Developer mode** (Mode Pengembang).

## Langkah 2 — Pasang Ekstensi

1. Klik tombol **Load unpacked** (Muat yang belum dikemas).
2. Pilih folder `extensions/sipadi-autofill` di komputer Anda.
3. Ekstensi **"Berdikari SIPADI Autofill"** akan muncul di daftar ekstensi.

## Langkah 3 — Cara Menggunakan

1. Buka situs SIPADI (`https://sipadi.karawangkab.go.id`), lalu login seperti
   biasa.
2. Buka halaman **Lapor Pajak** untuk objek pajak dan bulan/tahun yang ingin
   diisi.
3. Di tab lain, buka aplikasi **Berdikari ERP**, lalu buka menu **Pajak**.
4. Buka laporan pajak yang datanya ingin dipakai untuk mengisi SIPADI.
5. Klik tombol **"Isi Otomatis SIPADI"**.
6. Browser akan otomatis pindah ke tab SIPADI dan mengisi kolom pendapatan
   harian.
7. **Periksa kembali semua angka yang terisi** sebelum menekan tombol Kirim
   di SIPADI. Ekstensi ini **tidak pernah** menekan tombol kirim/submit
   secara otomatis — itu harus Anda lakukan sendiri setelah memeriksa data.

## Jika Muncul Pesan Error

| Pesan | Artinya & Solusinya |
|---|---|
| "Ekstensi tidak terdeteksi" | Ekstensi belum terpasang/aktif. Ulangi Langkah 2, lalu muat ulang (refresh) halaman Berdikari ERP. |
| "Tab SIPADI tidak ditemukan" | Pastikan Anda sudah membuka dan login ke SIPADI di tab browser yang sama. |
| "Masa pajak di SIPADI tidak cocok" | Buka objek pajak SIPADI untuk bulan dan tahun yang sesuai dengan laporan yang dipilih di Berdikari, lalu coba lagi. |
| "Tidak ada tab SIPADI yang menampilkan formulir Lapor Pajak" | Anda mungkin membuka halaman SIPADI yang bukan formulir Lapor Pajak (misalnya halaman detail objek pajak). Buka formulir Lapor Pajak-nya terlebih dahulu. |

## Jika Ekstensi Diperbarui

Setiap kali ada pembaruan kode ekstensi (file di dalam folder
`extensions/sipadi-autofill` berubah):

1. Buka `chrome://extensions` (atau `edge://extensions`).
2. Klik ikon **reload/muat ulang** pada kartu **Berdikari SIPADI Autofill**.
3. Muat ulang (refresh) tab SIPADI dan tab Berdikari ERP yang sedang terbuka.

Tanpa langkah ini, browser akan tetap memakai versi ekstensi yang lama.

## Keamanan

- Ekstensi ini **tidak pernah** meminta atau menyimpan kata sandi SIPADI Anda.
- Ekstensi ini **tidak pernah** mengirim (submit) laporan secara otomatis —
  Anda yang memutuskan kapan laporan dikirim.
- Ekstensi ini hanya aktif di situs Berdikari ERP dan SIPADI, tidak di situs
  lain.
