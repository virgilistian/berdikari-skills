# GUYUB — Status Implementasi (baca ini duluan)

**Update terakhir**: 2026-08-02.
**Kalau lanjut sesi baru: baca file ini dulu, jangan scan ulang PRD/doc 18/doc 19 dari nol.** Dokumen lain cuma dibuka kalau butuh detail spesifik yang tidak ada di sini (link ada di §7).

---

## 1 — Posisi sekarang

| Fitur | Status |
|---|---|
| F0.1 — Repo, CI, Docker, config-as-data | ✅ Selesai, terverifikasi |
| F0.2 — Auth PIN + OTP + device binding | ✅ Selesai, terverifikasi (17/17 test) |
| F0.3 — Module `Merchant` + tenancy + jam buka | ✅ Selesai, terverifikasi (8/8 test baru, 25/25 total Guyub) |
| F0.4–F0.9 | ⬜ Belum mulai — **lanjutan berikutnya: F0.4** |

Konteks keputusan: user sempat tanya soal NIB/NPWP/PSE (F0.9), lalu bilang **"lanjut F0.2 dulu, nanti diurus setelah sistem layak release"** — jadi F0.9 (legal) dan F0.8 (backup/credential drill) sengaja ditunda, bukan lupa. Lanjutkan F0.3+ tanpa menunggu itu, kecuali user bilang lain.

---

## 2 — PENTING: struktur repo

`berdikari-api/`, `berdikari-web/`, `berdikari-mobile/` **di-gitignore oleh repo root** (`.gitignore` baris `berdikari-api` dkk) — masing-masing adalah **git repo terpisah**. `git status` dari root TIDAK akan menunjukkan perubahan di dalamnya.

Semua kerja F0.1/F0.2 ada di `berdikari-api/` sebagai **uncommitted changes** (belum pernah di-commit — user belum minta). Untuk lihat: `cd berdikari-api && git status`. Root repo cuma nyimpan `docker-compose.yml` (diubah), `infra/` (baru), `.github/workflows/` (baru), dan dokumen `docs/`.

---

## 3 — Yang sudah dibangun

### F0.1 (root + `berdikari-api/`)
- 5 module nwidart baru (kosong, siap diisi): `Merchant`, `Marketplace`, `Ordering`, `Delivery`, `Payment` — aktif di `modules_statuses.json`.
- `config/guyub.php`, `guyub-fares.php`, `guyub-legal.php` (angka asli dari PRD §30.5/§35.3, legal sengaja `null` — nunggu F0.9), `guyub-errors.php` (mulai diisi kode `GYB-AUT-*` di F0.2).
- `RequestId` middleware → `X-Request-Id` + log context (ULID).
- Channel log `guyub` (JSON, redaksi PIN/OTP/token otomatis) — `Modules/Core/app/Support/Logging/{GuyubRedactProcessor,GuyubChannelTap}.php`.
- `docker-compose.yml`: service `worker`/`scheduler` baru, `redis --maxmemory 512mb allkeys-lru`.
- `infra/docker-compose.prod.yml`, `infra/nginx/api.conf`, `infra/.env.example`, `infra/README.md`, `berdikari-api/docker/php/fpm-pool.conf` (stack T0 produksi, php-fpm 4 worker statis).
- `.github/workflows/guyub-api.yml` (Pint + `migrate:fresh` + test di CI). **`guyub-mobile.yml` sengaja belum dibuat** — nunggu repo `guyub-mobile` yang belum ada.

### F0.2 (`berdikari-api/Modules/IAM/`, extend modul yang sudah ada — bukan modul baru)
- Auth phone + PIN 6 digit untuk customer/driver/merchant, **terpisah** dari login email+password IAM lama (Ops/Admin tetap pakai yang lama, tidak disentuh).
- 6 endpoint di `GuyubAuthController` (`Modules/IAM/app/Http/Controllers/`): `POST /api/v1/guyub/auth/{register,otp,set-pin,login,forgot-pin}`, `GET /api/v1/guyub/auth/me`.
- `PinService` (Argon2id+pepper, cek PIN lemah), `PinThrottleService` (5/10/15 berlapis per akun+device+IP, Redis/cache), `OtpService` + `OtpSender` interface + `LogOtpSender` (dev-only), `DeviceBindingService` + event `GuyubNewDeviceTrusted` (belum ada listener — nunggu FCM F0.5).
- Migrasi: kolom auth di `users` (`phone`, `pin_hash`, dst — `email`/`password` dilonggarkan jadi nullable), tabel `guyub_devices`, `guyub_otp_codes`, dan bisnis sentinel `GUYUB Platform` (lihat §5).
- 32 permission `guyub_*` + 7 role (`guyub-customer/driver/merchant-owner/staff/courier/ops/admin`) — role merchant mulai benar-benar dipakai di F0.3 (lihat di bawah).
- Test: `tests/Feature/Guyub/{AuthPinTest,AuthThrottleTest,DeviceBindingTest}.php` — 17/17 lulus.

