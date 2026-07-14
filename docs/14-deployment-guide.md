# Deployment Guide

## 1. Persiapan Infrastruktur (Credentials)
- **Supabase**: Buat project baru. Ekstrak kredensial `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`.
- **Upstash Redis**: Buat basis data serverless, ambil `REDIS_URL`.
- **Cloudflare R2**: Buat bucket `berdikari-media`, catat Endpoint S3, Access Key, dan Secret Key.

## 2. Konfigurasi CI/CD (GitHub Actions)

### A. Frontend (Nuxt 3) -> Cloudflare Pages

#### Langkah 1 — Konfigurasi Nuxt untuk Cloudflare Pages

Tambahkan preset Cloudflare Pages di `web/nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],
  css: ['~/assets/css/tailwind.css'],

  nitro: {
    preset: 'cloudflare-pages',
  },
})
```

> Preset ini menginstruksikan Nitro untuk menghasilkan output yang kompatibel dengan Cloudflare Pages (SSR via Workers + static assets).

---

#### Langkah 2 — Tambahkan file `_routes.json` (opsional, untuk kontrol routing)

Buat file `web/public/_routes.json` jika ingin mengecualikan rute static dari Workers:

```json
{
  "version": 1,
  "include": ["/*"],
  "exclude": ["/favicon.ico", "/_nuxt/*", "/robots.txt"]
}
```

---

#### Langkah 3 — Build lokal untuk verifikasi

```bash
cd web
npm install
npm run build   # menggunakan nitro preset cloudflare-pages
```

Output akan berada di `.output/`:
- `.output/public/` — static assets
- `.output/server/` — Cloudflare Worker script

---

#### Langkah 4 — Hubungkan Repositori ke Cloudflare Pages (Dashboard)

1. Buka [https://dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create application** → **Pages**.
2. Klik **Connect to Git** → pilih repositori GitHub `berdikari`.
3. Isi konfigurasi build:

| Field | Value |
|---|---|
| **Production branch** | `main` |
| **Root directory** | `web` |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |
| **Deploy command** | `echo done` |
| **Node.js version** | `20` |

> **Penting:** Deploy command cukup `echo done` (atau kosongkan jika field tidak wajib). Cloudflare Pages Git integration **otomatis men-deploy** dari build output directory setelah build selesai — tidak perlu memanggil `wrangler pages deploy` secara manual. Menjalankan `wrangler pages deploy` di sini akan gagal dengan error *"Project not found"* karena nama project auto-generate Nitro tidak cocok dengan project yang ada di dashboard.

4. Tambahkan **Environment variables** (lihat Langkah 5).
5. Klik **Save and Deploy**.

---

#### Langkah 5 — Environment Variables di Cloudflare Dashboard

Masuk ke **Settings → Environment variables** pada project Pages Anda, lalu tambahkan:

| Variable | Value |
|---|---|
| `NUXT_PUBLIC_API_BASE` | URL backend (misal: `https://api.berdikari.fly.dev`) |
| `NODE_VERSION` | `20` |

> Variabel dengan prefix `NUXT_PUBLIC_` akan di-expose ke client-side. Variabel tanpa prefix hanya tersedia di server (Worker).

---

#### Langkah 6 — Deploy via GitHub Actions (CI/CD otomatis)

Buat file `.github/workflows/deploy-frontend.yml`:

```yaml
name: Deploy Frontend to Cloudflare Pages

on:
  push:
    branches: [main]
    paths: [web/**]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: web/package-lock.json

      - name: Install dependencies
        working-directory: web
        run: npm ci

      - name: Build
        working-directory: web
        run: npm run build
        env:
          NUXT_PUBLIC_API_BASE: ${{ secrets.NUXT_PUBLIC_API_BASE }}

      - name: Publish to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy web/dist --project-name=berdikari-web --branch=main
```

Tambahkan secrets berikut di **GitHub → Settings → Secrets and variables → Actions**:

| Secret | Cara mendapatkan |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare Dashboard → **My Profile → API Tokens** → **Create Token** → pilih **"Create Custom Token"** → tambahkan permission: **Account > Cloudflare Pages > Edit** → simpan |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Dashboard → **Workers & Pages** → Account ID (sisi kanan) |
| `NUXT_PUBLIC_API_BASE` | URL backend Laravel Anda |

> **Penting:** Jangan gunakan template *"Edit Cloudflare Workers"* — template itu tidak mencakup Pages API. Harus buat **Custom Token** dengan permission `Cloudflare Pages: Edit` secara eksplisit.

---

#### Langkah 7 — Custom Domain (opsional)

1. Di Cloudflare Pages → project → **Custom domains** → **Set up a custom domain**.
2. Masukkan domain (misal: `app.berdikari.id`).
3. Karena domain sudah di Cloudflare, DNS record akan ditambahkan otomatis.

---

#### Langkah 8 — Verifikasi Deployment

- Buka URL Pages (`https://berdikari.pages.dev` atau custom domain).
- Cek **Deployments** tab untuk log build.
- Gunakan Cloudflare **Real-time Logs** (Workers → Logs) untuk debug Worker errors.

### B. Backend (Laravel 12) -> Docker (Fly.io)
Laravel membutuhkan env PHP yang konsisten.
1. Gunakan file `Dockerfile` bawaan Laravel (Sail/Octane) di root direktori backend.
2. Setup workflow GitHub Actions (`.github/workflows/deploy-backend.yml`).
3. Pipeline akan menjalankan testing, build Docker image, dan push command `flyctl deploy` (memanfaatkan Fly.io free tier).

## 3. Menjalankan Lokal (Development)
Developer baru dapat menggunakan **Docker Compose**. Tersedia file `docker-compose.yml` yang berisi spesifikasi:
- Layanan Aplikasi: Nginx + PHP-FPM 8.3
- Layanan Data: PostgreSQL
- Layanan Cache: Redis

Cukup eksekusi `docker compose up -d` lalu kerjakan frontend dengan `npm run dev`.
