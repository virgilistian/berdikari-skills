# Phase 0 — Foundation · per platform

**Week 1–6 · Aug–Sep 2026 · tag `v0.1.0`**
References: PRD §12, §37.3, §37.4 (Sequential Phase 0), §37.5 · doc 18 §9 · doc 19 §2.
Index: [`00-indeks.md`](00-index.md)

**Phase pass gate** (PRD §37.3, §37.6):
- Vertical spikes §37.5 green **on real cheap Android phones** — not an emulator.
- First restore exercise completed **inside RTO** and time recorded.
- Legal checklist §22.8 completed.
- CI green in both repos; `v0.1.0` tag created.

---

## 1 — Summary per platform

| Platforms | Those born in this phase | Which **doesn't** exist yet |
|---|---|---|
| **API** | `config-as-data`, `RequestId`, PIN/OTP/device auth, `Merchant` module + operating hours, FCM sender, `Ordering` thinnest version | Catalog, basket, payment, shipping |
| **WEB** | Web Public profile: home, legal, partner registration, status | `/w/<slug>`, entire Console Ops |
| **CUS** | App framework + `go_router` + bottom nav 4 items + unlock/login/register/PIN + thin version status screen | Discovery, cart, checkout |
| **MER** | App framework + login + **notification sounds from pocket** + slim version login order card | Menu, payment verification, opening hours (UI) |
| **DRV** | — (this app was born in Phase 2) | Everything |
| **SHR** | `guyub_core` (ApiClient, error codes, auth, base model) + `guyub_ui` (design token, base widget) | Order/tracking widget |
| **INF** | Docker prod, encrypted backup, DR runbook, credential custody, legal checklist | K8s, paid monitoring |

---

## 2 — Critical path & parallelization

**In absolute order** (PRD §37.4 — each overlapping the previous):

```
F0.1 config+CI  →  F0.2 Auth  →  F0.3 Merchant/jam buka  →  F0.4 Kerangka Flutter
                                                             →  F0.5 Notifikasi merchant
                                                             →  F0.6 PAKU VERTIKAL (minggu 5)
```

**Parallel paths that should start week 1** (PRD §37.2 — wait times are out of our control):

| Path | Start | The output used by the | code
|---|---|---|
| **Legal & administrative** (F0.9) | Week 1 | `api/config/guyub-legal.php`, `web/app/content/guyub/*.md`, special commission account |
| **Field survey** (F0.9) | Week 1 | `api/Modules/Marketplace/database/data/guyub-places.csv` → used F1.2 |
| **Profile Web** (F0.7) | Week 5 | Can be done without waiting for mobile |

**Stop rule**: if F0.6 fails in week 5, **stop other work** until it is resolved (PRD §37.5). F0.7 and F0.8 can be reversed; vertical spikes do not.

---

## F0.1 — Repo, CI, Docker, `config-as-data`

**Week 1** · PRD §25.2, §30.4, §31.1 · doc 19 F0.1

| Platforms | Engage | Sequence |
|---|---|---|
| API | ✅ heavy | 1 |
| INF | ✅ | 1 (parallel) |
| WEB / CUS / MER / DRV | — | — |

### API

Six things must be **data** from the first line: brand, zone & place, rate matrix, commission & packages, Ops contact, legal text.

- `api/config/guyub.php` `+` — brand, Ops contact, `Asia/Jakarta`, time limits (pay 15 min, claim 60 min, merchant response 5 min, take limit 60 min), default commission, plans & pricing.
- `api/config/guyub-errors.php` `+` — single source of truth `GYB-<AREA>-<KELAS><NNN>` → technical explanation + Language copy. Blank first, fill in per feature.
- `api/config/guyub-fares.php` `+` — `harga_bensin`, `konsumsi_km_per_liter`, `perawatan_per_km`, `upah_waktu_per_jam` (§35.3).
- `api/config/guyub-legal.php` `+` — data controller, NIB/PSE, contact address (filled in from F0.9).
- `api/app/Http/Middleware/RequestId.php` `+` + `api/bootstrap/app.php` `~` — ULID per request → `X-Request-Id`, login context log & Sentry tag.
- `api/config/logging.php` `~` — channel `guyub`, one line of JSON, **deny list** cellphone number/PIN/OTP/token/body auth & payment.
- `api/modules_statuses.json` `~` — enable `Merchant`, `Marketplace`, `Ordering`, `Delivery`, `Payment`.