### F0.3 (`berdikari-api/Modules/Merchant/`, modul yang sebelumnya kosong dari F0.1, sekarang diisi)
- Migrasi `+`: `guyub_merchants` (1:1 `businesses`; `type`, `verification_status`, `service_zone_id` tanpa FK — `guyub_zones` baru ada di Marketplace, `prep_minutes` default 30, `manual_status`/`manual_status_until`/`auto_closed_at`, `address_hamlet`, `phone_visible`, `slug`), `guyub_merchant_hours` (multi-sesi per hari, `day_of_week` 0=Minggu, unique per `business_id+day_of_week+session_order`), `guyub_merchant_closures` (`libur`/`sementara`/`otomatis`).
- Model `+` `Tenantable`: `GuyubMerchant`, `MerchantHour`, `MerchantClosure`.
- `OpeningHoursService` `+` implements `MerchantStatusContract` (`isOpenNow`/`lastOrderAt`/`nextOpenAt`, server time `Asia/Jakarta`) — satu-satunya pintu sinkron lintas modul, sengaja query lintas-tenant (`withoutGlobalScope(TenantScope::class)`) karena status buka/tutup memang publik by design (PRD §5k).
- `MerchantHoursController` `+`: `GET|PUT hours`, `PUT hours/prep-time`, `POST hours/close` (`duration` wajib: `30_minutes`/`1_hour`/`2_hours`/`until_tomorrow`), `POST hours/open`, `GET|POST hours/closures`, `DELETE hours/closures/{closure}` (tipe `libur` saja — `sementara`/`otomatis` cuma dibuat sistem).
- `MerchantProfileController` `+`: `POST /guyub/merchant` (onboarding — bikin `businesses` + `guyub_merchants` + role `guyub-merchant-owner` per-bisnis, pola sama seperti `BusinessController::store`), `GET|PUT profile`.
- Events `+` (tanpa listener — sama pola seperti `GuyubNewDeviceTrusted` di F0.2, nunggu F1.9): `MerchantOpened`, `MerchantClosed`, `MerchantUpdated`.
- Jobs `+` (dijadwalkan lewat `MerchantServiceProvider::configureSchedules`, bukan `routes/console.php` global): `ExpireTemporaryClosuresJob` (tiap menit — `isOpenNow()` sendiri sudah defensif cek `manual_status_until`, job ini cuma beresin cache/histori & event), `RemindMerchantToOpenJob` (tiap 15 menit, reuse `Core\NotificationService::broadcastToRole` — belum FCM, sama kategori dengan OTP `LogOtpSender`).
- Test `+`: `tests/Feature/Guyub/OpeningHoursTest.php` — 8/8 lulus (multi-sesi, last-order, tutup-sementara self-expire, flag `is_open` dari client diabaikan, validasi sesi tumpang tindih, IDOR antar-merchant).

---

## 4 — Keputusan desain yang saya ambil sendiri (tidak eksplisit di dokumen rencana)

Kalau nanti nemu perilaku yang "kok gini caranya", ini alasannya — bukan salah baca spec:

