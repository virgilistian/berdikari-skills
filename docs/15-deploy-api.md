# Deploy berdikari-api — Panduan Langkah demi Langkah

Panduan ini mencakup dua skenario:
- **A. Lokal** — menjalankan API di Docker Compose untuk development
- **B. Produksi** — deploy ke Fly.io (Docker) dengan Supabase + Upstash + Cloudflare R2

---

## A. Lokal (Docker Compose)

### Langkah 1 — Prasyarat

| Tool | Versi minimum |
|---|---|
| Docker Desktop | 4.x |
| Git | 2.x |

> Semua perintah PHP/Composer dijalankan **di dalam container** — tidak perlu instalasi PHP di host.

### Langkah 2 — Clone & masuk ke direktori

```bash
git clone https://github.com/<org>/berdikari.git
cd berdikari
```

### Langkah 3 — Tambahkan entri hosts (satu kali)

```bash
echo "127.0.0.1 berdikari.test" | sudo tee -a /etc/hosts
```

### Langkah 4 — Jalankan semua service

```bash
docker compose up -d
```

Perintah ini akan:
1. Build image `api` dari `berdikari-api/Dockerfile`
2. Menjalankan `entrypoint.sh` yang secara otomatis:
   - `composer install`
   - Generate `APP_KEY` jika kosong
   - `php artisan migrate --force`
   - `php artisan db:seed` (IAM seeder)
   - `php artisan storage:link`
3. Menjalankan `php artisan serve --host=0.0.0.0 --port=8000`

### Langkah 5 — Verifikasi

```bash
# Cek semua container berjalan
docker compose ps

# Health check API
curl -s http://localhost:8000/api/v1/health | jq .

# Atau via Nginx reverse proxy
curl -s http://berdikari.test/api/v1/health | jq .
```

### Langkah 6 — Jalankan perintah Artisan

Selalu gunakan `docker compose exec`, bukan host langsung:

```bash
# Migrasi
docker compose exec api php artisan migrate

# Rollback
docker compose exec api php artisan migrate:rollback

# Buat seeder
docker compose exec api php artisan db:seed --class="Modules\\IAM\\Database\\Seeders\\IAMDatabaseSeeder"

# Clear cache
docker compose exec api php artisan config:clear && \
  docker compose exec api php artisan cache:clear && \
  docker compose exec api php artisan route:clear

# Tinker
docker compose exec -it api php artisan tinker
```

### Langkah 7 — Hentikan service

```bash
docker compose down          # hentikan, pertahankan volume
docker compose down -v       # hentikan + hapus semua volume (reset DB)
```

---

## B. Produksi — Fly.io + Supabase + Upstash + Cloudflare R2

### Langkah 1 — Siapkan infrastruktur eksternal

#### 1a. Supabase (PostgreSQL)
            