### INF

- `docker-compose.yml` `~` — services `worker` (`queue:work`) & `scheduler` (`schedule:work`) using image `api`; `redis` `maxmemory 512mb allkeys-lru`.
- `infra/docker-compose.prod.yml` `+` — T0 stack §25.2 (nginx, api 4 workers `pm=static`, worker, scheduler, redis).
- `infra/README.md` `+` — VPS provisioning T0 + mandatory variables.
- `.github/workflows/guyub-api.yml` `+` — Pest/PHPUnit + Pint + `migrate:fresh` in Postgres service.
- `.github/workflows/guyub-mobile.yml` `+` — `melos bootstrap` → `analyze` → `test` (idle until F0.4 — intentionally made first).

**Done when** — API: `docker compose up` running worker & scheduler; **not a single business number** (commission, rates, time limits) is written in the code. INF: CI green on both repos.

---

## F0.2 — Auth: 6 digit PIN, Argon2id + pepper, throttling, device binding

**Weeks 1–2** · PRD §36.4, §36.5, findings #6 & #36 · doc 18 §3.1 · doc 19 F0.2

| Platforms | Engage | Sequence |
|---|---|---|
| API | ✅ heavy | 1 |
| SHR / CUS / MER | consumption at F0.4 | 2 |

> **All other features ride on this.** There is no client screen in this feature — the contract is first, the UI is in F0.4.

### API

- Migration `+`: `…_add_guyub_auth_to_users_table` (unique `phone`, `phone_verified_at`, `pin_hash`, `pin_updated_at`), `…_create_guyub_devices_table`, `…_create_guyub_otp_codes_table`.
- `PinService.php` `+` — Argon2id + **pepper from config (env, not DB)**; `hash()`, `verify()`, `rejectWeak()`.
- `app/Support/weak_pins.php` `+` — 100 most common PINs + repeating/sequential patterns/birth year (§36.4.3).
- `PinThrottleService.php` `+` — layered 5/10/15 on Redis, calculated per **account + device + IP**.
- `OtpService.php` `+` — `OtpSender` interface so that WA/SMS can be exchanged.
- `DeviceBindingService.php` `+` — new device required OTP + **notify old device**.
- `GuyubAuthController.php` `+` + Requests `+` + `routes/api.php` `~` — `register`, `otp`, `login`, `set-pin`, `forgot-pin`, `me`; rate limit per number/device/IP.
- `PermissionSeeder.php` `~` — all `guyub_*` permissions (PRD §9) + roles `guyub-customer`, `guyub-driver`, `guyub-merchant-owner/staff/courier`, `guyub-ops`.
- `api/.env.example` `~` — `GUYUB_PIN_PEPPER`, `GUYUB_OTP_PROVIDER`.
- Test `+`: `AuthPinTest`, `AuthThrottleTest`, `DeviceBindingTest`.

**Outgoing contract to client** (used F0.4):
`POST /guyub/auth/register` · `POST /guyub/auth/otp` · `POST /guyub/auth/login` · `POST /guyub/auth/set-pin` · `POST /guyub/auth/forgot-pin` · `GET /guyub/auth/me`.

**Done when** — green weak throttle & PIN test; no HP/PIN/OTP number appears in the log; **Ops/Admin remains password + TOTP** (§36.5), not PIN.

---

## F0.3 — Module `Merchant` + tenancy + operating hours

**Weeks 2–3** · PRD §5k, §8, finding #22 · doc 19 F0.3

| Platforms | Engage | Sequence |
|---|---|---|
| API | ✅ heavy | 1 |
| MER | The UI is in Phase 1 (F1.0 ⊕) | — |

### API

