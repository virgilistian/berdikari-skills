# Sprint Planning (Phase 1)
Mengacu pada siklus rilis gesit, diasumsikan 1 Sprint = 1 Minggu.

## Sprint 1: Setup & Foundation
- Inisialisasi Repository, konfigurasi GitHub Actions.
- Bootstrapping Laravel 12 Modules & Nuxt 3 Layers.
- Desain Skema Supabase, Migrations & Tenancy Scope.
- Implementasi API IAM (Login, Register, User Context).

## Sprint 2: Master Data & Basic UI
- Pengembangan Modul Catalog (CRUD Produk, Kategori, Harga).
- Setup Arsitektur UI PWA (Shadcn Vue Layouting, Navigasi Mobile-First).
- Pengembangan Modul Inventory (Pengecekan Stok & Mutasi dasar).

## Sprint 3: POS Core Engine
- Implementasi UI Kasir (Product Grid, Keranjang, Pinia State).
- Integrasi Checkout ke Backend (Sales Module).
- Pembuatan Event arsitektur `SaleOrderCompleted`.

## Sprint 4: The Angkringan Magic & UAT
- Pembuatan alur "Tutup Kasir".
- Pembuatan logika algoritma Rekomendasi Produksi Harian.
- Desain Tampilan UI khusus Tim Produksi.
- UAT (User Acceptance Testing) internal.
- Stabilisasi PWA (Offline Support caching) & Deployment ke CF Pages / Fly.io.