1. **Pola 2 langkah + grant sementara**: `register`/`forgot-pin` → kirim OTP. `POST /auth/otp` verifikasi kode → set grant cache 10 menit (`guyub:otp-grant:{phone}:{purpose}`). `set-pin`/`forgot-pin` (mode isi PIN) baru jalan kalau grant itu ada. Tujuannya: client tidak perlu kirim ulang kode OTP di langkah terakhir.
2. **Purpose `device` (login dari HP baru) TIDAK lewat `/auth/otp` bersama** — sengaja inline di dalam `login()` sendiri, karena butuh PIN sudah benar duluan sebelum boleh minta OTP device (lebih aman, gak bisa spam OTP cuma modal nomor HP orang).
3. **Registrasi mandiri SELALU jadi `guyub-customer`** — tidak ada field role yang bisa dipilih client. Role driver/merchant cuma didapat lewat proses verifikasi terpisah (F2.2, F0.3+).
4. **`weak_pins.php`**: bukan dataset breach asli (tidak ada dataset publik PIN 6-digit yang terverifikasi), tapi kurasi pola lemah umum. Boleh diganti kalau nanti nemu dataset asli.
5. **Onboarding merchant lewat `MerchantProfileController@store`, bukan endpoint terpisah**: dokumen rencana (doc 19 F0.3) tidak eksplisit sebut endpoint pendaftaran merchant, tapi §8 STATUS ini (versi sebelumnya) sudah bilang role `guyub-merchant-owner` harus "baru benar-benar terpakai" di F0.3 — jadi provisioning `businesses`+`guyub_merchants`+role digabung ke `POST /guyub/merchant`, field-nya persis field yang memang jadi tanggung jawab `MerchantProfileController` (nama, jenis usaha, alamat dusun).
6. **Foto profil merchant TIDAK dapat kolom baru** — dianggap sama dengan logo bisnis yang sudah ada (`businesses.logo_path`/`logo_disk`, endpoint `POST business/{business}/logo` di `Core\BusinessController`). Tidak diduplikasi.
7. **`guyub_merchants.slug` = `businesses.code`** (bukan generator slug terpisah) — keduanya butuh sifat unique yang sama; slug "asli" (SEO-friendly, cek tabrakan) baru perlu dibangun betulan di F1.9 (public projection).
8. **Durasi "Tutup Sementara" `until_tomorrow`** diartikan sebagai *awal hari besok* (00.00 keesokan hari), bukan "+24 jam dari sekarang" atau "sampai jadwal buka berikutnya" — begitu lewat tengah malam, jadwal mingguan normal langsung berlaku lagi tanpa perlu query tambahan.
9. **`guyub_merchant_closures` tipe `sementara`/`otomatis` cuma tercatat sebagai histori/audit** — sumber kebenaran untuk cek cepat "apakah sedang tutup manual" tetap kolom `guyub_merchants.manual_status`/`manual_status_until` (biar `isOpenNow()` gak perlu query tambahan ke tabel closures kecuali untuk `libur`). Kedua tabel/kolom sengaja tidak digabung jadi satu sumber kebenaran karena beda kebutuhan: cache cepat vs. riwayat.

---

## 5 — Bug yang ditemukan & sudah diperbaiki saat verifikasi

Dua bug nyata ketemu pas testing end-to-end (bukan cuma nulis kode lalu percaya):

1. **`App\Models\User`'s `#[Fillable(...)]` attribute** tidak include `phone`/`pin_hash`/dst → `User::create()` diam-diam BUANG kolom itu, akun GUYUB kebuat tapi phone/PIN-nya kosong. **Sudah diperbaiki** — kolom baru ditambahkan ke Fillable + Hidden(`pin_hash`) + `casts()`.
2. **`model_has_roles.business_id` NOT NULL** (tabel pivot spatie/laravel-permission, teams aktif) — role "global" (`guyub-customer` dkk, tidak terikat 1 bisnis) tetap butuh nilai team, gak bisa `null`. **Solusi**: bisnis sentinel `GUYUB Platform` (`Modules\IAM\Support\GuyubPlatformTeam::ID`, UUID tetap `00000000-0000-7000-8000-0000000679b0`, diseed via migrasi) dipakai sebagai `business_id` teknis untuk role-role global itu — bukan bisnis/merchant sungguhan.
3. **(F0.3) Eloquent `datetime` cast TIDAK menormalkan timezone** — `Model::fromDateTime()` cuma `format()` objek Carbon apa adanya (timezone-nya ikut objek itu), sedangkan pembacaannya (`asDateTime()`) selalu melabel ulang string dari DB pakai `config('app.timezone')` (`UTC` di proyek ini). Akibatnya: `Carbon::now('Asia/Jakarta')` yang langsung disimpan ke kolom `manual_status_until`/`starts_at`/`ends_at` bakal salah baca +7 jam begitu di-fetch lagi — ketemu lewat test `test_temporary_close_self_expires_via_job` (assert gagal karena `ends_at` yang harusnya ≈ waktu sekarang malah mundur 7 jam). **Sudah diperbaiki**: `OpeningHoursService`/`MerchantHoursController`/`ExpireTemporaryClosuresJob` selalu `->utc()` sebelum nilai Carbon ber-zona Jakarta menyentuh kolom datetime (baik untuk write maupun bind di `where()`) — kolom `time` (`open_time`/`close_time`) tidak kena masalah ini karena dibandingkan sebagai string `H:i:s`, bukan lewat cast datetime.