1. Buka [https://supabase.com](https://supabase.com) → **New project**.
2. Catat kredensial dari **Project Settings → Database**:
   - `DB_HOST` (host Connection Pooling — **Transaction mode**, port 6543)
   - `DB_PORT` = `6543`
   - `DB_DATABASE` = `postgres`
   - `DB_USERNAME` = `postgres.<project-ref>`
   - `DB_PASSWORD` = password yang Anda set saat buat project

#### 1b. Upstash (Redis)

1. Buka [https://upstash.com](https://upstash.com) → **Create Database** → pilih region terdekat.
2. Catat **Redis URL** format: `rediss://default:<password>@<host>:<port>`
3. Pisahkan menjadi env:
   - `REDIS_HOST` = `<host>`
   - `REDIS_PORT` = `<port>`
   - `REDIS_PASSWORD` = `<password>`
   - `REDIS_CLIENT` = `predis`

#### 1c. Cloudflare R2 (File Storage)

1. Buka [Cloudflare Dashboard](https://dash.cloudflare.com) → **R2** → **Create bucket** → nama: `berdikari-media`.
2. Buka **R2 → Manage R2 API Tokens** → **Create API Token** dengan permission **Object Read & Write**.
3. Catat:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_ENDPOINT` = `https://<account-id>.r2.cloudflarestorage.com`
   - `AWS_BUCKET` = `berdikari-media`
   - `AWS_DEFAULT_REGION` = `auto`
   - `AWS_USE_PATH_STYLE_ENDPOINT` = `true`

---

### Langkah 2 — Siapkan Fly.io

```bash
# Install flyctl (macOS)
brew install flyctl

# Login
fly auth login

# Masuk ke direktori API
cd berdikari-api

# Inisialisasi app (sekali saja)
fly launch --name berdikari-api --region sin --no-deploy
```

> Pilih region `sin` (Singapore) untuk latensi rendah dari Indonesia.
> Jawab **No** saat ditanya deploy sekarang.

Fly.io akan membuat file `fly.toml` di `berdikari-api/`. Sesuaikan seperti ini:

```toml
app = "berdikari-api"
primary_region = "sin"

[build]

[http_service]
  internal_port = 8000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

  [[http_service.checks]]
    grace_period = "30s"
    interval = "15s"
    method = "GET"
    path = "/api/v1/health"
    timeout = "10s"

[[vm]]
  size = "shared-cpu-1x"
  memory = "512mb"
```

---

### Langkah 3 — Set environment variables di Fly.io

Jalankan dari direktori `berdikari-api/`:

```bash
fly secrets set \
  APP_NAME="Berdikari" \
  APP_ENV="production" \
  APP_DEBUG="false" \
  APP_URL="https://berdikari-api.fly.dev" \
  APP_LOCALE="id" \
  APP_FALLBACK_LOCALE="id" \
  LOG_CHANNEL="stderr" \
  LOG_LEVEL="error" \
  DB_CONNECTION="pgsql" \
  DB_HOST="<supabase-host>" \
  DB_PORT="6543" \
  DB_DATABASE="postgres" \
  DB_USERNAME="postgres.<project-ref>" \
  DB_PASSWORD="<supabase-password>" \
  SESSION_DRIVER="redis" \
  SESSION_LIFETIME="120" \
  QUEUE_CONNECTION="redis" \
  CACHE_STORE="redis" \
  REDIS_CLIENT="predis" \
  REDIS_HOST="<upstash-host>" \
  REDIS_PORT="<upstash-port>" \
  REDIS_PASSWORD="<upstash-password>" \
  FILESYSTEM_DISK="s3" \
  AWS_ACCESS_KEY_ID="<r2-access-key>" \
  AWS_SECRET_ACCESS_KEY="<r2-secret-key>" \
  AWS_DEFAULT_REGION="auto" \
  AWS_BUCKET="berdikari-media" \
  AWS_USE_PATH_STYLE_ENDPOINT="true" \
  AWS_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com" \
  FRONTEND_URL="https://berdikari.pages.dev"
```

> `APP_KEY` akan di-generate otomatis oleh `entrypoint.sh` saat container pertama kali berjalan.
> Untuk set manual: `fly secrets set APP_KEY="$(php artisan key:generate --show)"`

---

### Langkah 4 — Deploy pertama kali

```bash
cd berdikari-api
fly deploy
```

Fly.io akan:
1. Build Docker image dari `berdikari-api/Dockerfile`
2. Push image ke registry Fly.io
3. Jalankan container baru
4. `entrypoint.sh` otomatis menjalankan `migrate` dan `db:seed`
5. API live di `https://berdikari-api.fly.dev`

### Langkah 5 — Verifikasi produksi

```bash
# Health check
curl https://berdikari-api.fly.dev/api/v1/health

# Lihat log real-time
fly logs -a berdikari-api

# SSH masuk ke container (debug)
fly ssh console -a berdikari-api
```

---

### Langkah 6 — CI/CD dengan GitHub Actions

Buat file `.github/workflows/deploy-api.yml`:

```yaml
name: Deploy API to Fly.io

on:
  push:
    branches: [main]
    paths:
      - 'berdikari-api/**'
      - '.github/workflows/deploy-api.yml'

jobs:
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: berdikari_test
          POSTGRES_USER: berdikari
          POSTGRES_PASSWORD: secret
        ports: ["5432:5432"]
        options: >-
          --health-cmd pg_isready
          --health-interval 5s
          --health-timeout 5s
          --health-retries 10

    steps:
      - uses: actions/checkout@v4

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.3'
          extensions: pdo, pdo_pgsql, redis, bcmath, mbstring, xml, zip, intl

      - name: Install dependencies
        working-directory: berdikari-api
        run: composer install --no-interaction --prefer-dist --optimize-autoloader

      - name: Copy .env
        working-directory: berdikari-api
        run: |
          cp .env.example .env
          sed -i 's/DB_CONNECTION=sqlite/DB_CONNECTION=pgsql/' .env
          echo "DB_HOST=127.0.0.1" >> .env
          echo "DB_PORT=5432" >> .env
          echo "DB_DATABASE=berdikari_test" >> .env
          echo "DB_USERNAME=berdikari" >> .env
          echo "DB_PASSWORD=secret" >> .env

      - name: Generate key & migrate
        working-directory: berdikari-api
        run: |
          php artisan key:generate
          php artisan migrate --force

      - name: Run tests
        working-directory: berdikari-api
        run: php artisan test

  deploy:
    name: Deploy to Fly.io
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Deploy
        uses: superfly/flyctl-actions/setup-flyctl@master

      - run: flyctl deploy --remote-only --config berdikari-api/fly.toml
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

Tambahkan secret di **GitHub → Settings → Secrets and variables → Actions**:

| Secret | Cara mendapatkan |
|---|---|
| `FLY_API_TOKEN` | `fly tokens create deploy -a berdikari-api` |

---

### Langkah 7 — Deploy ulang (update)

Setiap push ke `main` akan men-trigger workflow otomatis. Deploy manual:

```bash
cd berdikari-api
fly deploy
```

### Langkah 8 — Rollback

```bash
# Lihat versi yang tersedia
fly releases -a berdikari-api

# Rollback ke versi sebelumnya
fly deploy --image <image-id>
```

---

## Referensi Cepat

| Perintah | Fungsi |
|---|---|
| `docker compose up -d` | Jalankan semua service lokal |
| `docker compose exec api php artisan migrate` | Jalankan migrasi (lokal) |
| `fly deploy` | Deploy ke Fly.io (produksi) |
| `fly logs -a berdikari-api` | Lihat log produksi |
| `fly ssh console -a berdikari-api` | SSH ke container produksi |
| `fly secrets set KEY=value` | Set env var produksi |
| `fly scale count 0 -a berdikari-api` | Stop semua machine (hemat cost) |
| `fly scale count 1 -a berdikari-api` | Hidupkan kembali |
