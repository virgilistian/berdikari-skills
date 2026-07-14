# Berdikari ERP - Business Requirements

## 1. Visi & Misi
Memberikan solusi ERP yang sangat mudah digunakan bagi UMKM di Indonesia, dengan bahasa pengantar Bahasa Indonesia, untuk membantu digitalisasi bisnis mulai dari skala mikro (seperti Angkringan) hingga menengah.

## 2. Tujuan Sistem (Objectives)
- **Sederhana & User-Friendly**: UI/UX didesain untuk pengguna awam (non-teknis).
- **Lokalisasi**: Sepenuhnya menggunakan Bahasa Indonesia.
- **Skalabilitas**: Mendukung Multi-Business dan Multi-Branch.
- **Efisiensi Biaya**: Menggunakan infrastruktur serverless dan gratis (pilot project).
- **Arsitektur Kuat**: Mengikuti prinsip DRY dan Modular Monolith yang scalable.

## 3. Fitur Utama & Modul
1. **Autentikasi**: Login, Register, Lupa Password.
2. **Multi Business**: Satu akun dapat mengelola banyak entitas bisnis.
3. **Multi Branch**: Setiap bisnis dapat memiliki banyak cabang/outlet.
4. **POS (Point of Sales)**: Sistem kasir cepat untuk transaksi harian.
5. **Manajemen Keuangan**: Arus kas, pemasukan, pengeluaran.
6. **Inventaris**: Manajemen stok, opname, pergerakan barang.
7. **Pembelian (Purchasing)**: Restock barang dari supplier.
8. **CRM**: Data pelanggan dan loyalitas.
9. **Pelaporan**: Laporan penjualan, laba-rugi, stok.
10. **Notifikasi**: Pemberitahuan real-time (stok menipis, tutup kasir).

## 4. Fitur Khusus: Daily Inventory untuk Angkringan
Alur operasional khusus yang menjembatani Kasir dan Tim Produksi:
1. **Tutup Kasir**: Kasir menyelesaikan operasional hari itu dan menekan tombol 'Tutup Kasir'.
2. **Kalkulasi Sistem**: Sistem menghitung total barang terjual dan sisa stok aktual.
3. **Rekomendasi Produksi**: Sistem menghasilkan rekomendasi jumlah produksi untuk keesokan harinya berdasarkan tren penjualan dan sisa stok.
4. **Notifikasi Produksi**: Tim produksi menerima rekomendasi tersebut.
5. **Input Produksi (Pagi)**: Tim produksi menginput jumlah aktual yang diproduksi hari ini, yang otomatis menambahkan stok awal hari di sistem.
