# Berdikari ERP - System Architecture

## 1. Architectural Style
**Modular Monolith**: Aplikasi backend akan dikembangkan menggunakan Laravel 12 dengan arsitektur Modular Monolith (menggunakan package `nwidart/laravel-modules`). Pendekatan ini memastikan kode tetap terorganisir per domain bisnis, menghindari spaghetti code, dan memudahkan migrasi ke Microservices di masa depan jika skalabilitas menuntut hal tersebut.

## 2. Tech Stack Terpilih

### Frontend (Client-Side)
- **Framework**: Nuxt 3 (Vue.js) - Memberikan performa tinggi dengan mode rendering fleksibel dan kapabilitas PWA.
- **Styling**: TailwindCSS & Shadcn Vue - Mempercepat UI development dengan komponen yang modern dan konsisten.
- **State Management**: Pinia - Untuk mengelola state keranjang POS, sesi user, dan konfigurasi multi-branch.
- **Utilities**: VueUse - Koleksi Vue Composition API untuk interaksi reaktif tingkat lanjut.

### Backend (Server-Side)
- **Framework**: Laravel 12 - Framework PHP tangguh dengan ekosistem enterprise.
- **Architecture**: Modular Monolith, Repository Pattern, Service Pattern, Event-Driven.
- **Auth**: Laravel Sanctum (Token-based authentication).

### Infrastructure (Cloud & DevOps)
- **Database**: Supabase PostgreSQL - Solusi DBaaS yang menawarkan free tier kuat, dan mendukung relasi kompleks.
- **Cache / Queue**: Upstash Redis - Serverless Redis untuk caching dan antrean event tanpa biaya idle server.
- **Storage**: Cloudflare R2 - Penyimpanan S3-compatible tanpa biaya egress.
- **Deployment Frontend**: Cloudflare Pages - Hosting terdistribusi di Edge.
- **Deployment Backend**: Containerized (Docker) di-deploy ke PaaS gratis/murah (seperti Fly.io atau Vercel PHP runtime).
- **CI/CD**: GitHub Actions - Otomatisasi testing dan deployment.
