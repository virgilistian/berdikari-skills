# GUYUB — T0 infrastructure

Concrete, not directive (PRD §25). This is what runs on day one — see
`docs/17-guyub-prd.md` §25 for the reasoning and cost estimate, and
`docs/guyub-rencana-platform/fase-0-fondasi.md` F0.1 for how this fits the
plan.

## What's here, what isn't

| In this stack | Not in this stack |
|---|---|
| `nginx` (plain HTTP, TLS terminates at Cloudflare) | Postgres — managed instance with PITR, not a container |
| `api` (php-fpm, 4 static workers) | Kubernetes, service mesh, paid APM |
| `worker` (1x `queue:work`) | Second CDN, load balancer |
| `scheduler` (`schedule:work`) | Local staging that runs 24/7 |
| `redis` (`maxmemory 512mb`, `allkeys-lru`) | |

## VPS provisioning (one time)

1. Provision **2 vCPU · 4 GB RAM · 80 GB NVMe · Ubuntu 24.04 LTS**, in a
   Jakarta/Singapore region (latency to Karawang < 30 ms — PRD §25.1).
2. Install Docker Engine + Compose plugin.
3. Point DNS (via Cloudflare, proxied) at the VPS IP; set edge cache TTL to
   60 seconds for fast failover switching (PRD §19.4).
4. Provision managed Postgres (smallest tier with **PITR** enabled) and an
   S3-compatible bucket (e.g. Cloudflare R2 — free egress, PRD §25.6) in the
   same region.
5. Clone this repo onto the VPS (or pull just `berdikari-api/` + `infra/`).
6. `cp infra/.env.example infra/.env` and fill in every value — see that
   file for the full list. Do not commit `infra/.env`.

## Deploy

```bash
cd infra
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml run --rm api php artisan migrate --force
docker compose -f docker-compose.prod.yml up -d
```

Migration is a **deliberate one-off `run`**, not automatic on container
start — `api`/`worker`/`scheduler` all boot straight into their process
(`php-fpm` / `queue:work` / `schedule:work`), unlike the local dev
entrypoint which auto-migrates on every restart. Re-run the `migrate --force`
line on every deploy that ships a new migration, before `up -d`.

## Mandatory variables

See `infra/.env.example` — every line there must have a real value before
first deploy. Notably: `DB_*` (managed Postgres), `AWS_*` (object storage,
used for QRIS/handover/receipt photos and input attachments), `MAIL_*`
(real SMTP, not mailpit), `FIREBASE_CREDENTIALS` (merchant order alarm
depends on this — PRD §6.5), and `SENTRY_LARAVEL_DSN`.

`GUYUB_DATA_CONTROLLER_NAME`, `GUYUB_NIB`, `GUYUB_NPWP`, and
`GUYUB_CONTACT_ADDRESS` stay blank until F0.9 (legal checklist) produces a
real business entity — do not fill these with placeholder data, the privacy
policy (PRD §22) reads directly from `config/guyub-legal.php`.

## Not done yet (tracked, not forgotten)

- **Backup, DR runbook, credential custody** — F0.8, a live restore drill
  inside the RTO, not just a described process. Blocks the Phase 0 pass
  gate (`fase-0-fondasi.md` §Phase pass gate).
- **Legal checklist** (NIB, NPWP, PSE Kominfo, commission-only bank
  account) — F0.9, also blocks the pass gate and the public launch date.
- **Uptime monitor** — a free service *outside* this VPS (PRD §25.1: "monitors
  that die along with the server are useless"). Not wired up here.
- **OTP delivery has no real channel yet** — `GUYUB_OTP_PROVIDER=log` (the
  only driver that exists, `Modules/IAM/app/Services/Otp/LogOtpSender.php`)
  refuses to run outside `APP_ENV=production`, so registration/new-device
  login/PIN reset simply **cannot complete** until a real WhatsApp Business
  API / SMS gateway sender is added (external account, same category as the
  payment gateway) and `GUYUB_OTP_PROVIDER` points at it.
