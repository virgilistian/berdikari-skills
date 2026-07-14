# Infrastructure Design

Mengakomodasi kebutuhan "Serverless and Free Infrastructure" untuk Pilot Project.

## 1. Arsitektur Deployment (Pilot)

- **Frontend (Nuxt 3 PWA)**:
  - **Host**: Cloudflare Pages
  - **Alasan**: Kuota gratis besar, CDN global otomatis, mendukung build statis (SSG) atau edge-rendered SSR dengan biaya nyaris nol.

- **Backend (Laravel 12 API)**:
  - **Host**: Vercel (via vercel-php) atau Fly.io (Docker)
  - **Alasan**: Laravel tradisional butuh VPS on-demand. Menggunakan Vercel dengan PHP serverless menekan biaya idle. Alternatifnya, menggunakan Fly.io free tier dengan kontainer Docker ringan.
  - *Saran Arsitektural*: Kami merekomendasikan Docker di Fly.io untuk menjaga persistensi queue worker.

- **Database**:
  - **Host**: Supabase (PostgreSQL)
  - **Alasan**: Tier gratis yang melimpah (500MB DB, 2 CPU cores), fitur standar enterprise, dan integrasi API yang bagus jika dibutuhkan.

- **Cache & Message Queue**:
  - **Host**: Upstash (Serverless Redis)
  - **Alasan**: Cocok untuk event bus dan caching. Pembayaran berdasarkan penggunaan (Pay-per-request), bebas biaya server nganggur.

- **File Storage**:
  - **Host**: Cloudflare R2
  - **Alasan**: 10GB penyimpan gratis per bulan, S3 API compatible, dan tidak ada biaya egress (gratis menampilkan gambar struk/produk berulang kali).
