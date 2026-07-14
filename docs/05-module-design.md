# Module Design & Boundaries

Arsitektur sistem dibangun di atas prinsip Modular Monolith. Setiap modul berfungsi layaknya microservice mini di dalam satu basis kode monolithic, memastikan decoupled boundaries.

## 1. Daftar Modul Backend (Laravel Modules)
- `Core`: Berisi trait tenancy (`Tenantable`), interface global, utilities, exception handler.
- `IAM` (Identity & Access Management): Autentikasi, Token generation, RBAC (Role-Based Access Control).
- `Catalog`: Manajemen Produk, Kategori, Varian.
- `Sales`: POS (Point of Sales), Proses Order, Manajemen Shift Kasir.
- `Inventory`: Manajemen stok, log pergerakan barang.
- `Finance`: Pencatatan kas masuk/keluar, reporting laba.
- `Purchasing`: Pembuatan pesanan pembelian ke supplier.
- `CRM`: Manajemen pelanggan UMKM.
- `Production`: Logika bisnis khusus untuk operasional Angkringan (Kalkulasi & Rekomendasi).

## 2. Aturan Batasan Modul (Module Boundaries)
1. **No Cross-Module Database Queries**: Modul `Sales` tidak diperbolehkan memanipulasi atau query langsung tabel milik `Inventory`.
2. **Komunikasi Antar Modul**: Menggunakan **Service Contracts** (Interface) jika membutuhkan synchronous data (e.g., mengecek stok sebelum order), dan **Event Dispatcher** untuk proses asynchronous (e.g., memotong stok setelah transaksi selesai).
3. **Frontend Layers**: Nuxt 3 akan meniru pemisahan ini menggunakan fitur Nuxt Layers agar state `Sales` terisolasi dari state `Finance`.