---

## 6 — Gotcha operasional (biar gak buang waktu lagi)

- **Ubah env var di `docker-compose.yml` tidak otomatis kepakai** di container yang sudah jalan — harus `docker-compose up -d <service>` ulang (bukan cuma `exec`).
- **`migrate:fresh` di dev me-reset DB** — kalau habis jalanin itu, roles/permissions ikut hilang, harus `php artisan db:seed --class="Modules\\IAM\\Database\\Seeders\\IAMDatabaseSeeder" --force` lagi (ini yang manggil `PermissionSeeder`+`RolePermissionSeeder`).
- **8 test gagal di full suite (`php artisan test`) itu PRE-EXISTING, bukan regresi GUYUB** — sudah dicek pakai `git stash` (gagal sama persis tanpa perubahan apa pun). Penyebabnya tanggal sistem maju ke Agustus, kena test lama yang hardcode kalender di modul Tax/Sales/Inventory/Catalog. Kalau lihat kegagalan itu lagi, jangan panik/coba perbaiki — bukan tanggung jawab kerjaan GUYUB.
- **`docker-compose` (spasi, plugin) error "unknown command"** di environment ini — pakai `docker-compose` (strip, binary lama), itu yang jalan.
- Pint style issues di file-file IAM lama (`AuthController.php`, `UserResource.php`, dll) juga pre-existing — jangan buang waktu benerin kalau tidak diminta.

---

## 7 — Yang sengaja belum berfungsi (dicatat, bukan kelupaan)

- **OTP asli belum bisa terkirim** — `LogOtpSender` cuma tulis ke log lokal, menolak jalan kalau `APP_ENV=production`. Belum ada akun WhatsApp Business API / SMS gateway (prasyarat eksternal, sama kategori dengan domain & legal).
- F0.9 (legal: NIB/NPWP/PSE, rekening komisi, survei tempat) & F0.8 (latihan restore/credential custody) — ditunda atas permintaan user.

---

## 8 — Lanjutan: F0.4

**Flutter monorepo framework (SHR + CUS + MER)** (minggu 3–4, PRD §6.5, doc 18 §1/§3.1, `docs/16-mobile-implementation-plan.md`, doc 19 F0.4). Repo terpisah (`guyub-mobile/`, seperti `berdikari-mobile` — belum ada, harus dibuat dulu). Melos workspace, `packages/guyub_core` (`ApiClient` + `Idempotency-Key`, auth PIN/OTP/device pakai `flutter_secure_storage`, generator kode error dari `api/config/guyub-errors.php` — **jangan retype manual**, §31.1), `packages/guyub_ui` (design token §27, widget `AppButton`/`RupiahText`/`RupiahField`/`EmptyState`/`ErrorState`, tinggi ≥44px), lalu app `guyub_customer` (bottom nav 4 item) dan `guyub_merchant` mulai dibangun paralel. F0.3's kontrak (`POST /guyub/merchant`, `GET|PUT /guyub/merchant/{profile,hours}`, dst — lihat §3 di atas) adalah backend yang dikonsumsi app Merchant.

---

## 9 — Referensi (buka kalau butuh detail, bukan bacaan wajib)

| Butuh apa | Buka file mana |
|---|---|
| PRD lengkap, semua angka bisnis | `docs/17-guyub-prd.md` |
| Spek layar per app | `docs/18-guyub-spesifikasi-fitur.md` |
| File per fitur (`F<fase>.<n>`) | `docs/19-guyub-rencana-implementasi.md` |
| Detail F0.1–F0.9 per platform | `docs/guyub-rencana-platform/fase-0-fondasi.md` |
| Pemetaan desain Stitch ↔ fitur | `docs/guyub-rencana-platform/pemetaan-desain-stitch.md` |
| Kalender & aturan lintas fase | `docs/guyub-rencana-platform/00-indeks.md` |
