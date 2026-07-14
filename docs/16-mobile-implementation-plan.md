# 16 — Berdikari Mobile (Flutter) — Implementation Plan

**App**: `berdikari-mobile` — the Flutter client of the Berdikari ERP.
**Repo**: `https://github.com/virgilistian/berdikari-mobile.git` (verified empty — bootstrap from scratch).
**Local path**: `berdikari-mobile/` inside this workspace (own `.git`, independent of `berdikari-api`/`berdikari-web`; the `.agents/manifest.yaml` Flutter skills already trigger on `berdikari-mobile/**`).

---

## 1 — Goal & scope

A native mobile client for Indonesian UMKM users (kasir, owner, production team) consuming the **existing** `berdikari-api` Laravel API. The API is stateless by design (Project DNA non-negotiable #6) precisely so this app can reuse every endpoint unchanged.

**In scope (v1.0)**: Auth + RBAC navigation, POS + shift kasir, catalog, inventory (stok harian + stok & valuasi), finance, HR (absensi + cuti), notifications, dashboard.
**Out of scope (v1.0)**: Purchasing, CRM, Production recommendation UI, Ticketing, offline-first sync (basic offline resilience only), push notifications (polling parity first).

## 2 — Hard constraints (inherited from Project DNA)

1. **Bahasa Indonesia only** for all user-facing copy — enforced via l10n from day one (`id` is the only shipped locale initially; `.arb` keys in English, values in Bahasa).
2. **Simplicity over completeness** — no accounting jargon; same plain words as web (pemasukan, pengeluaran, stok masuk/keluar).
3. **Touch targets ≥ 44×44 px**; design at 360–375 dp width first.
4. **API contracts are immutable** — the app adapts to the API, never the reverse. No new endpoints in v1.0.
5. **RBAC deny-by-default** — navigation and UI actions derive from `permissions[]` returned by `POST /auth/login` / `GET /auth/me`. Hide (don't disable) unauthorized actions. Sanctum bearer tokens; token abilities mirror permissions at issuance (DNA §9h.7).
6. **Tenancy** — all state reads `business_id` from the authenticated user; never hardcoded.

## 3 — Stack decisions

| Concern | Choice | Rationale |
|---|---|---|
| Framework | Flutter stable (3.x), Dart 3, Material 3 | Team skill set; installed `.agents` Flutter skills assume it |
| Architecture | Layered UI / Data (+ optional Domain), MVVM with `ChangeNotifier` ViewModels | Per `flutter-apply-architecture-best-practices` skill |
| DI | `provider` (ViewModels) + constructor injection; `get_it` only if provider nesting hurts | Skill default; smallest viable |
| Routing | `go_router` with `MaterialApp.router`, auth redirect guard | Per `flutter-setup-declarative-routing` skill |
| HTTP | `http` package wrapped in a single `ApiClient` service | Per `flutter-use-http-package` skill |
| JSON | `json_serializable` + `freezed` for immutable API/domain models | Per `flutter-implement-json-serialization` skill |
| l10n | `flutter_localizations` + `intl`, `l10n.yaml`, ARB files | Per `flutter-setup-localization` skill |
| Token storage | `flutter_secure_storage` (Keychain / EncryptedSharedPreferences) | Never plain SharedPreferences for tokens |
| Money/format | `intl` `NumberFormat.currency(locale: 'id_ID', symbol: 'Rp')` | Mirrors web `useRupiahInput` behavior |
| Tests | unit (ViewModel/Repository), widget tests, `integration_test` for POS checkout + auth | Per `flutter-add-widget-test` / `flutter-add-integration-test` skills |

## 4 — Project structure

Per the architecture skill (feature-grouped UI, type-grouped data):

```text
berdikari-mobile/
├── lib/
│   ├── config/                  # Env (API base URL per flavor), constants
│   ├── data/
│   │   ├── models/              # API models (freezed + json_serializable)
│   │   ├── services/            # ApiClient (http), TokenStorage, one service per API module:
│   │   │                        #   auth_service, sales_service, inventory_service,
│   │   │                        #   catalog_service, finance_service, hr_service, notification_service
│   │   └── repositories/        # auth, cart/checkout, shift, daily_stock, inventory,
│   │                            #   catalog, finance, orders, hr, notifications
│   │                            #   (1:1 with the web Pinia stores — same responsibilities)
│   ├── domain/
│   │   ├── models/              # Clean domain models (Product, Order, Shift, CashEntry, …)
│   │   └── use_cases/           # Only where logic is cross-repo (e.g. CheckoutUseCase: shift-open check + cart submit)
│   ├── routing/                 # go_router config + permission redirect guard
│   ├── ui/
│   │   ├── core/                # Theme (tokens mirroring web Tailwind palette), shared widgets:
│   │   │                        #   AppButton (min 44px), KpiCard, FilterSheet, AppInput, RupiahField
│   │   └── features/
│   │       ├── auth/            # login
│   │       ├── dashboard/
│   │       ├── pos/             # pos, shift, orders
│   │       ├── catalog/
│   │       ├── inventory/       # daily stock, stock & valuation
│   │       ├── finance/
│   │       ├── reports/
│   │       ├── hr/              # employees, attendance, leave
│   │       ├── notifications/
│   │       └── settings/        # profile, password
│   │       └── [feature]/{view_models,views,widgets}/
│   └── l10n/                    # app_id.arb (Bahasa Indonesia)
├── test/                        # unit + widget tests, mirrors lib/
├── integration_test/
└── .github/workflows/ci.yml
```

**Repository ↔ web-store parity rule**: each repository mirrors an existing Pinia store's responsibility (`cart.ts` → `CartRepository`, `shift.ts` → `ShiftRepository`, …). When in doubt about behavior, read the corresponding web store — it is the reference implementation of the API contract.

## 5 — API integration

- **Base URL** per flavor: `dev` → `http://localhost:8000/api/v1` (iOS sim) / `http://10.0.2.2:8000/api/v1` (Android emulator); `staging`/`prod` → deployed API URL. Configured via `--dart-define=API_BASE_URL=…`, no hardcoding.
- **Auth flow**: `POST /auth/login` → store token in secure storage → `GET /auth/me` on app start to hydrate user + `roles[]` + `permissions[]` + `business_id`. `401` anywhere → purge token, redirect to login. `403` → in-app "Akses ditolak" screen (parity with web `/403`).
- **Endpoints consumed** (all existing, from DNA §7): IAM auth/profile/password; Sales checkout/scan-plate/summary/shifts/orders; Inventory list/summary/receive/adjust/movements/min-stock + daily-stock group; Catalog products/categories; Finance CRUD + summary; HR employees/attendance/leaves; Core notifications.
- **Error contract**: one `ApiException` type mapping Laravel validation errors (`errors{}` bag) to per-field messages in Bahasa Indonesia.

## 6 — RBAC-driven navigation

Port the web's `app/config/nav.ts` pattern:

- A static `navRegistry` (label, icon, route, `permissions[]`) drives the bottom navigation bar (max 4 items + "Lainnya" sheet for the rest — mirroring web `mobileNavItems` / `mobileMoreItems`).
- Item visible iff `permissions.isEmpty || permissions.any(user.hasPermission)`.
- `go_router` redirect guard checks route-level permissions → `/403` screen.
- Every create/update/delete button wrapped in a permission check (hidden when unauthorized).

## 7 — Phased delivery

Each phase ends with: tests green in CI, copy verified Bahasa Indonesia, RBAC denial path tested with a `viewer` user, tagged release.

| Phase | Deliverable | Key work | Tag |
|---|---|---|---|
| **0 — Bootstrap** (repo + skeleton) | Running shell app | `flutter create` (org `com.berdikari`), layered folder structure, theme tokens (match web palette/typography), l10n scaffolding, `ApiClient` + `TokenStorage`, go_router shell, flavors (dev/staging/prod), GitHub Actions CI (`analyze` + `test`), README | `v0.1.0` |
| **1 — Auth + RBAC shell** | Login → permission-driven nav | Login screen, secure token persistence, `/auth/me` hydration, AuthRepository + AuthViewModel, nav registry + bottom nav, 403 screen, profile + password screens | `v0.2.0` |
| **2 — POS + Shift (core kasir flow)** | Sellable app | Product grid + category pills, cart (CartRepository), shift open/close gate before checkout, checkout → receipt, order history + status filters. Integration test: open shift → add to cart → checkout | `v0.3.0` |
| **3 — Catalog + Inventory** | Stock workflows | Product/category CRUD, daily stock opname (open/close day), stock & valuation (KPIs, receive/adjust/min-stock, movement history) | `v0.4.0` |
| **4 — Finance + Dashboard + Reports** | Money visibility | Cash flow list + filters, new entry form (RupiahField), finance summary, dashboard KPIs, reports period filter (CSV export = share/download) | `v0.5.0` |
| **5 — HR** | Team workflows | Employee CRUD, clock-in/out, attendance list, leave submit/approve/reject, quota | `v0.6.0` |
| **6 — Hardening + Release** | Store-ready v1.0 | Notifications (polling, unread badge), offline resilience (cached reads, graceful failure + retry on writes), loading/empty/error states audit, app icons/splash, signed Android App Bundle + iOS build via CI, internal testing track | `v1.0.0` |

**Phase order rationale**: mirrors the web roadmap priorities and the pilot's (Angkringan) daily loop — a kasir must be able to log in, open a shift, and sell before anything else matters.

## 8 — Versioning & Git workflow

- **Remote**: `https://github.com/virgilistian/berdikari-mobile.git` (empty — first push creates `main`).
- **Branching**: trunk-based. `main` protected; work in `feat/<area>`, `fix/<area>` branches → PR → squash-merge. No long-lived develop branch.
- **Commits**: Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`) — enables changelog generation.
- **Releases**: SemVer git tags per phase table above; `pubspec.yaml` `version:` bumped in the same PR (`x.y.z+buildNumber`).
- **CI (GitHub Actions)**: on PR → `flutter analyze`, `flutter test`; on tag → build signed artifacts (Android `.aab`; iOS build added when signing certs available). Secrets (keystore, API URLs) in GitHub Actions secrets — never committed.
- **`.gitignore`**: Flutter default + `*.keystore`, `key.properties`, `.env*`.

## 9 — Risks & mitigations

| Risk | Mitigation |
|---|---|
| API contract drift between web and mobile | Repositories mirror Pinia stores 1:1; contract smoke tests hit a seeded local API (Docker) in CI-nightly |
| Warung connectivity is unreliable | Cached last-good reads per repository; write failures queue a visible retry — full offline sync deferred past v1.0 |
| Token expiry mid-shift | Global 401 interceptor → re-login preserving in-memory cart |
| Sanctum token abilities vs. live permission changes | Re-fetch `/auth/me` on app resume; treat 403 as "permission revoked", refresh nav |
| Scope creep (Purchasing/CRM/Ticketing) | Phase gate: nothing outside §1 scope enters before `v1.0.0` |

## 10 — Definition of done (per feature)

1. ViewModel + Repository unit tests pass; widget test for the main view.
2. All copy in Bahasa Indonesia (reviewed against web equivalents).
3. Permission checks: route guard + hidden unauthorized actions + tested denial path.
4. Works at 360 dp width; touch targets ≥ 44 px.
5. Loading / empty / error states implemented (no blank screens).
6. No API contract changes required.