- Scaffold nwidart `api/Modules/Merchant/**` `+`.
- Migration `+`: `…_create_guyub_merchants_table` (1:1 `businesses`: type, verification status, service zone, `prep_minutes`, `manual_status`, `manual_status_until`, `auto_closed_at`, `slug`), `…_create_guyub_merchant_hours_table` (**multiple rows per day**), `…_create_guyub_merchant_closures_table`.
- Models `+` `Tenantable`: `GuyubMerchant`, `MerchantHour`, `MerchantClosure`.
- `OpeningHoursService.php` `+` — `isOpenNow()`, `lastOrderAt() = close − prep_minutes`, `nextOpenAt()`, **always from server time** `Asia/Jakarta`.
- `Contracts/MerchantStatusContract.php` `+` — the only synchronous door for `Ordering` & `Marketplace`.
- `MerchantHoursController.php` `+` — `GET|PUT /guyub/merchant/hours`, `PUT prep-time`, `POST close` (**`duration` required**), `POST open`, `GET|POST|DELETE closures`.
- `MerchantProfileController.php` `+` — name, photo, hamlet level address, approval for displaying cellphone number.
- Events `+`: `MerchantOpened`, `MerchantClosed`, `MerchantUpdated` — public projection trigger (F1.9).
- Jobs `+`: `ExpireTemporaryClosuresJob` (temporarily close expires itself), `RemindMerchantToOpenJob`.
- Test `+`: `OpeningHoursTest` — multi-session, last message limit, **open/close flags from clients ignored**.

**Done when** — two sessions/day schedule works; close temporarily recover automatically; open/close status **never** comes from the client.

---

## F0.4 — Flutter monorepo framework (SHR + CUS + MER)

**Week 3–4** · PRD §6.5 · doc 18 §1, §3.1 · `docs/16-mobile-implementation-plan.md` · doc 19 F0.4

| Platforms | Engage | Sequence |
|---|---|---|
| SHR (`guyub_core`, `guyub_ui`) | ✅ heavy | 1 |
| CUS | ✅ | 2 |
| MER | ✅ | 2 (parallel to CUS) |
| DRV | — (Phase 2) | — |

### SHR — `packages/guyub_core`

- `melos.yaml`, `pubspec.yaml`, `analysis_options.yaml` `+` — workspace + scripts `analyze`/`test`/`format`.
- `src/api/api_client.dart` `+` — one `ApiClient` (`http`), `Idempotency-Key`, device header, capture `X-Request-Id`.
- `src/api/api_exception.dart` `+` — maps Laravel error form + code `GYB-…` + 5 character trace code.
- `tool/gen_error_codes.dart` `+` → `src/errors/guyub_error_codes.g.dart` `+` — generator of `api/config/guyub-errors.php`. **Error codes are never retyped** (§31.1).
- `src/auth/{auth_repository,secure_token_store,device_id}.dart` `+` — PIN/OTP/device; tokens in `flutter_secure_storage`.
- `src/models/*.dart` `+` — `freezed`/`json_serializable`: `auth_user`, `merchant`, `product`, `order` (increases per phase).
- `src/config/env.dart` `+` — base URL per flavor.

### SHR — `packages/guyub_ui`

- `src/tokens/{colors,typography,spacing}.dart` `+` — design token §27, palette of local objects, **one accent**.
- `src/widgets/{app_button,rupiah_text,rupiah_field,empty_state,error_state}.dart` `+` — height ≥ 44 px; `EmptyState` & `ErrorState` **must have one action**.

### CUS — `apps/guyub_customer`

- `lib/{main,app}.dart`, `lib/routing/router.dart`, `lib/l10n/app_id.arb` `+` — framework + `go_router` + **bottom nav 4 items** (Home · Orders · Notifications · Account).
- `lib/ui/features/auth/**` `+` — 3 slide opener, login (HP + 6-digit PIN + fingerprint if supported), register (HP → OTP → create PIN → nickname), forgot PIN (doc 18 §3.1).
- Location & notification permissions **requested when needed**, not in the opener.

### MER — `apps/guyub_merchant`

- `+` Framework — nav: Home · Orders · Menu · Others; the login screen uses the same `guyub_core/auth`.

**Done when** — two apps installed on a real Android phone, can **register & log in**, cold start < 3 seconds, APK < 30 MB, `melos analyze` & `test` green on CI.

---

## F0.5 — Merchant notification: FCM high priority + foreground + alarm

**Week 4–5** · PRD §6.5, §7.3, §14 (risk number one) · doc 18 §6 · doc 19 F0.5

| Platforms | Engage | Sequence |
|---|---|---|
| API | ✅ | 1 |
| MER | ✅ heavy (including Kotlin native) | 2 |
| CUS / DRV / WEB | — | — |

> **Unheard orders = lost orders.** This is the number one risk across all products.

### API

