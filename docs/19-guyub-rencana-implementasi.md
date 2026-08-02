#19 — GUYUB — Implementation Plan per Feature, per File, per Phase

**Derivative of** `docs/17-guyub-prd.md` (PRD) and `docs/18-guyub-spesifikasi-fitur.md` (screen).
PRD answers *why & rules*. Document 18 answers *what screen*. This document answers **"what files I touched this week, and when they were considered complete"**.

If there is a conflict: **PRD wins**, then document 18, then this document.

**Broken per platform & per phase**: `docs/guyub-rencana-platform/` — this document is reorganized into one file per phase, with each feature broken down into API · Web · Customer · Merchant · Driver. Starting from [`00-indeks.md`](guyub-plan-platform/00-index.md).

**Status**: v1.0-draft. Phase & week sequence follows **PRD §37.3** and phase contents follow **PRD §12**. The file name is the plan — locked when the file is first created.

---

## 0 — How to read

### 0.1 Legend

| Sign | Meaning |
|---|---|
| `+` | **new** file |
| `~` | **Existing file, modified** (add, not refactor — PRD §2.4) |
| `api/` | `berdikari-api/` |
| `web/` | `berdikari-web/` |
| `mob/` | `guyub-mobile/` (own git repo, melos — PRD §6.5) |
| `infra/` | `infra/guyub/` in root repo |

Migrations are written without the timestamp prefix (`…_create_x_table.php`); timestamp is filled when `make:migration` is executed.

### 0.2 Layer conventions (follow Independent DNA §3, do not deviate)

**API** — inside `api/Modules/<Nama>/`:

```
routes/api.php · app/Http/Controllers · app/Http/Requests · app/Http/Resources
app/Services · app/Actions · app/Models · app/Policies · app/Events · app/Jobs
app/Contracts        ← satu-satunya pintu masuk modul lain (sinkron)
database/migrations · database/seeders
```

**Flutter** — follows the pattern `berdikari-mobile/lib/`:

```
lib/main.dart · lib/app.dart · lib/routing/router.dart · lib/l10n/
lib/data/{models,repositories,services,local}
lib/ui/core/{theme,widgets,navigation} · lib/ui/features/<fitur>/
```

**Web** — `web/app/{pages,stores,components,layouts,composables,config/nav.ts}`.

### 0.3 Two route spaces in `berdikari-web` (decision, confirmation before Phase 0 completes)

| Space | File | Public URL | Auth |
|---|---|---|---|
| **GUYUB Profile Web** (PRD §20) | `web/app/pages/publik/**` | `guyub.<domain>/…` via rewrite Pages Function | No |
| **Ops Console** (PRD §6.6) | `web/app/pages/guyub/**` | `<app-domain>/guyub/…` | Sanctum + `guyub-ops` |

Rewrite host → prefix is ​​in `web/functions/_middleware.ts`, so `/w/<slug>` in PRD remains `guyub.<domain>/w/<slug>` even though the file is in `pages/publik/w/[slug].vue`.

### 0.4 Rules that apply to **every** feature below (not repeated per row)

1. Money value, stock, quota → **server calculated**, idempotent, audit logged (PRD Inv. 2, §16.3).
2. Every mutation `POST` → `Idempotency-Key` is mandatory (PRD Inv. 4).
3. New permission → `api/Modules/IAM/database/seeders/PermissionSeeder.php` + `web/app/utils/permissions.ts`, no wildcard, **and test rejection path** (DNA §9j.8).
4. Public endpoint → only touches projection table `*_public_*` (PRD §6.3).
5. Resource API is always **explicit field list**, never model `toArray()`.
6. Indonesian copy passes PRD §17; no hard strings in widgets (all in ARB).
7. Each screen has a state of **loading / blank / failed + try again** + 5 character trace code (PRD §31.2).
8. Test the feature in `api/tests/Feature/Guyub/` and test the widget/viewmodel in the related app.

### 0.5 Rhythm (PRD §37.2, §37.7)

Every Monday: **one day for field/legal** before touching code. Friday: tag + show one stall owner. One number to monitor: current week vs planned week; miss > 3 weeks → **cut next phase scope**, not overtime.

---

## 1 — Phase summary