- Migration `…_create_guyub_device_tokens_table` `+` — FCM token per user + device.
- `Modules/Core/app/Services/FcmSender.php` `+` — send high priority FCM, channel per event type (doc 18 §6).
- `Modules/Core/app/Contracts/PushSenderContract.php` `+` — other modules **never** touch the FCM directly.

### MER

- `android/app/src/main/AndroidManifest.xml` `~` — `FOREGROUND_SERVICE`, `POST_NOTIFICATIONS`, `USE_FULL_SCREEN_INTENT`, battery exclusion permission.
- `android/app/src/main/kotlin/**/OrderForegroundService.kt` `+` — foreground service as long as the merchant is in "Open" status.
- `lib/data/services/fcm_service.dart` `+` — token registration, background message handling.
- `lib/data/services/order_alarm_service.dart` `+` — alarm **repeats until order is opened**; break through silent mode.
- `assets/sounds/pesanan_baru.ogg` `+` — tone heard from inside the pocket.
- `lib/data/services/order_poller.dart` `+` — **20 second backup poll** when there is an active order (§7.3). FCM is an acceleration, not the only path.

**Done when** — Phone in pocket, screen off, silent mode → order **audible**; polling continues to work when FCM is forced to shutdown.

---

## F0.6 — VERTICAL NAILS (target week 5)

**Week 5** · PRD §37.5 · doc 19 F0.6

> One stall · one product · one customer · **no payment** · **no discovery**.
> Customer presses Message → merchant's cell phone in pocket, screen turns off, silent mode, **beep** → merchant presses Accept → customer sees the status change.

| Platforms | Engage | Sequence |
|---|---|---|
| API | ✅ thinnest version | 1 |
| MER | ✅ | 2 |
| CUS | ✅ | 2 |

### API — thinnest version of F1.2/F1.5

- `api/Modules/Ordering/**` `+` — scaffold + minimal `guyub_orders` + `POST /guyub/orders` + `POST /guyub/merchant/orders/{id}/accept`. There are no prices, shipping, or full status machines.

### CUS

- `lib/ui/features/order_status/order_status_page.dart` `+` — slim version: status changes after merchant presses Accept.

### MER

- `lib/ui/features/orders/incoming_order_page.dart` `+` — card full screen + Accept button.

**Done when** — flow sounds & changes status **on two real cheap Android phones**.
**If it fails in week 5 — stop all other work until it is resolved.** There is no other feature that can cover this failure.

---

## F0.7 — GUYUB Profile Web: homepage, legal, partner registration, status

**Weeks 5–6** · PRD §20 · doc 18 §2.1, §2.4, §2.5 · doc 19 F0.7

| Platforms | Engage | Sequence |
|---|---|---|
| WEB | ✅ heavy | 1 |
| API | ✅ light (registration form) | 1 (parallel) |

> The `/w/<slug>` page is **not** here — it awaits public projection at F1.9.

### WEB

Two route spaces are split via host rewrite (doc decision 19 §0.3 — confirmation before Phase 0 completes):

| Space | File | Public URL | Auth |
|---|---|---|---|
| Profile Web | `web/app/pages/publik/**` | `guyub.<domain>/…` | No |
| Ops Console | `web/app/pages/guyub/**` | `<app-domain>/guyub/…` | Sanctum + `guyub-ops` |

- `web/functions/_middleware.ts` `+` — rewrite host `guyub.<domain>` → prefix `/publik`.
- `web/app/layouts/publik.vue` `+` — lightweight layout, tokens same color as application, **target < 100 KB per page**.
- `web/app/pages/publik/index.vue` `+` — one sentence proposition, download button, "3 steps to order", service area, number of stalls & drivers.
- `web/app/pages/publik/daftar-warung.vue` `+` — name, cellphone, village, type of business, 1–3 photos.
- `web/app/pages/publik/gabung-driver.vue` `+` — + statement of active SIM C & STNK.
- `web/app/pages/publik/{bantuan,privasi,ketentuan,status}.vue` `+` — FAQ 10–15 questions + WA Ops button; legal from `web/app/content/guyub/*.md`.
- `web/app/content/guyub/{privasi,ketentuan}.md` `+` — legal text **as data** (§30.4); mention the name of the owner as **data controller**; without total exoneration clause (§22.6).
- `web/app/stores/guyubPublic.ts` `+` — fetch public data, **60 second cache**. New stores — don't touch existing stores.

### API

- Migration `…_create_guyub_partner_applications_table` `+` — merchant/driver registration → Ops verification queue.
- `PartnerApplicationController.php` `+` — `POST /guyub/partner-applications` + rate limit + simple anti-spam. Registrant data is **PII** (§11).

**Done when** — WEB: each page < 100 KB; the legal page names the data controller; if the projection fails to load, the home page **still appears without a shop list** (not a failed page). API: Ops queue entry form; successfully sent → *"Thank you! We will contact you via WhatsApp within 2 working days."*

---

## F0.8 — First credential custody, backup, restore exercise

**Week 6** · PRD finding #16, §19.2, §19.3, finding #27 · doc 19 F0.8

| Platforms | Engage |
|---|---|
| INF | ✅ — **existential risk, do it now, not later** |

- `infra/backup/pg_dump_encrypted.sh` `+` — **encrypted** daily dump → R2; Keys are kept separately.
- `infra/backup/restore-drill.sh` `+` — restore to temporary instance + time recording (RTO).
- `infra/backup/retention.md` `+` — retention §19.2; **second copy treated as strictly as production**.
- `docs/20-guyub-runbook-dr.md` `+` — scenario §19.4, break-glass account, sequence of steps.
- `docs/21-guyub-kustodi-kredensial.md` `+` — list of credentials, password manager location, **printed 2FA backup code**, second account in hosting/DNS/Play Console.

**Done when** — one restore exercise is completed **inside the RTO** and the time is recorded; the backup code is already printed and stored offline.

---

## F0.9 — Legal checklist & field survey (parallel track, starting **week 1**)

**Weeks 1–6, parallel** · PRD §22.8, §37.2 · doc 19 F0.9

Not code work, but **blocking public release** — the timing is out of our control.

| Output | The platform that is waiting for him |
|---|---|
| NIB (OSS), NPWP, PSE Kominfo private scope | API (`config/guyub-legal.php`), WEB (`/publik/ketentuan`) |
| **Commission only** account, separate, never used to pay orders (finding #17) | API (`config/guyub.php`) |
| Privacy policy & T&Cs Indonesian | WEB (`web/app/content/guyub/*.md`) |
| **Survey list of places**: village/hamlet/benchmark, zone, terrain class (§35.5) | API + CUS — `api/Modules/Marketplace/database/data/guyub-places.csv`, used **F1.2** |

> Without a list of places, **checkout cannot be tested at all** (§37.2). Surveying two sub-districts took weeks to walk, not a day.

---

##8 — Phase 0 weekly calendar

| Sunday | API | WEB | CUS | MER | SHR | INF / parallel |
|---|---|---|---|---|---|---|
| 1 | F0.1 config + F0.2 auth | — | — | — | — | F0.1 CI/Docker · **F0.9 legal + start survey** |
| 2 | F0.2 auth + F0.3 Merchant | — | — | — | — | F0.9 |
| 3 | F0.3 operating hours | — | — | — | F0.4 `guyub_core` | F0.9 |
| 4 | F0.5 FcmSender | — | F0.4 auth UI | F0.4 framework + F0.5 native | F0.4 `guyub_ui` | F0.9 |
| 5 | F0.6 Thin ordering | F0.7 start | **F0.6 vertical spikes** | **F0.6 vertical spikes** | — | F0.9 |
| 6 | F0.7 partner apps | F0.7 legal & form | — | — | — | **F0.8 restore drill** |

---

## 9 — Notes & assumptions of this phase

1. **No ⊕ marker in Phase 0** — doc 18 §9 only promises "framework + login" for Customer & Merchant, and that's exactly what F0.4 covers.
2. **The Driver Application was intentionally left untouched.** Building the framework now just adds to CI's burden without proving anything; it was born in F2.2 when dispatch actually existed.
3. **Web route prefix** (`publik/**` vs `guyub/**`) is doc decision 19 §0.3, not PRD. Confirm before Phase 0 closes — changing it after F0.7 means moving the file and rewriting it.
4. **Module name** `Merchant`/`Marketplace`/`Ordering`/`Delivery`/`Payment` **locked** during first nwidart scaffold (F0.1/F0.3). Afterwards, rename = migration, not rename.
5. **Error code comes in early** from PRD §37.4 (which puts it in step 5 of Phase 1): middleware + empty config file exists since F0.1, because every screen failure **since the vertical spike** already needs a trace code. The code contents are still filled in per feature in Phase 1.