| Phase | Sunday | Calendar | Tags | Core content |
|---|---|---|---|---|
| [0 — Foundation](#2--phase-0--foundation) | 1–6 | Aug–Sep 2026 | `v0.1.0` | Scaffold module, auth PIN, operating hours, Flutter monorepo, merchant alarm, web profile, legal & custody |
| [1 — Culinary](#3--phase-1--culinary-pick-your-own--courier-merchant) | 7–20 | Sep–Dec 2026 | `v0.2.0` | Catalog+variants, basket, QRIS unique nominal, COD, state machine, ETA, merchant courier, discovery, input |
| → Public launch | 21–22 | Dec 2026 | — | Go/No-Go §26.5 |
| [2 — GUYUB Courier](#4--phase-2--guyub-courier) | 23–35 | Jan–Mar 2027 | `v0.3.0` | Driver app, dispatch, zone tariff, cash delivery, Quick Order, OTP, tracking, assessment |
| [3 — Services + Buy-Tip](#5--phase-3--ojek-services--courier--buy-tip) | 36–43 | Apr–May 2027 | `v0.4.0` | Motorbike taxi/courier, Travel Directory, Buy and Sell, batching, "Highlight 7 days" manual |
| [4 — Ticket + Cashier](#6--phase-4--tour-ticket--light-cashier) | 44–53 | Jun–Aug 2027 | `v0.5.0` | Ticketing, QR Ed25519, scan offline, lightweight POS |
| [5 — Money & Premium](#7--phase-5--money-premium--ops) | 54–62 | Aug–Oct 2027 | `v0.6.0` | Commissions, subscriptions, sponsored slots, broadcasts, full Ops Console |
| [6 — Hardening](#8--phase-6--hardening--release) | 63–68 | Oct–Nov 2027 | `v1.0.0` | State audit, offline resilience, load, restore drill, Play Store |

**Can be shifted if left behind**: Ticket (F4), Light Cashier (F4), Full Premium (F5), Purchase Deposit (F3).
**No swipe**: payment gateway (§5h), security controls §9, legal checklist §22.8, restore practice §19.3, input channels §28.

---

## 2 — PHASE 0 — Foundation

**Week 1–6 · Aug–Sep 2026 · tag `v0.1.0`**
**Gate pass**: green §37.5 vertical spikes on a real cheap Android phone; first recorded restore exercise; legal checklist §22.8 completed.

The order of work follows PRD §37.4 — **F0.1 → F0.9 sequentially**, as each one overlaps the previous one.

---

### F0.1 — Repo, CI, Docker, and `config-as-data` (week 1)

> Reference: PRD §25.2, §30.4, §31.1. Six things must be included in the data from the first line: brand, zone & place, rate matrix, commission & packages, Ops contact, legal text.

| File | Action | Contents |
|---|---|---|
| `docker-compose.yml` | `~` | Add services `worker` (`queue:work`) & `scheduler` (`schedule:work`) using image `api`; `redis` `maxmemory 512mb allkeys-lru` |
| `api/config/guyub.php` | `+` | Brand, Ops contact, `Asia/Jakarta` time zone, time limits (pay 15 min, claim 60 min, merchant response 5 min, pick up limit 60 min), default commission, plans & pricing |
| `api/config/guyub-errors.php` | `+` | Single source of truth `GYB-<AREA>-<KELAS><NNN>` code: code → technical explanation + Language copy (§31.1). Blank first, fill in per feature |
| `api/config/guyub-fares.php` | `+` | Rate parameters: `harga_bensin`, `konsumsi_km_per_liter`, `perawatan_per_km`, `upah_waktu_per_jam` (§35.3) |
| `api/config/guyub-legal.php` | `+` | Data controller name, NIB/PSE, contact address — referenced legal & application page |
| `api/app/Http/Middleware/RequestId.php` | `+` | ULID per request → `X-Request-Id` header, log context log & Sentry tag (§31.2) |
| `api/bootstrap/app.php` | `~` | Register `RequestId` in the `api` | group
| `api/config/logging.php` | `~` | Channel `guyub`: one JSON line, fixed field §31.3; **reject list** cellphone number/PIN/OTP/token/body auth & payment |
| `api/modules_statuses.json` | `~` | Enable `Merchant`, `Marketplace`, `Ordering`, `Delivery`, `Payment` |
| `.github/workflows/guyub-api.yml` | `+` | Pest/PHPUnit + Pint + migrate fresh in Postgres service |
| `.github/workflows/guyub-mobile.yml` | `+` | `melos bootstrap` → `analyze` → `test` |
| `infra/docker-compose.prod.yml` | `+` | T0 stack §25.2 (nginx, api 4 workers `pm=static`, worker, scheduler, redis) |
| `infra/README.md` | `+` | How to provision a T0 VPS + mandatory variables |

**Done when**: `docker compose up` runs worker & scheduler; CI is green in both repos; there is not a single business number (commission, rates, time limits) written in the code.

---

### F0.2 — Auth: 6-digit PIN, Argon2id + pepper, throttling, device binding (weeks 1–2)

> Reference: PRD §36.4, §36.5, findings #6 & #36. **All other features ride on this** — do it before anything else.

| File | Action | Contents |
|---|---|---|
| `api/Modules/IAM/database/migrations/…_add_guyub_auth_to_users_table.php` | `+` | `phone` (unique), `phone_verified_at`, `pin_hash`, `pin_updated_at` |
| `api/Modules/IAM/database/migrations/…_create_guyub_devices_table.php` | `+` | `user_id`, `device_id`, `nama_perangkat`, `last_seen_at`, `trusted_at` |
| `api/Modules/IAM/database/migrations/…_create_guyub_otp_codes_table.php` | `+` | OTP hash, destination (`daftar`/`perangkat_baru`/`reset_pin`), expiration, number of attempts |
| `api/Modules/IAM/app/Models/GuyubDevice.php` | `+` | Device model |
| `api/Modules/IAM/app/Services/PinService.php` | `+` | Argon2id + **pepper from `config/guyub.php`** (env, not DB); `hash()`, `verify()`, `rejectWeak()` |
| `api/Modules/IAM/app/Support/weak_pins.php` | `+` | 100 most common PINs + repeating/sequential patterns/birth year (§36.4.3) |
| `api/Modules/IAM/app/Services/PinThrottleService.php` | `+` | Layered 5/10/15 on Redis, calculated per **account + device + IP** |
| `api/Modules/IAM/app/Services/OtpService.php` | `+` | Issue/verify OTP; `OtpSender` interface with **WA-first, SMS-fallback chain** (~10–15s timeout, no user-facing channel choice — PRD §36.6) |
| `api/Modules/IAM/app/Services/DeviceBindingService.php` | `+` | New device → required OTP + **notify old device** |
| `api/Modules/IAM/app/Http/Controllers/GuyubAuthController.php` | `+` | `register`, `otp`, `login`, `set-pin`, `forgot-pin`, `me` |
| `api/Modules/IAM/app/Http/Requests/Guyub/*.php` | `+` | `RegisterRequest`, `RequestOtpRequest`, `LoginRequest`, `SetPinRequest` |
| `api/Modules/IAM/routes/api.php` | `~` | `/guyub/auth/*` group + rate limit per number/device/IP |
| `api/Modules/IAM/database/seeders/PermissionSeeder.php` | `~` | All `guyub_*` permissions (PRD §9 RBAC) + roles `guyub-customer`, `guyub-driver`, `guyub-merchant-owner/staff/courier`, `guyub-ops` |
| `api/.env.example` | `~` | `GUYUB_PIN_PEPPER`, `GUYUB_OTP_PROVIDER_PRIMARY` (default `whatsapp`), `GUYUB_OTP_PROVIDER_FALLBACK` (default `sms`) |
| `api/tests/Feature/Guyub/AuthPinTest.php` | `+` | Weak PIN rejected; pepper is used; hash never goes well without pepper |
| `api/tests/Feature/Guyub/AuthThrottleTest.php` | `+` | 5/10/15 attempts → 5 min / 1 hour / mandatory reset |
| `api/tests/Feature/Guyub/DeviceBindingTest.php` | `+` | New device without OTP → rejected; old devices are notified |

**Done when**: test throttle & green weak PIN; no HP/PIN/OTP number appears in the log; Ops/Admin still uses password + TOTP (§36.5), not PIN.

#### F0.2.1 — OTP delivery: WA-first, SMS-fallback (technical design)

> Reference: PRD §36.6, §7.4. Applies to every OTP purpose (`daftar`/`perangkat_baru`/`reset_pin`) — same code path for customer, driver, merchant.

**Contract** — one interface, two implementations, selected by config, never by the user:

```php
// api/Modules/IAM/app/Services/Otp/OtpSender.php
interface OtpSender
{
    public function channel(): string; // 'whatsapp' | 'sms'
    public function send(string $phoneE164, string $code, string $purpose): OtpSendAttempt;
}

// api/Modules/IAM/app/Services/Otp/OtpSendAttempt.php
final class OtpSendAttempt
{
    public function __construct(
        public readonly string $channel,
        public readonly bool $accepted,        // provider took the send request
        public readonly ?string $providerRef,  // provider message id, for reconciliation only
        public readonly ?string $failureReason, // machine-readable, never logs $code or $phoneE164
    ) {}
}
```

`WhatsAppOtpSender` and `SmsOtpSender` each wrap one HTTP client with a **short, fixed connect+read timeout (5s)** — the fallback decision must never sit waiting on a slow provider.

**Orchestration** — `OtpService::issue()`:

1. Generate code, hash it, persist the `guyub_otp_codes` row (`channel` starts `null`).
2. Resolve sender order: if a **previous unexpired OTP for the same `(user_id, purpose)`** already succeeded on a channel, retry that channel first (see *Resend* below); otherwise use `GUYUB_OTP_PROVIDER_PRIMARY`.
3. Call the sender. Record the attempt in `channel_attempts`.
4. **Fallback triggers only on synchronous failure** — provider returns a non-2xx / "invalid or unregistered number" response, or the 5s request itself times out (network/provider down). Then immediately try the next sender in the chain.
5. **Fallback does NOT trigger on delivery/read-receipt latency.** WhatsApp delivery confirmation arrives async via webhook, often well past any UX-reasonable timeout — gating fallback on it would routinely double-send (WA arrives late *and* SMS goes out), which is confusing and doubles cost. Once a sender **accepts** the send request, that channel is considered committed; only a later user "resend" click starts a new attempt.
6. Update `guyub_otp_codes.channel` to whichever sender accepted. If **every** sender in the chain fails synchronously, return `GYB-AUT-401` ("OTP sending failed") — no partial state, code row is discarded.

**Resend** — reuses the last successful channel first instead of restarting at `_PRIMARY`, so a driver who already got it via SMS doesn't wait out a doomed WA attempt on every retry. Still subject to the existing per-number/device/IP throttle (finding #6) — this design doesn't add a new abuse surface, it only changes which sender answers.

**Schema addition** to `…_create_guyub_otp_codes_table.php` (§F0.2, was: hash, destination, expiration, attempts):

| Column | Purpose |
|---|---|
| `channel` | `whatsapp`\|`sms`\|`null` — which sender actually accepted this code |
| `channel_attempts` | JSON log: `[{channel, provider_ref, ok, failure_reason, at}]` — for the fallback-rate metric below, never contains the code or full phone number |

**Observability, within the existing logging ban (§11)**: log/metric by `user_id` and `otp_id`, never phone number or code. Track **fallback rate** (`% of OTP issuances where `channel` ends up `sms`)** — this is the input needed to close PRD §16 open decision #2 ("prices for both providers need to be verified") with real data instead of a guess, once pilot traffic exists.

| File | Action | Contents |
|---|---|---|
| `api/Modules/IAM/app/Services/Otp/OtpSender.php` | `+` | Interface: `channel()`, `send()` |
| `api/Modules/IAM/app/Services/Otp/OtpSendAttempt.php` | `+` | Immutable result DTO |
| `api/Modules/IAM/app/Services/Otp/WhatsAppOtpSender.php` | `+` | Primary; 5s timeout; maps provider "invalid/unregistered number" response to `accepted: false` |
| `api/Modules/IAM/app/Services/Otp/SmsOtpSender.php` | `+` | Fallback; 5s timeout |
| `api/Modules/IAM/database/migrations/…_create_guyub_otp_codes_table.php` | `~` | + `channel`, `channel_attempts` columns |
| `api/tests/Feature/Guyub/OtpFallbackTest.php` | `+` | WA sync-fail → SMS sent; WA accepted → no SMS sent even if slow; resend reuses last successful channel; both fail → `GYB-AUT-401`, no OTP row left active |

---

### F0.3 — `Merchant` module + tenancy + operating hours (weeks 2–3)

> Reference: PRD §5k, §8, finding #22.

| File | Action | Contents |
|---|---|---|
| `api/Modules/Merchant/module.json`, `composer.json`, `app/Providers/*` | `+` | Nwidart scaffolding |
| `api/Modules/Merchant/database/migrations/…_create_guyub_merchants_table.php` | `+` | 1:1 `businesses`: type, verification status, service zone, `prep_minutes`, `manual_status`, `manual_status_until`, `auto_closed_at`, `slug` |
| `…_create_guyub_merchant_hours_table.php` | `+` | `day_of_week`, `open_time`, `close_time`, session order — **multiple rows per day** |
| `…_create_guyub_merchant_closures_table.php` | `+` | Date/range, reason, type `libur`/`sementara`/`otomatis` |
| `api/Modules/Merchant/app/Models/{GuyubMerchant,MerchantHour,MerchantClosure}.php` | `+` | `Tenantable` |
| `api/Modules/Merchant/app/Services/OpeningHoursService.php` | `+` | `isOpenNow()`, `lastOrderAt() = close − prep_minutes`, `nextOpenAt()` — **always from server time** `Asia/Jakarta` |
| `api/Modules/Merchant/app/Contracts/MerchantStatusContract.php` | `+` | Synchronous gates for `Ordering` & `Marketplace` (no cross-module query) |
| `api/Modules/Merchant/app/Http/Controllers/MerchantHoursController.php` | `+` | `GET|PUT /guyub/merchant/hours`, `PUT prep-time`, `POST close` (**`duration` required**), `POST open`, `GET|POST|DELETE closures` |
| `api/Modules/Merchant/app/Http/Controllers/MerchantProfileController.php` | `+` | Merchant profile (name, photo, village level address, consent to display cellphone number) |
| `api/Modules/Merchant/app/Http/Requests/*.php` | `+` | Schedule validation (non-overlapping sessions, mandatory closed duration) |
| `api/Modules/Merchant/app/Events/{MerchantOpened,MerchantClosed,MerchantUpdated}.php` | `+` | Public projection trigger (F1.9) |
| `api/Modules/Merchant/app/Jobs/ExpireTemporaryClosuresJob.php` | `+` | Temporarily closed **self-expired** (§5k) |
| `api/Modules/Merchant/app/Jobs/RemindMerchantToOpenJob.php` | `+` | Reminder every morning at the scheduled opening time if it is still closed automatically |
| `api/tests/Feature/Guyub/OpeningHoursTest.php` | `+` | Multi-session; last message limit; client open/close flags **ignored** |

**Done when**: two sessions/day schedule works; close temporarily recover automatically; open/close status never comes from the client.

---

### F0.4 — Flutter monorepo framework (weeks 3–4)

> Reference: PRD §6.5, `docs/16-mobile-implementation-plan.md`.

| File | Action | Contents |
|---|---|---|
| `mob/melos.yaml`, `mob/pubspec.yaml`, `mob/analysis_options.yaml` | `+` | Workspace melos, script `analyze`/`test`/`format` |
| `mob/packages/guyub_core/lib/src/api/api_client.dart` | `+` | One `ApiClient` (`http`), `Idempotency-Key`, device header, capture `X-Request-Id` |
| `mob/packages/guyub_core/lib/src/api/api_exception.dart` | `+` | Map Laravel error form + code `GYB-…` + 5 character trace code |
| `mob/packages/guyub_core/tool/gen_error_codes.dart` | `+` | Generator: `api/config/guyub-errors.php` → Dart constant (**not retyped**, §31.1) |
| `mob/packages/guyub_core/lib/src/errors/guyub_error_codes.g.dart` | `+` | Generator results |
| `mob/packages/guyub_core/lib/src/auth/{auth_repository,secure_token_store,device_id}.dart` | `+` | PIN/OTP/device; tokens in `flutter_secure_storage` |
| `mob/packages/guyub_core/lib/src/models/*.dart` | `+` | `freezed`/`json_serializable`: `auth_user`, `merchant`, `product`, `order` (increases per phase) |
| `mob/packages/guyub_core/lib/src/config/env.dart` | `+` | Base URL per flavor |
| `mob/packages/guyub_ui/lib/src/tokens/{colors,typography,spacing}.dart` | `+` | Design tokens §27 (palette of local objects, one accent) |
| `mob/packages/guyub_ui/lib/src/widgets/{app_button,rupiah_text,rupiah_field,empty_state,error_state}.dart` | `+` | Height ≥ 44 px; `EmptyState` & `ErrorState` must have one action |
| `mob/apps/guyub_customer/lib/{main,app}.dart`, `lib/routing/router.dart`, `lib/l10n/app_id.arb` | `+` | Framework + `go_router` + bottom nav 4 items |
| `mob/apps/guyub_customer/lib/ui/features/auth/**` | `+` | 3 slide opener, login, register, create PIN, forgot PIN (doc 18 §3.1) |
| `mob/apps/guyub_merchant/**` | `+` | Framework + login (nav: Home · Orders · Menu · More) |

**Done when**: two apps installed on a real Android phone, can register & log in, cold start < 3 seconds, APK < 30 MB.

---

### F0.5 — Merchant notifications: High priority FCM + foreground service + alarm (weeks 4–5)

> Reference: PRD §6.5, §7.3, §14 (risk number one). **Unheard orders = lost orders.**

| File | Action | Contents |
|---|---|---|
| `api/Modules/IAM/database/migrations/…_create_guyub_device_tokens_table.php` | `+` | FCM tokens per user+device |
| `api/Modules/Core/app/Services/FcmSender.php` | `+` | Send high priority FCM; channels per event type (doc 18 §6) |
| `api/Modules/Core/app/Contracts/PushSenderContract.php` | `+` | Interface so that other modules do not touch the FCM directly |
| `mob/apps/guyub_merchant/android/app/src/main/AndroidManifest.xml` | `~` | `FOREGROUND_SERVICE`, `POST_NOTIFICATIONS`, `USE_FULL_SCREEN_INTENT`, battery clearance |
| `mob/apps/guyub_merchant/android/app/src/main/kotlin/**/OrderForegroundService.kt` | `+` | Foreground services as long as the merchant is "Open" |
| `mob/apps/guyub_merchant/lib/data/services/fcm_service.dart` | `+` | Token registration, background message handling |
| `mob/apps/guyub_merchant/lib/data/services/order_alarm_service.dart` | `+` | Alarm **repeats** until order is opened; break through silent mode |
| `mob/apps/guyub_merchant/assets/sounds/pesanan_baru.ogg` | `+` | The tone that comes from the pocket |
| `mob/apps/guyub_merchant/lib/data/services/order_poller.dart` | `+` | 20 second backup polling when there is an active order (§7.3) |

**Done when**: Phone in pocket, screen off, silent mode → order **audible**; polling continues to work when FCM is forced to shutdown.

---

### F0.6 — Vertical spikes (target **week 5**)

> Reference: PRD §37.5. One stall · one product · one customer · no payment · no discovery.

Does not add new files beyond the **lightest** versions of F1.2/F1.5:

| File | Action | Contents |
|---|---|---|
| `api/Modules/Ordering/**` | `+` | Scaffold + `guyub_orders` minimum + `POST /guyub/orders` + `POST /guyub/merchant/orders/{id}/accept` |
| `mob/apps/guyub_customer/lib/ui/features/order_status/order_status_page.dart` | `+` | Thin version: status changes after merchant presses Accept |
| `mob/apps/guyub_merchant/lib/ui/features/orders/incoming_order_page.dart` | `+` | Full screen card + Accept button |

**Done when**: the flow sounds & changes status on two real cheap Android phones. **If you fail in week 5 — stop other work until it's done.**

---

### F0.7 — GUYUB Profile Web: homepage, legal, partner registration, status (weeks 5–6)

> Reference: PRD §20, doc 18 §2. The `/w/<slug>` page follows in F1.9.

| File | Action | Contents |
|---|---|---|
| `web/functions/_middleware.ts` | `+` | Rewrite host `guyub.<domain>` → prefix `/publik` |
| `web/app/layouts/publik.vue` | `+` | Light layout, same color token as application, target < 100 KB |
| `web/app/pages/publik/index.vue` | `+` | Proposition, download button, "3 steps order", service area, number of stalls & drivers |
| `web/app/pages/publik/daftar-warung.vue` | `+` | Merchant form (name, cell phone, village, type of business, 1–3 photos) |
| `web/app/pages/publik/gabung-driver.vue` | `+` | Driver form + statement of active SIM C & STNK |
| `web/app/pages/publik/{bantuan,privasi,ketentuan,status}.vue` | `+` | FAQ + WA Ops button; legal from `web/app/content/guyub/*.md` |
| `web/app/content/guyub/{privasi,ketentuan}.md` | `+` | Legal texts as data (§30.4); names **name of owner as data controller**, without total exoneration clause (§22.6) |
| `web/app/stores/guyubPublic.ts` | `+` | Fetch public data, 60 second cache |
| `api/Modules/Merchant/database/migrations/…_create_guyub_partner_applications_table.php` | `+` | Merchant/driver registration → Ops verification queue |
| `api/Modules/Merchant/app/Http/Controllers/PartnerApplicationController.php` | `+` | `POST /guyub/partner-applications` + rate limit + anti-spam |

**Done if**: each page < 100 KB; Ops queue entry form; the legal page names the data controller; if the projection fails to load, the homepage still appears **without shop list** (not a failed page).

---

### F0.8 — First credential custody, backup, and restore exercise (week 6)

> Reference: PRD finding #16, §19.2, §19.3, finding #27. **Existential risk — worked on in Phase 0, not later.**

| File | Action | Contents |
|---|---|---|
| `infra/backup/pg_dump_encrypted.sh` | `+` | Daily dump **encrypted** → R2; keys are kept separately |
| `infra/backup/restore-drill.sh` | `+` | Restore to temporary instance + time logging (RTO) |
| `infra/backup/retention.md` | `+` | Retention of §19.2 + second copy treatment is as strict as production |
| `docs/20-guyub-runbook-dr.md` | `+` | Recovery runbook: scenario §19.4, break-glass account, step sequence |
| `docs/21-guyub-kustodi-kredensial.md` | `+` | List of credentials, password manager location, **printed 2FA backup code**, second account in hosting/DNS/Play Console |

**Completed when**: one restore exercise is completed **within the RTO** and the time is recorded; the backup code is already printed and stored offline.

---

### F0.9 — Legal checklist §22.8 (parallel track, starting **week 1**)

Not code work, but **blocking public release** — the timing is out of our control.

| Output | Related files |
|---|---|
| NIB (OSS), NPWP, PSE Kominfo private scope | `api/config/guyub-legal.php`, `/publik/ketentuan` page |
| **Commission only** account, separate, never used to pay orders (finding #17) | `api/config/guyub.php` |
| Privacy policy & T&Cs Indonesian | `web/app/content/guyub/*.md` |

Third track also from week 1: **field survey** list of places, zones, and terrain classes — the output is `api/Modules/Marketplace/database/data/guyub-places.csv` which is used in F1.2. Without this, the checkout cannot be tested at all (§37.2).

---

## 3 — PHASE 1 — Culinary: pick up yourself + merchant courier

**Week 7–20 · Sep–Dec 2026 · tag `v0.2.0`**
**Gate pass**: 8 mandatory tests of §26.2 passed; ≥ 15 verified stalls; pilot closed 2 weeks **no money incident**.

Mandatory sequence follows PRD §37.4: **money path first, display later.** F1.9 (discovery) is intentionally behind.

---

### F1.1 — Catalog: variants, options, additions (weeks 7–8)

> Reference: PRD §34, finding #35. Without this the merchant wrote in the note freely and the kitchen misread it.

| File | Action | Contents |
|---|---|---|
| `api/Modules/Catalog/database/migrations/…_create_guyub_product_option_groups_table.php` | `+` | `product_id`, name, `preset_key`, required/optional, sequence |
| `…_create_guyub_product_options_table.php` | `+` | `group_id`, label, sequence |
| `…_create_guyub_product_addons_table.php` | `+` | `product_id`, label, price, max select |
| `…_add_guyub_fields_to_product_variants.php` | `~` | `is_sold_out` per variant; variant uses the **existing** `Catalog` structure |
| `api/Modules/Catalog/app/Models/{ProductOptionGroup,ProductOption,ProductAddon}.php` | `+` | Model + `Tenantable` |
| `api/Modules/Catalog/config/guyub-option-presets.php` | `+` | Ready-to-use groups: Spicy · Temperature · Ice · Sugar · Chili (§34.1) — **words, not numbers** |
| `api/Modules/Catalog/app/Services/ProductOptionService.php` | `+` | Hard limit **3 groups · 5 variants · 8 additions**; max 1 group created by merchant |
| `api/Modules/Catalog/app/Contracts/ProductPricingContract.php` | `+` | `resolve(productId, variantId, optionIds[], addonIds[])` → price + **ownership verification** (finding #35) |
| `api/Modules/Catalog/app/Http/Controllers/ProductOptionController.php` | `+` | CRUD group/variant/addition per product |
| `api/Modules/Catalog/app/Http/Resources/GuyubProductResource.php` | `+` | Explicit fields; "starting from IDR ..." if there is a variant |
| `api/tests/Feature/Guyub/ProductOptionOwnershipTest.php` | `+` | `addon_id` belongs to another product → rejected (finding #35) |
| `mob/apps/guyub_merchant/lib/ui/features/menu/{menu_page,product_form_page,option_group_sheet,variant_editor,addon_editor}.dart` | `+` | Merchant **checks** preset group, does not type |
| `mob/apps/guyub_merchant/lib/data/repositories/menu_repository.dart` | `+` | CRUD menu |
| `mob/packages/guyub_ui/lib/src/widgets/{product_card,photo_tips_sheet}.dart` | `+` | Badge; photo guide appears when uploading first photo (§27.3) |

**Done when**: rice stalls can set the spiciness & portion, coffee stalls can set hot/cold, and the 3/5/8 limit cannot be exceeded by clients.

---

### F1.2 — Cart, listing, and checkout with server pricing (weeks 8–10)

> Reference: PRD Inv. 2 & 4, §5a, §5k, doc 18 §3.5–3.6, finding #22.

| File | Action | Contents |
|---|---|---|
| `api/Modules/Marketplace/database/migrations/…_create_guyub_zones_table.php` | `+` | Regional zone |
| `…_create_guyub_places_table.php` | `+` | Village/hamlet/benchmark, lat/lng, zone, **`kelas_medan`** (flat/uphill/difficult) |
| `api/Modules/Marketplace/database/data/guyub-places.csv` | `+` | Field survey results (parallel line F0.9) |
| `api/Modules/Marketplace/database/seeders/GuyubPlacesSeeder.php` | `+` | Import CSV → table |
| `api/Modules/Marketplace/app/Http/Controllers/PlaceController.php` | `+` | `GET /guyub/places` (village → hamlet → benchmark) |
| `api/Modules/Ordering/database/migrations/…_create_guyub_orders_table.php` | `+` | ULID PK; `order_type`, two status fields, `business_id`, `customer_id`, `ref`, `queue_no`, `idempotency_key` (unique), total server-side, `promised_ready_at`, `promised_delivery_at`, `ready_at_actual`, `eta_extend_count`, `fulfillment_mode`, `delivery_fee`, `delivery_fee_recipient`, `courier_payout`, `courier_paid_at`, `subsidy_amount`; index `(business_id,status)`, `(customer_id,created_at)` |
| `…_create_guyub_order_items_table.php` | `+` | **Snapshot** price & name, `variant_id`, `variant_name_snapshot`, `unit_price_snapshot` |
| `…_create_guyub_order_item_options_table.php` | `+` | Selected & additional snapshots per row |
| `…_create_guyub_order_events_table.php` | `+` | Append-only, dispute & audit resources |
| `api/Modules/Ordering/app/Models/{Order,OrderItem,OrderItemOption,OrderEvent}.php` | `+` | Relations + cast |
| `api/Modules/Ordering/app/Services/OrderPricingService.php` | `+` | Subtotal + shipping + commission **all from the server** (`ProductPricingContract`) |
| `api/Modules/Ordering/app/Actions/CreateOrderAction.php` | `+` | Transactions: revalidate opening hours & message limits → calculate → snapshot → unique nominal allocation |
| `api/Modules/Ordering/app/Http/Requests/CreateOrderRequest.php` | `+` | Only `product_id`, `variant_id`, `option_ids[]`, `addon_ids[]`, `qty`, `place_id`, records ≤ 100 characters. **The nominal amount from the client is completely ignored** |
| `api/Modules/Ordering/app/Http/Resources/OrderResource.php` | `+` | Explicit fields per lens (§6.4) |
| `api/Modules/Ordering/app/Http/Controllers/OrderController.php` | `+` | `POST/GET /guyub/orders`, `GET /{id}`, `POST /{id}/cancel` |
| `api/Modules/Core/app/Http/Middleware/IdempotencyKey.php` | `+` | Required in all POST mutations; save first response |
| `api/Modules/Core/database/migrations/…_create_idempotency_keys_table.php` | `+` | Unique constraints in DB (finding #3) |
| `api/tests/Feature/Guyub/OrderValueAuthorityTest.php` | `+` | §26.2 #3 — false `total`/`delivery_fee` ignored |
| `api/tests/Feature/Guyub/OrderIdempotencyTest.php` | `+` | §26.2 #2 — two POSTs, one order |
| `api/tests/Feature/Guyub/CheckoutClosingHoursTest.php` | `+` | §26.2 #5 — 422 + next opening hours, **cart not deleted** |
| `mob/apps/guyub_customer/lib/ui/features/merchant/{merchant_page,product_detail_page}.dart` | `+` | Docking screen sequence 18 §3.5; The total also changes when the selection is changed |
| `mob/apps/guyub_customer/lib/ui/features/cart/{cart_page,place_picker_sheet}.dart` | `+` | One basket = one stall; select a drop off point from the list of places |
| `mob/apps/guyub_customer/lib/data/local/cart_store.dart` | `+` | The bucket on the client, **never** becomes the server table |
| `mob/apps/guyub_customer/lib/data/repositories/order_repository.dart` | `+` | Send intent, receive value |

**Done if**: three tests §26.2 (#2, #3, #5) green; the client never sent a single amount.

---

### F1.3 — Payment gateway: static QRIS + unique amount + merchant verification (weeks 10–12)

> Reference: PRD §5h, Non-negotiable 13 & 14, findings #12 & #14. **This is the heart. If this part is not correct, there is no point in continuing.**

| File | Action | Contents |
|---|---|---|
| `api/Modules/Payment/**` | `+` | Scaffold module |
| `api/Modules/Payment/database/migrations/…_create_guyub_payments_table.php` | `+` | Method, `status_bayar`, `unique_amount`, claim & verification time, verifier actor; **unique partial `(business_id, unique_amount)` for active payments** |
| `…_create_guyub_payment_claims_table.php` | `+` | Append-only: claim + optional evidence + results + reasons |
| `api/Modules/Merchant/database/migrations/…_add_qris_to_guyub_merchants_table.php` | `~` | `qris_image_path`, `qris_owner_name` (merchant owned, **never** platform owner account) |
| `api/Modules/Payment/app/Contracts/PaymentVerifier.php` | `+` | Interface; path up to webhook without changing domain (§5h.4) |
| `api/Modules/Payment/app/Verifiers/ManualMerchantVerifier.php` | `+` | Implementation phase 1 |
| `api/Modules/Payment/app/Services/UniqueAmountAllocator.php` | `+` | 3 unique digits, allocation **inside transaction**, TTL 15 minutes, released after |
| `api/Modules/Payment/app/Services/PaymentGateService.php` | `+` | Determine the methods that customers **can** choose (§5g + §23.4) |
| `api/Modules/Payment/app/Http/Controllers/PaymentController.php` | `+` | `GET /guyub/orders/{id}/payment`, `POST /{id}/payment/claim` (**make claims only**) |
| `api/Modules/Payment/app/Http/Controllers/MerchantPaymentController.php` | `+` | `confirm`, `reject`, `amount-mismatch`, `GET pending` |
| `api/Modules/Payment/app/Policies/PaymentPolicy.php` | `+` | Customer **never** has `guyub_payment.approve` |
| `api/Modules/Payment/app/Jobs/ExpireUnpaidOrdersJob.php` | `+` | 15 minutes without claims → cancel system |
| `api/Modules/Payment/app/Jobs/RemindPendingVerificationJob.php` | `+` | Merchant reminder every 10 minutes; card cannot be closed |
| `api/Modules/Core/app/Services/PresignedUploadService.php` | `+` | Upload presigned; **server generated object name (UUID)**, type & size validated, never under `public/` (finding #9) — reused proof of payment, photo done, and input |
| `api/config/guyub-errors.php` | `~` | `GYB-PAY-301/302/303` |
| `api/tests/Feature/Guyub/PaymentClaimAuthorityTest.php` | `+` | §26.2 #4 — customer flags `lunas` → 403 |
| `api/tests/Feature/Guyub/UniqueAmountCollisionTest.php` | `+` | §26.2 #6 — two active orders cannot have the same amount |
| `mob/apps/guyub_customer/lib/ui/features/payment/qris_page.dart` | `+` | QR + "Pay exactly IDR 45,317" + copy + 15 minute countdown + "I have paid" + upload proof |
| `mob/apps/guyub_merchant/lib/ui/features/payments/{pending_list_page,confirm_sheet}.dart` | `+` | "Let's check the transfer: IDR 45,317 from Ratna. Has it come in?" |
| `mob/apps/guyub_merchant/lib/ui/features/home/pending_verification_card.dart` | `+` | "Waiting to check: 2 orders" card that **cannot be closed** |

**Done if**: pressing "I have paid" **does** change the status to paid; only merchants can; proof never changes status.

---

### F1.4 — COD Trust & “Ask to pay first” (weeks 12–13)

> Reference: PRD §5g, findings #13 & #15.

| File | Action | Contents |
|---|---|---|
| `api/Modules/Payment/database/migrations/…_create_guyub_merchant_cod_settings_table.php` | `+` | `cod_policy` (default `pelanggan_dipercaya`), nominal limit (default IDR 100,000) |
| `…_create_guyub_trusted_customers_table.php` | `+` | Unique `(business_id, customer_id)` — **not transmitted between merchants** |
| `…_create_guyub_customer_reliability_table.php` | `+` | `selesai`, `gagal_tidak_diambil`, `batal_setelah_diterima`, `cod_blocked_until` |
| `api/Modules/Payment/app/Services/CodPolicyService.php` | `+` | Who can COD; nominal limit; block 30 days after 2 incidents |
| `api/Modules/Payment/app/Services/CustomerReliabilityService.php` | `+` | **explicit & human readable** rules, not opaque scores |
| `api/Modules/Payment/app/Listeners/UpdateReliabilityOnOrderClosed.php` | `+` | Listen to `OrderCompleted` / `OrderNotPickedUp` |
| `api/Modules/Payment/app/Http/Controllers/MerchantCodController.php` | `+` | `PUT cod-settings`, `GET customers/{id}/summary`, `POST trust|untrust` |
| `mob/apps/guyub_merchant/lib/ui/features/customers/{customer_list_page,customer_card,cod_settings_page}.dart` | `+` | Customer card: **numbers as is** + [Call first] [Accept] [Ask to pay first] [Reject] |
| `mob/apps/guyub_customer/lib/ui/features/checkout/payment_method_picker.dart` | `+` | Only **server-allowed** methods |
| `api/tests/Feature/Guyub/CodPolicyTest.php` | `+` | COD does not appear for new customers at merchant `pelanggan_dipercaya` |

**Completed if**: "Request payment first" returns the order to `menunggu_pembayaran`; `gagal_tidak_diambil` marking is only valid from status `disiapkan`/`siap` and recorded audit.

---

### F1.5 — State machine, transaction number, queue number, error code (weeks 13–15)

> Reference: PRD §5d, §31, §32, findings #4 & #7.

| File | Action | Contents |
|---|---|---|
| `api/config/guyub-order-states.php` | `+` | Matrix **(origin state × actor × destination state)** as data |
| `api/Modules/Ordering/app/Services/OrderStateMachine.php` | `+` | Illegal transition → `422` + `GYB-ORD-303` + log audit; **no status can be reversed** |
| `api/Modules/Ordering/app/Services/OrderRefGenerator.php` | `+` | `YYMMDD-847293`; 6 random digits (0-9), no letter prefix; unique per (type, date) + retry |
| `api/Modules/Ordering/app/Services/QueueNumberService.php` | `+` | Sequence number **daily per merchant**, given at **Receive**; reset at first open session; one sequence for all channels (ready to use Cashier Lite F4) |
| `api/Modules/Ordering/app/Policies/OrderPolicy.php` | `+` | Three lenses §6.4: merchant / customer / driver, fields per lens |
| `api/Modules/Ordering/app/Http/Controllers/MerchantOrderController.php` | `+` | `accept` (+`eta_minutes`), `reject` (reason), `ready`, `request-prepay`, `not-picked-up`, `GET summary` |
| `api/Modules/Ordering/app/Jobs/AutoCancelUnconfirmedOrdersJob.php` | `+` | Merchant response limit 5 minutes → automatic cancellation, customer is notified |
| `api/Modules/Ordering/app/Jobs/AutoCloseUnresponsiveMerchantJob.php` | `+` | 3 missed orders in 30 minutes → stall closes automatically (§5k) |
| `api/Modules/Ordering/app/Jobs/ExpirePickupDeadlineJob.php` | `+` | 60 minute take limit → `gagal_tidak_diambil` |
| `api/Modules/Core/app/Exceptions/GuyubException.php` | `+` | Carry code `GYB-…`, status HTTP, and copy Language |
| `api/bootstrap/app.php` | `~` | Render `GuyubException` → Laravel error form + `X-Request-Id` |
| `api/config/guyub-errors.php` | `~` | `GYB-ORD-301..304`, `GYB-MRC-201` |
| `mob/packages/guyub_core/lib/src/errors/guyub_error_codes.g.dart` | `~` | Regeneration |
| `mob/packages/guyub_ui/lib/src/widgets/error_state.dart` | `~` | Show 5 character trace code + "Tell us what happened" link (to F1.10) |
| `mob/apps/guyub_customer/lib/ui/features/order_status/order_status_page.dart` | `~` | **Large queue number** + small transaction number + status timeline |
| `api/tests/Feature/Guyub/OrderTransitionRbacTest.php` | `+` | §26.2 #1 — driver marks complete without privileges → 403; customer marks accepted → 403 |

**Done if**: each transition has a valid actor; each failure has code +`request_id`; the queue number does not leave a hole when the order is cancelled.

---

### F1.6 — Estimate ready & countdown (week 15)

> Reference: PRD §5l, finding #25.

| File | Action | Contents |
|---|---|---|
| `api/Modules/Ordering/app/Services/EtaService.php` | `+` | `promised_ready_at = diterima + estimasi_merchant`; send **timestamp**, not remaining minutes |
| `api/Modules/Ordering/app/Http/Controllers/MerchantOrderController.php` | `~` | `POST .../extend-eta` — **max 2×**, recorded |
| `api/Modules/Merchant/database/migrations/…_create_guyub_merchant_eta_stats_table.php` | `+` | Aggregate estimated vs actual per merchant |
| `api/Modules/Merchant/app/Jobs/RecomputeEtaStatsJob.php` | `+` | Basic advice "usually you need 22 minutes" after 20 orders |
| `mob/packages/guyub_ui/lib/src/widgets/countdown_tile.dart` | `+` | **local** countdown; missed → calming sentence, **never a minus number** |
| `mob/apps/guyub_merchant/lib/ui/features/orders/accept_eta_sheet.dart` | `+` | Big button 10 · 15 · 20 · 30 · 45 minutes |
| `mob/apps/guyub_customer/lib/ui/features/order_status/cancel_free_banner.dart` | `+` | After second renewal → **Cancel for free** |

**Done when**: the countdown continues without network and does not trigger any additional polls.

---

### F1.7 — Merchant fulfillment & courier mode (weeks 16–17)

> Reference: PRD §23.1, §23.2, §23.5, findings #28 & #29. **This is what makes road delivery since Phase 1 without having a single driver.**

| File | Action | Contents |
|---|---|---|
| `api/Modules/Merchant/database/migrations/…_add_fulfillment_to_guyub_merchants_table.php` | `~` | `fulfillment_modes[]`, priority order, `own_courier_fee_rule` (average/zone/free over X), `own_delivery_zones` |
| `api/Modules/Merchant/app/Services/DeliveryFeeRuleService.php` | `+` | Merchant sets **rules**, servers that **calculate** (finding #29) |
| `api/Modules/Merchant/app/Http/Controllers/FulfillmentController.php` | `+` | `PUT fulfillment`, `PUT delivery-fee-rule` |
| `api/Modules/Delivery/**` | `+` | Scaffold module |
| `api/Modules/Delivery/database/migrations/…_create_guyub_drivers_table.php` | `+` | Includes **`owner_business_id` nullable** — filled in = merchant's courier |
| `api/Modules/Delivery/app/Http/Controllers/MerchantCourierController.php` | `+` | `GET|POST|DELETE /guyub/merchant/couriers`, `POST orders/{id}/assign-courier` |
| `api/Modules/Delivery/app/Policies/CourierOrderPolicy.php` | `+` | **Fourth lens**: `business_id` his stall **and** assigned to him **and** active assignment |
| `api/tests/Feature/Guyub/MerchantCourierLensTest.php` | `+` | §26.2 #1 — Stall A courier opens Stall B's order → 403 + `GYB-MRC-201` |
| `mob/apps/guyub_merchant/lib/ui/features/fulfillment/{fulfillment_page,courier_list_page,fee_rule_form}.dart` | `+` | Active mode + priority order + my courier list |
| `mob/apps/guyub_merchant/lib/ui/features/orders/mark_delivering_sheet.dart` | `+` | For couriers who **do not use the app**: merchants mark "delivered"/"completed" themselves (§23.2) |

**Finish when**: the stall with its own courier can sell fully; `kurir_merchant` mode postage is 100% owned by the merchant, zero deduction. *(The `guyub-merchant-courier` account in the Driver application lights up at F2.4 — in Phase 1 it is marked via the Merchant application.)*

---

### F1.8 — Merchant welcome & thank you message (week 17)

> Reference: PRD §5m, finding #24.

| File | Action | Contents |
|---|---|---|
| `api/Modules/Merchant/database/migrations/…_create_guyub_merchant_messages_table.php` | `+` | Text, type, active, moderation status |
| `api/Modules/Merchant/app/Rules/NoLinkOrLongDigits.php` | `+` | **Links & long strings of numbers are blocked**; plain text ≤ 120 characters, escaped |
| `api/Modules/Merchant/app/Services/MerchantMessageService.php` | `+` | Only `{nama}` is supported; any changes → Ops review queue + audit |
| `api/Modules/Merchant/app/Http/Controllers/MerchantMessageController.php` | `+` | `GET|PUT /guyub/merchant/messages` |
| `web/app/pages/guyub/moderasi-pesan.vue` | `+` | Ops review queue |
| `mob/apps/guyub_merchant/lib/ui/features/messages/messages_page.dart` | `+` | Ready-to-use template + preview of appearance on customer's cellphone |
| `api/tests/Feature/Guyub/MerchantMessageContentTest.php` | `+` | §26.2 #8 — link & account number rejected |

---

### F1.9 — Public projections, discovery, and `/w/<slug>` (weeks 18–19)

> References: PRD §6.3, §20, findings #1, #8, #26. **Intentionally behind the scenes** — discovery feels like progress but doesn't prove anything about whether stalls will use this system.

| File | Action | Contents |
|---|---|---|
| `api/Modules/Marketplace/database/migrations/…_create_merchant_public_profiles_table.php` | `+` | Only public fields + schedule + package marker |
| `…_create_catalog_public_items_table.php` | `+` | Only public column + popularity aggregate (filled in F2.9) |
| `api/Modules/Marketplace/app/Projections/{MerchantProjector,CatalogProjector}.php` | `+` | Refilled by event `MerchantOpened`/`MerchantUpdated`/`ProductUpdated` |
| `api/Modules/Marketplace/app/Listeners/RefreshProjectionListener.php` | `+` | Event connection → projector |
| `api/Modules/Marketplace/app/Jobs/RebuildPublicProjectionJob.php` | `+` | Full rebuild (restore & migration) |
| `api/Modules/Marketplace/app/Http/Controllers/DiscoveryController.php` | `+` | `GET /guyub/merchants?zone=&type=` — **max pagination 50**, required radius, anonymous rate limit |
| `api/Modules/Marketplace/app/Http/Controllers/PublicMerchantController.php` | `+` | `GET /guyub/merchants/{slug}` + products |
| `api/Modules/Marketplace/app/Http/Resources/{PublicMerchantResource,PublicItemResource}.php` | `+` | **Explicit field whitelist**; cell phone number only if the merchant approves (finding #26) |
| `api/Modules/Marketplace/routes/api.php` | `~` | Public group + edge cache header **60 seconds** |
| `api/tests/Feature/Guyub/PublicProjectionLeakTest.php` | `+` | Public endpoints never touch tenant tables; internal column does not leak |
| `web/app/pages/publik/w/[slug].vue` | `+` | **Most important pages**: menu + prices + hours + "Open again …" + deep link button, Play Store fallback |
| `web/app/components/publik/LocalBusinessJsonLd.vue` | `+` | `schema.org/LocalBusiness`; the title contains the name of the shop + village + sub-district |
| `web/server/routes/sitemap.xml.ts` | `+` | Automatic sitemap of public projections; `noindex` if not verified |
| `web/app/pages/publik/index.vue` | `~` | List of stalls currently open (live data) |
| `mob/apps/guyub_customer/lib/ui/features/home/home_page.dart` | `+` | Greetings according to time, category, top active order card, "Open now near you" |
| `mob/apps/guyub_customer/lib/ui/features/discovery/{merchant_list_page,search_page}.dart` | `+` | Filters & sequences; stall closed **below** with label |
| `mob/packages/guyub_ui/lib/src/widgets/{merchant_card,open_status_badge,sponsored_label}.dart` | `+` | "Closing in 40 minutes — book now" |

**Done when**: green cross-tenant leak test; stand-alone stall page without application; closed stalls never appear on the home page or top of the list.

---

### F1.10 — Feedback & suggestions channels (weeks 19–20)

> Reference: PRD §28. **Must be on before pilot starts, not after** (§37.4.10).

| File | Action | Contents |
|---|---|---|
| `api/Modules/Core/database/migrations/…_create_guyub_feedback_table.php` | `+` | `user_id`, `role`, `quick_choice`, `text`, `audio_path`, `image_path`, `context` (JSON), `no_contact`, `status`, `tags[]`, `handled_by`, `resolved_at` |
| `…_create_guyub_feedback_replies_table.php` | `+` | Reply Ops + channel |
| `api/Modules/Core/app/Http/Controllers/GuyubFeedbackController.php` | `+` | `POST /guyub/feedback`, `GET /guyub/feedback/mine`; max **5 posts/day** |
| `api/Modules/Core/app/Services/FeedbackContextSanitizer.php` | `+` | The technical context comes automatically; **never** contains tokens or cellphone numbers |
| `mob/packages/guyub_core/lib/src/feedback/{feedback_repository,voice_recorder}.dart` | `+` | Record **Opus mono ~16 kbps, max 60 sec**, limited on recorder, no server transcoding (§25.6) |
| `mob/packages/guyub_ui/lib/src/widgets/feedback_sheet.dart` | `+` | Quick selection in the form of a sentence + story box + **record voice button the size of a text box** + attachments + check "no need to contact" |
| `mob/apps/guyub_{customer,merchant}/lib/ui/features/feedback/feedback_page.dart` | `+` | Quick options differ per role |
| `web/app/pages/guyub/masukan.vue` | `+` | Ops side: read, bookmark, reply |

**Finishes when**: three logins are alive (Account, Help, **link on each screen fails** with context filled); offline shipments are queued and sent automatically.

---

### F1.11 — Console Ops minimum (week 20, parallel)

> Reference: PRD §6.6. Full ops follow in Phase 5 — here only those that **block launch**.

| File | Action | Contents |
|---|---|---|
| `web/app/stores/guyub.ts` | `+` | New Pinia store (don't touch existing store) |
| `web/app/pages/guyub/merchants.vue` | `+` | Merchant verification + partner registration queue |
| `web/app/pages/guyub/pembayaran.vue` | `+` | List of **aging** payment claims (§5h) |
| `web/app/pages/guyub/tempat.vue` | `+` | CRUD list of places & zones |
| `web/app/config/nav.ts` | `~` | New nav item, permission driven (DNA §9f) |
| `web/app/utils/permissions.ts` | `~` | `PermissionSeeder` mirror for `guyub_*` |

---

**Mandatory testing before public launch (weeks 21–22)** — PRD §26.2 & §26.5:
#1 rejection path RBAC · #2 idempotency · #3 value authority · #4 payment status · #5 operating hours · #6 unique nominal · #8 merchant messages. *(#7 postage will follow in Phase 2.)*
Plus: exercise restore in RTO · 2 week closed pilot with no cash incidents · ≥ 15 verified stalls · copy read aloud against §17 · real rollback to previous tag in staging.

---

## 4 — PHASE 2 — GUYUB COURIER

**Week 23–35 · Jan–Mar 2027 · tag `v0.3.0`**
**Gate pass**: postage & handover test passed; 3–4 active drivers.

---

### F2.1 — Zones, rate matrices, and terrain classes (weeks 23–24)

> Reference: PRD §35, §6.7, §22.4.

| File | Action | Contents |
|---|---|---|
| `api/Modules/Marketplace/database/migrations/…_create_guyub_fare_matrix_table.php` | `+` | Origin-zone × destination-zone: fare + **estimated delivery minutes** (used ETA §5l) |
| `api/Modules/Marketplace/app/Services/FareCalculator.php` | `+` | Rates are **derived** from parameter `guyub-fares.php` (§35.3), not typed; mandatory within the official range for passenger orders |
| `api/Modules/Marketplace/app/Services/TerrainSurchargeService.php` | `+` | Additional ramp Rp. 3,000–5,000, **full to driver** (§35.5) |
| `api/Modules/Marketplace/database/seeders/GuyubFareMatrixSeeder.php` | `+` | From the survey results; reviewed every quarter or when gasoline moves > 10% |
| `api/tests/Feature/Guyub/FareRangeTest.php` | `+` | Passenger fares are always within the official range; minimum order between villages IDR 40,000 |

---

### F2.2 — Driver: profile, document verification, vehicle (weeks 24–26)

> Reference: PRD §22.10, doc 18 §5.1.

| File | Action | Contents |
|---|---|---|
| `api/Modules/Delivery/database/migrations/…_add_verification_to_guyub_drivers_table.php` | `~` | Verification status, `can_carry_passenger`, online status |
| `…_create_guyub_driver_vehicles_table.php` | `+` | Plate, STNK photo, owner's name & cellphone, validity period, `is_borrowed`, owner's permission; **max 2 active** |
| `api/Modules/Delivery/app/Services/DriverVerificationService.php` | `+` | **SIM C is absolutely mandatory**; STNK may be in someone else's name; Expired vehicle registration → approved with warning + 60 day deadline |
| `api/Modules/Delivery/app/Http/Controllers/DriverProfileController.php` | `+` | Upload documents (presigned), select today's vehicle, order type |
| `web/app/pages/guyub/drivers.vue` | `+` | Ops Verification + telephone records to vehicle owner |
| `mob/apps/guyub_driver/**` | `+` | Third app: framework, login (device binding **required**), 3-step verification |

---

### F2.3 — Dispatch (weeks 26–28)

> Reference: PRD §5a.6, §7.5.2, finding #28.

| File | Action | Contents |
|---|---|---|
| `api/Modules/Delivery/database/migrations/…_create_guyub_dispatch_offers_table.php` | `+` | Bids + results (accept/reject/timeout) for audits & metrics |
| `…_create_guyub_trips_table.php` | `+` | **Seam batching** (§33.3): v1 always 1 order per trip |
| `api/Modules/Delivery/app/Jobs/DispatchOrderJob.php` | `+` | **Sequential** offers, 30 seconds per driver, max 5 laps; failed → merchants may "deliver themselves" |
| `api/Modules/Delivery/app/Services/DriverPoolService.php` | `+` | Nearest online drivers; **merchant couriers never enter this pool** (finding #28); order uphill only to drivers who have the setting enabled |
| `api/Modules/Delivery/app/Http/Controllers/DriverOfferController.php` | `+` | `GET offers`, `POST offers/{id}/accept` |
| `api/config/guyub-errors.php` | `~` | `GYB-DLV-302` (no driver after 5 rounds) |

---

### F2.4 — Driver Application: active orders step by step (weeks 28–31)

> Reference: doc 18 §5.2–5.4, PRD §6.4, finding #5.

| File | Action | Contents |
|---|---|---|
| `api/Modules/Delivery/app/Http/Controllers/DriverOrderController.php` | `+` | `pickup`, `courier-fee-received`, `deliver`, `complete` |
| `api/Modules/Delivery/app/Http/Resources/DriverOrderResource.php` | `+` | Customer address & cellphone number **only during active assignment**, disappears after completion |
| `api/Modules/Delivery/app/Services/ContactRevealAuditor.php` | `+` | Each opening number is **noted audit** (§29.3, finding #34) |
| `mob/apps/guyub_driver/lib/ui/features/offer/offer_card_page.dart` | `+` | Full screen card + sound + 30 second countdown + field marker + shipping accepted |
| `mob/apps/guyub_driver/lib/ui/features/active_order/active_order_page.dart` | `+` | One large button per stage (doc 18 §5.4) |
| `mob/apps/guyub_driver/lib/ui/features/active_order/otp_sheet.dart` | `+` | 4 digit OTP from the customer, or photo if the customer is not available |
| `mob/apps/guyub_driver/lib/data/local/active_order_store.dart` | `+` | Order details stored locally; **queued** status changes while offline |
| `mob/apps/guyub_driver/lib/data/services/{foreground_service,location_batcher}.dart` | `+` | Location **only when order is active**, 15 second batch |
| `mob/apps/guyub_driver/lib/ui/features/account/settings_page.dart` | `+` | **"Accept ramp orders"** settings, bid sound, feedback & suggestions |

---

### F2.5 — Shipping cash flow: cash on delivery + `ongkir_tertunda` (weeks 31–32)

> Reference: PRD §23.4, finding #30. **Drivers are always paid for the journey they have taken.**

| File | Action | Contents |
|---|---|---|
| `api/Modules/Delivery/database/migrations/…_create_guyub_courier_settlements_table.php` | `+` | Weekly recap per stall: delayed postage, subsidy reimbursement, commission |
| `api/Modules/Delivery/app/Services/CourierPayoutService.php` | `+` | Two-sided confirmation; empty `courier_paid_at` = `ongkir_tertunda`; **orders are never blocked** because of this |
| `api/Modules/Delivery/app/Http/Controllers/DriverEarningsController.php` | `+` | `GET /guyub/driver/earnings` daily & weekly, details **per order** |
| `api/config/guyub-errors.php` | `~` | `GYB-DLV-601` (`courier_paid_at` is empty even though completed — class 6xx, **always warning**) |
| `mob/apps/guyub_merchant/lib/ui/features/finance/pending_courier_fee_card.dart` | `+` | Pending postage warning on merchant homepage |
| `mob/apps/guyub_driver/lib/ui/features/earnings/earnings_page.dart` | `+` | Transparency per order — this is what maintains driver trust |
| `api/tests/Feature/Guyub/CourierFeePendingTest.php` | `+` | §26.2 #7 — order remains in progress, but appears in recap |

---

### F2.6 — Adaptive tracking & polling (weeks 32–33)

| File | Action | Contents |
|---|---|---|
| `api/Modules/Delivery/app/Http/Controllers/DriverLocationController.php` | `+` | `POST /guyub/driver/location` (batch); save in **Redis TTL 2 hours**, not Postgres |
| `api/Modules/Ordering/app/Http/Controllers/OrderTrackController.php` | `+` | `GET /guyub/orders/{id}/track` |
| `mob/apps/guyub_customer/lib/data/services/adaptive_poller.dart` | `+` | 5 sec (delivered) → 20 sec (waiting) → **off** (no order) |
| `mob/apps/guyub_customer/lib/ui/features/tracking/tracking_page.dart` | `+` | MapLibre + OSM tiles, **only on this screen** |

---

### F2.7 — Quick Message (weeks 33–34)

> Reference: PRD §29.2, finding #33. Not chat — **no free text box**.

| File | Action | Contents |
|---|---|---|
| `api/Modules/Ordering/database/migrations/…_create_guyub_quick_messages_table.php` | `+` | Order as an event on order |
| `api/config/guyub-quick-messages.php` | `+` | List of ready-to-use messages per role (§29.2) — as data |
| `api/Modules/Ordering/app/Http/Controllers/QuickMessageController.php` | `+` | Max **10 messages per party per order**, only while active, closes 1 hour after completion |
| `mob/packages/guyub_ui/lib/src/widgets/quick_message_bar.dart` | `+` | Fixed position, big icons, **order never changes** (driver presses them without reading) |
| `mob/apps/guyub_{customer,merchant,driver}/lib/ui/features/*/quick_message_section.dart` | `+` | Installed on the active status/order screen |

---

### F2.8 — Product, merchant, driver + badge assessment (weeks 34–35)

> Reference: PRD §5i, finding #18.

| File | Action | Contents |
|---|---|---|
| `api/Modules/Marketplace/database/migrations/…_create_guyub_item_reviews_table.php` | `+` | **Unique `order_item_id`**; `sentiment`, `reasons[]`, `editable_until` |
| `…_create_guyub_ratings_table.php` | `+` | Merchant & driver, one per order per party |
| `…_create_guyub_product_stats_table.php` | `+` | `likes`, `dislikes`, `sold_30d`, `badge`, `recomputed_at` |
| `api/Modules/Marketplace/app/Services/ReviewIntegrityService.php` | `+` | Only from your own `selesai` orders, max 7 days, can be changed within 24 hours; merchant related orders excluded |
| `api/Modules/Marketplace/app/Jobs/RecomputeProductStatsJob.php` | `+` | Every **15 minutes** → write to `catalog_public_items` (discovery never computes aggregates on request) |
| `api/Modules/Marketplace/app/Http/Controllers/ReviewController.php` | `+` | `POST /guyub/orders/{id}/reviews` (all items + merchant + driver at once) |
| `mob/apps/guyub_customer/lib/ui/features/review/review_page.dart` | `+` | 👍/👎 + preset reason, **no free comments**, can be skipped |
| `mob/apps/guyub_merchant/lib/ui/features/insights/private_feedback_card.dart` | `+` | "3 people said portions were small this week" — **private**, merchants can't delete |
| `web/app/pages/guyub/anomali-penilaian.vue` | `+` | Valuation spike from one number → show to Ops |

**Done if**: there are no "worst" ratings anywhere; badges are not affected by packages; the public is always anonymous.

---

## 5 — PHASE 3 — Services (motorbike taxi & courier) + Buy and send

**Week 36–43 · Apr–May 2027 · tag `v0.4.0`**
**Gate pass**: tested bailout ceiling; **"7 day highlight" manual sold ≥ 3×**.

---

### F3.1 — Passenger & courier motorbike taxi orders (week 36–37)

| File | Action | Contents |
|---|---|---|
| `api/Modules/Ordering/database/migrations/…_add_service_types_to_guyub_orders.php` | `~` | `order_type` `ojek`/`kurir` use **same state machine**, irrelevant steps skipped |
| `api/Modules/Ordering/app/Services/ServiceOrderPricing.php` | `+` | Tariffs from the zone matrix; application deductions below the legal limit (§22.4) |
| `api/Modules/Ordering/app/Services/OrderRefGenerator.php` | `~` | Prefix `OJK` |
| `mob/apps/guyub_customer/lib/ui/features/ride/ride_order_page.dart` | `+` | Pick up point & destination from the list of places; fixed rates appear **before** ordering |

### F3.2 — Travel Directory (week 37)

> **No bookings, no rates, no commission** (§22.4).

| File | Action | Contents |
|---|---|---|
| `api/Modules/Marketplace/database/migrations/…_create_guyub_travel_providers_table.php` | `+` | Licensed provider: name, route, hours, telephone number |
| `api/Modules/Marketplace/app/Http/Controllers/TravelDirectoryController.php` | `+` | Just read |
| `mob/apps/guyub_customer/lib/ui/features/travel/travel_directory_page.dart` | `+` | Register + **phone button** |

### F3.3 — Buy ​​and Sell (weeks 38–41)

> Reference: PRD §24, findings #31 & #32.

| File | Action | Contents |
|---|---|---|
| `api/Modules/Ordering/database/migrations/…_create_guyub_shopping_orders_table.php` | `+` | Shopping list (text ≤ 500 characters), estimate, receipt value, receipt photo, entrustment service |
| `api/Modules/Delivery/database/migrations/…_create_guyub_driver_limits_table.php` | `+` | Bailout ceiling + change history (**raised by manual Ops**, default IDR 50 thousand, max IDR 200 thousand) |
| `api/Modules/Ordering/app/Services/ShoppingOrderService.php` | `+` | Estimates above ceiling **rejected before offered**; one active entrustment order per driver; difference > 20% must be confirmed by customer |
| `api/Modules/Ordering/app/Http/Controllers/ShoppingOrderController.php` | `+` | `POST /guyub/shopping-orders`, `POST /guyub/driver/shopping/{id}/receipt`, `POST .../adjust` |
| `api/config/guyub-forbidden-items.php` | `+` | List of items that cannot be entrusted (§24.4) |
| `api/config/guyub-errors.php` | `~` | `GYB-DLV-301` (ceiling exceeded) |
| `mob/apps/guyub_customer/lib/ui/features/shopping/{shopping_order_page,receipt_update_page}.dart` | `+` | Store **name only**, no logo/menu/prices (finding #32) |
| `mob/apps/guyub_driver/lib/ui/features/shopping/{shopping_task_page,receipt_capture_page}.dart` | `+` | Photo of receipt **required**; button "No goods / different price" |

### F3.4 — Batching (weeks 41–42)

> Reference: PRD §33.3. The suture (`guyub_trips`) is placed at F2.3.

| File | Action | Contents |
|---|---|---|
| `api/Modules/Delivery/app/Services/BatchOfferService.php` | `+` | Max **2 orders/trip**, without passenger orders, postage for both **accepted in full** |
| `mob/apps/guyub_driver/lib/ui/features/offer/batch_offer_sheet.dart` | `+` | "There's another one from the same stall. Would you like one?" + **Pass without penalty** |

### F3.5 — “Highlight 7 days” sold manually (weeks 42–43)

> First income **without billing system** (PRD §12 Phase 3). If it doesn't sell manually, Phase 5 is cut.

| File | Action | Contents |
|---|---|---|
| `web/app/pages/guyub/sorot.vue` | `+` | Ops puts one merchant on the "Today's Picks" card, records the payment |
| `api/Modules/Marketplace/app/Http/Controllers/OpsHighlightController.php` | `+` | Write directly to public projections with `is_sponsored = true` |
| `mob/packages/guyub_ui/lib/src/widgets/sponsored_label.dart` | `~` | **"Sponsored" label mandatory**, max 20% proceeds, closed stalls never entered |

---

## 6 — PHASE 4 — Tour ticket + Light Cashier

**Week 44–53 · Jun–Aug 2027 · tag `v0.5.0`**
**Gate pass**: scan QR **offline** tested at the gate.

### F4.1 — Module `Ticketing` (weeks 44–48)

| File | Action | Contents |
|---|---|---|
| `api/Modules/Ticketing/**` | `+` | Scaffold module |
| `…_create_guyub_destinations_table.php` | `+` | Destinations + gate operating hours |
| `…_create_ticket_inventories_table.php` | `+` | Quota per date; **row lock per (destination, date)** |
| `…_create_guyub_tickets_table.php` | `+` | Ticket + exchange status; prefix `TKT` |
| `api/Modules/Ticketing/app/Services/TicketSigner.php` | `+` | Compact payload + **signature Ed25519**; public key embedded in the application |
| `api/Modules/Ticketing/app/Services/RedemptionReconciler.php` | `+` | Duplicate exchanges are prevented via local storage + reconciliation; clash → Ops |
| `api/Modules/Ticketing/app/Http/Controllers/TicketController.php` | `+` | `POST /guyub/tickets`, `GET /{id}`, `POST /redeem` (idempotent) |
| `mob/apps/guyub_customer/lib/ui/features/ticket/{destination_page,buy_ticket_page,my_tickets_page}.dart` | `+` | **QR is valid offline**; status not yet/already used |
| `mob/apps/guyub_merchant/lib/ui/features/gate/scan_page.dart` | `+` | **offline** signature verification, local log, synchronous following |
| `web/app/pages/publik/wisata/[slug].vue` | `+` | Photos, hours, prices, **limit remaining today**, how to get there |

### F4.2 — Light Cashier / POS in Merchant apps (weeks 48–53)

> Reference: PRD §18. **Deliberately without shifts, without valuations, without printers.**

| File | Action | Contents |
|---|---|---|
| `api/Modules/Ordering/app/Services/QueueNumberService.php` | `~` | Direct buyers **take numbers from the same sequence** (§32.2) |
| `api/Modules/Ordering/app/Http/Controllers/CounterSaleController.php` | `+` | Record offline sales; using the same variants & options (§34.5) |
| `api/Modules/Ordering/database/migrations/…_add_channel_to_guyub_orders.php` | `~` | `channel` = `aplikasi` / `kasir` |
| `mob/apps/guyub_merchant/lib/ui/features/pos/{pos_grid_page,quick_cart_sheet,daily_recap_page}.dart` | `+` | Product grid → quick cart → Cash/QRIS → save; mark runs out directly from the grid |

**Done when**: the kitchen accepts **one** order format, not two; Daily recap combines offline + online.

---

## 7 — PHASE 5 — Money, Premium & Ops

**Week 54–62 · Aug–Oct 2027 · tag `v0.6.0`**
**Gate pass**: first commission due; ≥ 10 premium merchants.

### F5.1 — Weekly commissions & billing (weeks 54–56)

| File | Action | Contents |
|---|---|---|
| `api/Modules/Payment/database/migrations/…_create_guyub_commissions_table.php` | `+` | Commission per order + weekly billing status |
| `api/Modules/Payment/app/Services/CommissionService.php` | `+` | Server calculated; **booking platform fees are separate from delivery service fees** (§23.2) |
| `api/Modules/Payment/app/Jobs/BuildWeeklySettlementJob.php` | `+` | Weekly recap: commission + pending shipping + subsidy reimbursement |
| `api/Modules/Payment/app/Http/Controllers/SettlementController.php` | `+` | `GET /guyub/settlements/summary` |
| `api/Modules/Finance/**` | `~` | Record commissions via the **existing** `Finance` module (not a new module) |
| `mob/apps/guyub_merchant/lib/ui/features/finance/recap_page.dart` | `~` | Delayed postage, subsidy reimbursement, commission owed |

### F5.2 — Premium subscriptions & `PlanService` (weeks 56–58)

> Reference: PRD §5h, finding #20. The money flow **reuses §5h** — no new code for the money.

| File | Action | Contents |
|---|---|---|
| `…_create_guyub_subscriptions_table.php` | `+` | One active subscription per merchant |
| `…_create_guyub_subscription_invoices_table.php` | `+` | Bill + `unique_amount` (prefix `TAG`); verified **Ops**, not a merchant |
| `api/Modules/Payment/app/Services/PlanService.php` | `+` | **Sole determination** of feature rights; the client just hides the | button
| `api/Modules/Payment/app/Http/Controllers/{MerchantPlanController,OpsInvoiceController}.php` | `+` | `GET plan`, `GET invoices`; Ops: `POST invoices/{id}/approve` |
| `mob/apps/guyub_merchant/lib/ui/features/premium/premium_page.dart` | `+` | Active package, billing, "I have transferred" |

### F5.3 — Sponsored slots, ad statistics, broadcast (weeks 58–60)

| File | Action | Contents |
|---|---|---|
| `…_create_guyub_ad_slots_table.php` | `+` | Daily quota **enforced in DB**; max 3 slots/day |
| `…_create_guyub_ad_daily_stats_table.php` | `+` | Daily aggregate views/clicks/orders — **not log per impression** |
| `api/Modules/Marketplace/app/Services/DiscoveryRankingService.php` | `~` | Sponsored **max 20%**; premium only *tie-break*; stall closed/out of stock never picked up |
| `api/Modules/Marketplace/app/Http/Controllers/AdSlotController.php` | `+` | `POST /guyub/merchant/ads`, `GET ads/stats` |
| `api/Modules/Marketplace/app/Services/BroadcastService.php` | `+` | **Merchants never receive numbers**; only customers who have ever ordered; max 1×/week; one tap opt-out; every broadcast is recorded audit (finding #19) |
| `api/tests/Feature/Guyub/SponsoredQuotaTest.php` | `+` | > 20% sponsored → rejected; Popularity badges are not affected by packages |

### F5.4 — Complete Ops console (weeks 60–62)

| File | Action | Contents |
|---|---|---|
| `web/app/pages/guyub/komplain.vue` | `+` | Complaint ticket + proof + history `guyub_order_events`; decision recorded audit |
| `web/app/pages/guyub/laporan.vue` | `+` | 4 numbers §30.6 + export |
| `web/app/pages/guyub/langganan.vue` | `+` | Subscription status, billing confirmation |
| `web/app/pages/guyub/penyalahgunaan.vue` | `+` | Canceled ratio, orders from the same number, claim rejection ratio per merchant (finding #11) |
| `web/app/config/nav.ts` | `~` | Complete Ops items, permission driven |

---

## 8 — PHASE 6 — Hardening & release

**Week 63–68 · Oct–Nov 2027 · tag `v1.0.0`**

| Features | File | Contents |
|---|---|---|
| **F6.1 State audit** | entire `lib/ui/features/**` in three apps | Each screen: loading / blank / failure + retry + trace code. No white screen (§2.10) |
| **F6.2 Offline resilience** | `mob/packages/guyub_core/lib/src/offline/{outbox,retry_policy}.dart` `+` | Each queued shipment uses the same **`Idempotency-Key`** when resubmitted; marker "not connected" |
| **F6.3 Light load test** | `infra/load/k6-guyub.js` `+` | 50 concurrent users, 10 minutes, p95 < 400 ms |
| **F6.4 Exercise restore** | `infra/backup/restore-drill.sh` `~` | Noted; target 12 out of 12 per year |
| **F6.5 Release** | `mob/apps/*/android/app/build.gradle` `~`, `web/app/content/guyub/*.md` `~` | Play Store listing, privacy policy, rollback to previously tested tags |

---

##9 — Notes & assumptions that need to be confirmed

1. **Web route prefix** (§0.3): public in `pages/publik/**`, Ops in `pages/guyub/**`, split via rewrite host. PRD calls them both under "web", but doesn't decide on a separation — this is my decision, change if you prefer two separate Nuxt projects.
2. **Module name** `Merchant`/`Marketplace`/`Ordering`/`Delivery`/`Ticketing`/`Payment` is locked during the first nwidart scaffold (PRD §15.11). After F0.1, rename = migration, not rename.
3. **Merchant courier in the Driver application** only turns on in F2.4 because the Driver application is not yet in Phase 1; in Phase 1 marking "delivered/completed" via the Merchant application. PRD §23.2 allows both, so it's not a reduction in scope — but it's worth mentioning to merchants during onboarding.
4. **Error code & `request_id`** I put some in Phase 0 (middleware + empty config file) even though PRD §37.4 lists it in step 5 of Phase 1. The reason: every screen failure since the vertical spike already needs a trace code. The code contents are still filled in per feature in Phase 1.
5. **`guyub_places` & `guyub_zones`** are in Phase 1 (checkout required), while `guyub_fare_matrix` is in Phase 2 (GUYUB courier required) — as per §37.2 which places site survey on parallel track week 1.
6. **Input channel (F1.10)** must not be shifted even if Phase 1 is lagging — it must be on on the first day of the pilot (§37.4.10, §26.4).
7. Estimated week wear **20 hours/week** (§37.1). If your pace is different, multiply the weeks — **the order doesn't change**.
