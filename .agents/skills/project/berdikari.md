# Project DNA — Berdikari (mandatory; loaded before every task)

**Always read this first.** It encodes what the product is, who it is for, what exists, and the hard rules every task must respect. Never skip it; never contradict it.

---

## 1 — Product Identity

Berdikari is a **mobile-first ERP for Indonesian UMKM** (micro and small businesses). It replaces pen-and-paper workflows for non-technical users — cashiers, owners, and production teams — who have no accounting background. The primary pilot is an Angkringan (a traditional Indonesian street-food stall).

**North star**: every feature must feel as simple as using a calculator or a chat app. If a user needs training to use it, the feature is too complex.

---

## 2 — Non-Negotiables (hard constraints for every task)

1. **Language**: all UI text, labels, error messages, placeholders, and toast notifications must be in **Bahasa Indonesia**. No English-facing copy for end users.
2. **Simplicity over completeness**: prefer fewer, clearer options over feature-rich forms. Never introduce accounting jargon (debit/kredit, jurnal, ledger) — use plain words (pemasukan, pengeluaran, stok masuk, stok keluar).
3. **Mobile-first**: minimum touch target 44 × 44 px. Test every layout at 375 px width first. Desktop is secondary.
4. **Extend, never replace**: new features must sit alongside the existing pages, stores, components, and API modules — not refactor or rename them.
5. **Backward compatibility**: existing API contracts, route names, store interfaces, and migration schemas are immutable unless a bug forces a change.
6. **Multiplatform readiness**: the web app (`berdikari-web`) deploys to Cloudflare Pages (preset: `cloudflare-pages`). The API (`berdikari-api`) must stay stateless so a future mobile app can consume the same endpoints without server-side session coupling.
7. **Docker-first environment**: `docker-compose.yml` (repo root) is the **single source of truth** for service versions, ports, credentials, and environment variables. All commands (`php artisan`, `composer`, `psql`, `redis-cli`, etc.) must run **inside the relevant Docker container** via `docker compose exec <service> <command>`. Never assume or rely on host-installed versions.

---

## 3 — System Map (use INSTEAD of scanning)

| System | Path | Stack |
|---|---|---|
| API | `berdikari-api/` | Laravel 13, PHP 8.3, nwidart/laravel-modules (modular monolith) |
| Web | `berdikari-web/` | Nuxt 4, Vue 3, reka-ui, Tailwind CSS, Pinia, deployed on Cloudflare Pages |
| Docs | `docs/` | Architecture / DB / infra specs (01–14) — read only the cited file |

Infra: PostgreSQL 16, Redis 7, MinIO, Docker Compose, Kubernetes (`docs/09-infrastructure.md`, `docs/14-deployment-guide.md`).

**Docker services** (from `docker-compose.yml`):

| Service | Image | Port | URL |
|---|---|---|---|
| `nginx` | `nginx:alpine` | 80 | `http://berdikari.test` (requires `/etc/hosts` entry) |
| `api` | `php:8.3-fpm-alpine` + `composer:2` | 8000 | `http://localhost:8000` (direct, no nginx) |
| `postgres` | `postgres:16-alpine` | 5432 | — |
| `redis` | `redis:7-alpine` | 6379 | — |
| `minio` | `minio/minio:latest` | 9000 / 9001 | — |
| `mailpit` | `axllent/mailpit:latest` | 8025 / 1025 | — |

### API modules — `berdikari-api/Modules/<Name>/`

| Module | Domain | Status |
|---|---|---|
| `Core` | Tenancy (`Tenantable`), shared interfaces, utilities, in-app notifications | Active |
| `IAM` | Auth, RBAC, token generation | Active |
| `Catalog` | Products, categories, variants | Active |
| `Inventory` | Stock management, daily stock opname, stock movements, valuation | Active |
| `Sales` | POS checkout, orders, cashier shifts (open/close), payments, refunds | Active |
| `Finance` | Cash flow (pemasukan/pengeluaran), summary | Active |
| `HR` | Employee CRUD, attendance (clock-in/out), leave requests & approvals | Active |
| `Purchasing` | Purchase orders to suppliers | Planned (Phase 2) |
| `CRM` | Customer data, loyalty points | Planned (Phase 3) |
| `Production` | Angkringan production recommendation logic | Planned (Phase 1 special feature) |

**Module boundary rules** (enforced — never violate):
- No cross-module direct DB queries. `Sales` does NOT touch `Inventory` tables directly.
- Synchronous inter-module data: use **Service Contracts** (interfaces).
- Asynchronous inter-module side effects: use **Event Dispatcher**.

### Layer paths inside every module

| Layer | Path (relative to `Modules/<Name>/`) |
|---|---|
| API routes | `routes/api.php` |
| Controllers | `app/Http/Controllers/` |
| Services / Actions | `app/Services/`, `app/Actions/` |
| Models | `app/Models/` |
| Events | `app/Events/` |
| Providers | `app/Providers/` |
| Migrations | `database/migrations/` |
| Module manifest | `module.json` |

App-wide: `berdikari-api/app/`, global routes `berdikari-api/routes/`, config `berdikari-api/config/`, root migrations `berdikari-api/database/migrations/`, module registry `berdikari-api/modules_statuses.json`.

### Web layout — `berdikari-web/app/`

| Concern | Path | Notes |
|---|---|---|
| Pages | `app/pages/` | File-based routing (Nuxt) |
| Stores (Pinia) | `app/stores/` | `auth.ts` (auth + permissions), `cart.ts` (POS cart), `dailyStock.ts` (daily opname), `finance.ts`, `catalog.ts` (product CRUD), `inventory.ts` (stock valuation), `orders.ts` (sales orders), `shift.ts` (cashier shifts), `hr.ts` (employees/attendance/leave), `notifications.ts` (in-app notifications) |
| Components | `app/components/` | Shared: `FilterSheet.vue`, `PlateScanSheet.vue`, `TopNav.vue`, `EmployeeSectionTabs.vue` |
| UI primitives | `app/components/ui/` | button, card, drawer, input, radio-group (reka-ui wrappers) |
| Layouts | `app/layouts/` | `default.vue` (main nav + dynamic sidebar), `auth.vue` |
| Utils | `app/utils.ts` | Formatters/helpers |
| Composables | `app/composables/` | `useApi.ts` (typed API wrapper), `useRupiahInput.ts` (Rupiah number→display bridge), `usePageTitle.ts` (route→title map) |
| Permissions util | `app/utils/permissions.ts` | `PermissionSeeder` — canonical permission list mirroring the backend seeder. Drive permission-editing UI from here. |
| Middleware | `app/middleware/` | `auth.ts` (SSR-safe user hydration), `guest.ts`, `permission.ts` |
| Nav config | `app/config/nav.ts` | Permission-driven sidebar + mobile nav registry (`navItems`, `mobileNavItems`, `mobileMoreItems`). Icons are imported Lucide Vue component objects — not string identifiers. |
| Config | `nuxt.config.ts`, `tailwind.config.js` | `runtimeConfig.apiBaseServer` (SSR→API), `runtimeConfig.public.apiBase` (browser) |

---

## 4 — Existing pages & stores (what is built; extend these)

| Page route | File | Store used | Feature |
|---|---|---|---|
| `/` | `pages/index.vue` | — | Dashboard: KPI cards, quick action "Buka Kasir", recent transactions |
| `/welcome` | `pages/welcome.vue` | — | Public landing page (no auth required) |
| `/login` | `pages/login.vue` | — | Auth (guest-only, `guest` middleware) |
| `/403` | `pages/403.vue` | — | Access denied page (no layout) |
| `/pos` | `pages/pos/index.vue` | `cart.ts` | POS: product grid + category pills + cart sidebar + plate scan |
| `/pos/shift` | `pages/pos/shift.vue` | `shift.ts` | Manajemen Shift: open/close cashier shift, active-shift banner, summary |
| `/pos/orders` | `pages/pos/orders.vue` | `orders.ts` | Order history with status filter tabs |
| `/catalog` | `pages/catalog/index.vue` | `catalog.ts` | Product + category CRUD (create/edit/delete products and categories) |
| `/finance` | `pages/finance/index.vue` | `finance.ts` | Cash flow list with period/category filters |
| `/finance/new` | `pages/finance/new.vue` | `finance.ts` | New cash entry form |
| `/inventory` | `pages/inventory/index.vue` | `dailyStock.ts` | Daily stock opname list |
| `/inventory/new` | `pages/inventory/new.vue` | `dailyStock.ts` | Open/input new daily stock |
| `/inventory/stock` | `pages/inventory/stock.vue` | `inventory.ts` | Stock & valuation: summary KPIs, per-product list, receive/adjust/movements |
| `/reports` | `pages/reports/index.vue` | — | Laporan — period filter + CSV export (`report.view`, `report.export`) |
| `/employees` | `pages/employees/index.vue` | `hr.ts` | Employee list + CRUD (`employee.view`, `employee.create`) |
| `/employees/attendance` | `pages/employees/attendance.vue` | `hr.ts` | Absensi: self clock-in/out + admin attendance list |
| `/employees/leave` | `pages/employees/leave.vue` | `hr.ts` | Cuti & Izin: submit leave, view history, approve/reject (manager) |
| `/help` | `pages/help/index.vue` | — | Bantuan — linked from account dropdown |
| `/settings` | `pages/settings/index.vue` | `auth.ts` | Pengaturan hub → profile / password / users / roles |
| `/settings/profile` | `pages/settings/profile.vue` | `auth.ts` | Edit own name + email; calls `PUT /auth/profile` |
| `/settings/password` | `pages/settings/password.vue` | `auth.ts` | Change password with strength indicator; calls `PUT /auth/password` |
| `/users` | `pages/users/index.vue` | `auth.ts` | User CRUD table — guarded by `user.manage` |
| `/roles` | `pages/roles/index.vue` | `auth.ts` | Role cards + permission-checkbox editor — guarded by `role.assign` |

**UI patterns already established** — always match these:
- Page header: date in `text-small text-muted-foreground`, title in `text-h1 text-foreground`.
- KPI cards: `bg-surface rounded-xl border border-border p-4 shadow-elevation-1`.
- Primary CTA button: `bg-primary text-primary-foreground px-4 py-2 rounded-lg min-h-[44px]`.
- Filter chips: `FilterSheet.vue` component — reuse it, do not create a new filter pattern.
- Input: use `app/components/ui/input/` primitive.
- All text labels and copy in Bahasa Indonesia.

---

## 5 — Core business workflows (understand before touching related code)

### 5a — POS (Kasir) flow
1. Kasir opens `/pos` → browses product grid filtered by category pills.
2. Taps product → added to cart (`cart.ts`: `addToCart`).
3. Adjusts quantity in cart panel.
4. Taps "Bayar" → order submitted to `Sales` module API → stock deducted via event.
5. Cart cleared; receipt shown.

### 5b — Cashier Shift (Shift Kasir) flow
1. Kasir opens `/pos/shift` → taps "Buka Shift" → inputs opening cash (`shift.ts`: `openShift`).
2. `activeShift` is set; the POS page requires an open shift before checkout.
3. During the day: orders accumulate in `transaction_count` and `total_sales`.
4. End of day: kasir opens `/pos/shift` → inputs closing cash + optional note → taps "Tutup Shift" (`shift.ts`: `closeShift`).
5. Summary (expected cash, difference) shown after closing.

### 5c — Daily Stock Opname (Stok Harian) flow
1. Morning: production team opens `/inventory/new` → inputs `opening_qty` for each product (`dailyStock.ts`: `openDay`).
2. During the day: sales events auto-update `sold_qty`.
3. End of day: closes daily stock → system calculates `closing_qty = opening_qty - sold_qty`.
4. System generates production recommendation for next day (Production module).
5. Store methods: `fetchToday`, `openDay`, `closeDay`.

### 5d — Stock & Valuation (Stok & Valuasi) flow
1. Manager/inventory-staff opens `/inventory/stock` → sees KPI cards (total products, stock value, retail value, low-stock count).
2. Can receive stock (`inventory.ts`: `receive`), adjust quantity (`adjust`), set minimum stock (`setMinStock`).
3. Taps a product row → views stock movement history (`fetchMovements`).

### 5e — Finance (Keuangan) flow
1. Owner/kasir opens `/finance` → sees pemasukan/pengeluaran list with period and category filters.
2. Taps "Tambah Baru" → `/finance/new` → selects type (pemasukan/pengeluaran), amount, category, note.
3. Entry saved to `Finance` module API.

### 5f — HR (Karyawan) flow
1. Manager opens `/employees` → views/creates/edits employees (`hr.ts`: `fetchEmployees`, `createEmployee`, `updateEmployee`).
2. Employee opens `/employees/attendance` → clock-in at start of day (`clockIn`), clock-out when done (`clockOut`).
3. Manager can view all attendance records with filters.
4. Employee opens `/employees/leave` → submits cuti/izin (`submitLeave`). Manager approves or rejects (`decideLeave`).
5. Leave quota (`myQuota`) tracks annual/sick/other days used vs. remaining.

### 5g — Multi-business / Multi-branch tenancy
- Every API request scopes data to a `business_id` (and optionally `branch_id`) via the `Core` module's `Tenantable` trait.
- IAM is fully wired. The `auth.ts` store holds the authenticated user's `business_id`, `roles[]`, and `permissions[]` (returned by `POST /auth/login` and `GET /auth/me`). The `SetPermissionsTeamId` middleware sets the spatie team context on every request.
- The web stores (`cart.ts`, `dailyStock.ts`, `finance.ts`, `inventory.ts`, `orders.ts`) should read `auth.user.business_id` from the `auth.ts` store — not a hardcoded constant.

---

## 6 — Priority module roadmap (what to build next, in order)

| Priority | Module / Feature | Status | Target path |
|---|---|---|---|
| 1 | **Finance** (summary + laporan laba rugi) | In progress | `pages/finance/`, `Finance` module |
| 2 | **POS** (production recommendation) | In progress | `pages/pos/`, `Sales` + `Production` modules |
| 3 | **Product Catalog** (variants + pricing tiers) | In progress | `pages/catalog/`, `Catalog` module |
| 4 | **Dashboard** (real KPIs wired to API) | In progress | `pages/index.vue` |
| 5 | **IAM / User Access Management** | **Complete** | `pages/users/`, `pages/roles/`, `pages/settings/`, `Modules/IAM/` — full CRUD, RBAC, profile, password change, SSR-safe auth |
| 6 | **POS Shift Management** | **Complete** | `pages/pos/shift.vue`, `stores/shift.ts`, `Modules/Sales/` shifts routes |
| 7 | **Stock & Valuation** | **Complete** | `pages/inventory/stock.vue`, `stores/inventory.ts`, `Modules/Inventory/` full routes |
| 8 | **Employee Management + Attendance + Leave** | **Complete** | `pages/employees/`, `stores/hr.ts`, `Modules/HR/` — employee CRUD, clock-in/out, leave requests/approvals |
| 9 | **Laporan (Reports)** | In progress (export wired) | `pages/reports/index.vue` — period filter + CSV export; deeper Finance + Sales aggregations pending |
| 10 | **In-app Notifications** | In progress | `stores/notifications.ts`, `Modules/Core/` notifications routes — polling implemented; push/SSE pending |
| 11 | **Online Swimming Pool Ticketing** | Not started | New: `pages/tiket-kolam/`, new `Ticketing` module |

When adding new modules: follow the same nwidart module structure, add a new page under `berdikari-web/app/pages/`, add a Pinia store under `app/stores/`, and use the existing UI primitives. Do not create new design patterns without checking what already exists first.

---

## 7 — Fast jumps (skip scanning)

- **An API endpoint** → grep the URI in `Modules/*/routes/api.php` → its Controller in that module.
- **A Vue page bug** → `berdikari-web/app/pages/<area>/` → its store in `app/stores/`.
- **A data/field question** → `docs/04-database-design.md` first, then `Modules/<Name>/database/migrations/`.
- **An event/side-effect** → `Modules/<Name>/app/Events/` + `docs/07-event-design.md`.
- **Which module owns the task?** → product/price → Catalog; stock/stok → Inventory; order/kasir/POS/shift → Sales; user/role/login/token → IAM; business/branch/tenant/notification → Core; kas/keuangan → Finance; karyawan/absensi/cuti → HR; tiket/kolam → Ticketing (new).
- **IAM API routes** → `Modules/IAM/routes/api.php`; public: `POST /api/v1/auth/login`; protected (auth:sanctum + permission.team): `GET /api/v1/auth/me`, `PUT /api/v1/auth/profile`, `PUT /api/v1/auth/password`, `POST /api/v1/auth/logout`, `apiResource users` (requires `user.manage`), `GET /api/v1/roles`, `PUT /api/v1/roles/{id}/permissions`, `POST /api/v1/users/{id}/roles`, `DELETE /api/v1/users/{id}/roles/{role}`.
- **IAM frontend auth flow** → `app/stores/auth.ts` (token cookie, `login`, `logout`, `fetchUser`, `updateProfile`, `changePassword`, `hasPermission`, `hasRole`); middleware: `auth.ts` (SSR+client hydration), `guest.ts`, `permission.ts`.
- **Sales API routes** → `Modules/Sales/routes/api.php` (prefix `v1/sales`): `POST /checkout`, `POST /scan-plate`, `GET /summary`; shifts: `GET /shifts/active`, `GET /shifts`, `POST /shifts/open`, `GET /shifts/{id}`, `POST /shifts/{id}/close`; orders: `GET /orders`, `POST /orders`, `GET /orders/{id}`, `POST /orders/{id}/complete`, `POST /orders/{id}/payments`, `POST /orders/{id}/cancel`, `POST /orders/{id}/refund`.
- **Inventory API routes** → `Modules/Inventory/routes/api.php` (prefix `v1/inventory`): `GET /` (list), `GET /summary`, `GET /low-stock`, `POST /receive`, `POST /adjust`, `GET /{id}`, `GET /{id}/movements`, `PUT /{id}/min-stock`; daily-stock sub-group: `GET /daily-stock/products`, `GET /daily-stock/{date}`, `POST /daily-stock/open`, `POST /daily-stock/close`, `POST /daily-stock/adjust`.
- **HR API routes** → `Modules/HR/routes/api.php` (prefix `v1/hr`): employees: `GET /employees`, `POST /employees`, `GET /employees/{id}`, `PUT /employees/{id}`, `GET /summary`, `GET /employees/{id}/quota`; attendance: `GET /attendance`, `GET /attendance/me`, `POST /attendance/clock-in`, `POST /attendance/clock-out`; leaves: `GET /leaves`, `GET /leaves/mine`, `GET /leaves/quota`, `POST /leaves`, `POST /leaves/{id}/approve`, `POST /leaves/{id}/reject`.
- **Catalog API routes** → `Modules/Catalog/routes/api.php` (prefix `v1/catalog`): `apiResource categories`, `apiResource products`.
- **Finance API routes** → `Modules/Finance/routes/api.php` (prefix `v1/finance`): `GET /`, `POST /`, `GET /summary`, `GET /{id}`, `DELETE /{id}`.
- **Core/Notifications API routes** → `Modules/Core/routes/api.php` (prefix `v1`): `GET /notifications`, `GET /notifications/unread-count`, `POST /notifications/mark-all-read`, `POST /notifications/{id}/read`.
- **Feature tests** → `berdikari-api/tests/Feature/` — subdirs: `IAM/`, `Finance/`, `HR/`, `Inventory/`, `Sales/`, `Catalog/`; run with `docker exec -e DB_CONNECTION=sqlite -e DB_DATABASE=:memory: -e DB_HOST= -e DB_URL= berdikari-api-1 php artisan test`. **Never run without those env flags** — container defaults to dev postgres and `RefreshDatabase` will wipe it.

---

## 8 — Before implementing any task: read this checklist

1. **Does the task touch an existing page?** → Read that page file and its store before writing a single line.
2. **Does the task add a new API endpoint?** → Check `docs/06-api-specification.md` for the contract first.
3. **Does the task touch state?** → Identify the owning Pinia store; extend it — do not create a parallel store.
4. **Does the task add a new UI element?** → Check `app/components/ui/` and `app/components/` for an existing primitive to reuse.
5. **Does the task require a new backend module?** → Scaffold with nwidart (`php artisan module:make <Name>`), then follow the layer paths in §3.
6. **Is all copy in Bahasa Indonesia?** → Verify before marking done.

---

## 9 — Role-Based Access Control (RBAC) — Authorization Standard

**Every new feature must integrate with this standard from day one.** This section is the single source of truth for authorization architecture across `IAM` module (API) and `berdikari-web` (frontend). Never bypass it; never create a parallel permission system.

---

### 9a — Authorization Architecture Overview

Berdikari uses a **database-driven RBAC** model implemented in the `IAM` module. The system is:
- **Multi-tenant aware** — permissions are scoped per `business_id`; a user may have different roles in different businesses.
- **Deny-by-default** — access is denied unless an explicit permission is granted.
- **Least-privilege** — roles are granted only the minimum permissions required for their function.
- **Menu-driven** — the sidebar and navigation are dynamically generated from the user's resolved permission set; no hard-coded nav items.

Stack: `spatie/laravel-permission` (Laravel side) + Pinia `auth.ts` store (frontend).

---

### 9b — Default Roles & Scope

| Role | Bahasa Label | Scope | Description |
|---|---|---|---|
| `super-admin` | Super Admin | System-wide | Full access to everything; can manage all businesses and tenants. Reserved for platform operators. |
| `business-owner` | Pemilik Usaha | Business-wide | Full access within their own business(es); can assign roles to others. |
| `manager` | Manajer | Business-wide | Operational access: can view reports, manage employees, and approve transactions. |
| `supervisor` | Supervisor | Branch-wide | Supervises daily operations; approves stock opname and shift closings. |
| `cashier` | Kasir | Branch/Shift | POS access only: open/close shift, process orders, view own shift summary. |
| `kitchen-staff` | Staf Dapur | Branch | Production/inventory input only; no financial access. |
| `inventory-staff` | Staf Inventori | Branch | Stock opname, stock movements, supplier receiving; no sales or finance access. |
| `finance` | Keuangan | Business-wide | Full finance module access; read-only access to sales and inventory reports. |
| `employee` | Karyawan | Branch | General employee; attendance and personal profile only. |
| `viewer` | Peninjau / Auditor | Business-wide | Read-only access to all data within the business; cannot create, update, or delete anything. |

**Rules:**
- A user may hold **multiple roles** within a business (e.g., `cashier` + `inventory-staff`).
- Roles are stored in the `IAM` module (`roles` and `model_has_roles` tables, scoped by `team_id = business_id`).
- `super-admin` bypasses all permission checks via `spatie/laravel-permission`'s `Super Admin` gate bypass — handle with care.

---

### 9c — Permission Naming Convention

All permissions follow the pattern: **`resource.action`**

```
<resource>.<action>
```

**Resource** = snake_case module domain (e.g., `pos`, `finance`, `inventory`, `catalog`, `employee`, `report`, `role`, `user`, `business`).

**Action** = one of: `view`, `create`, `update`, `delete`, `export`, `approve`, `close`, `open`.

**Examples:**

| Permission | Who can hold it | Description |
|---|---|---|
| `pos.open` | cashier, supervisor, manager | Open a kasir shift |
| `pos.close` | cashier, supervisor, manager | Close a kasir shift |
| `pos.view` | cashier, supervisor, manager, finance, viewer | View POS/order data |
| `finance.view` | finance, manager, business-owner, viewer | View cash flow |
| `finance.create` | finance, manager, business-owner | Add pemasukan/pengeluaran |
| `finance.delete` | finance, business-owner | Delete finance entries |
| `finance.export` | finance, manager, business-owner | Export laporan keuangan |
| `inventory.view` | inventory-staff, supervisor, manager, viewer | View stock data |
| `inventory.create` | inventory-staff, supervisor | Open daily stock opname |
| `inventory.approve` | supervisor, manager | Approve stock opname |
| `catalog.view` | all roles | View product catalog |
| `catalog.create` | manager, business-owner | Add products |
| `catalog.update` | manager, business-owner | Edit products/prices |
| `catalog.delete` | business-owner | Delete products |
| `employee.view` | manager, supervisor, viewer | View employee list |
| `employee.create` | manager, business-owner | Add employees |
| `employee.update` | manager, business-owner | Edit employee data |
| `attendance.view` | manager, supervisor, viewer | View attendance records |
| `attendance.create` | all roles (self clock-in/out) | Clock in / clock out |
| `leave.view` | manager, supervisor, viewer | View leave requests |
| `leave.create` | all roles (own leave requests) | Submit cuti/izin |
| `leave.approve` | manager, supervisor | Approve or reject leave requests |
| `report.view` | finance, manager, business-owner, viewer | View business reports |
| `report.export` | finance, manager, business-owner | Export laporan CSV |
| `notification.view` | all authenticated users | View in-app notifications |
| `role.assign` | manager, business-owner | Assign roles to users |
| `user.manage` | business-owner | Manage user accounts |
| `business.manage` | business-owner, super-admin | Manage business settings |

**Adding a new permission**: define it as a seeder in `IAM/database/seeders/PermissionSeeder.php`. Never hardcode permission strings outside of that seeder and the policy/gate that checks them.

---

### 9d — Backend API Authorization

**Location**: `berdikari-api/Modules/IAM/` and per-module Policies.

#### Middleware
Apply auth + permission middleware on all protected routes:

```php
// Modules/<Name>/routes/api.php
Route::middleware(['auth:sanctum', 'verified.business'])->group(function () {
    Route::get('/finance', [FinanceController::class, 'index'])
        ->middleware('can:finance.view');

    Route::post('/finance', [FinanceController::class, 'store'])
        ->middleware('can:finance.create');
});
```

#### Policy pattern (preferred for resource controllers)
Each module's model should have a corresponding Policy registered in its `AuthServiceProvider`:

```php
// Modules/Finance/app/Policies/FinanceEntryPolicy.php
public function viewAny(User $user): bool
{
    return $user->hasPermissionTo('finance.view');
}
public function create(User $user): bool
{
    return $user->hasPermissionTo('finance.create');
}
```

#### Controller authorization
Always call `$this->authorize()` or `Gate::authorize()` at the top of each controller action — never check permissions in business logic layers (Services/Actions).

```php
public function store(Request $request): JsonResponse
{
    $this->authorize('create', FinanceEntry::class);
    // ... proceed
}
```

#### Tenant scoping
All permission checks must be tenant-scoped. When calling `hasPermissionTo()`, the `spatie/laravel-permission` `team_id` (= `business_id`) must be set via:

```php
setPermissionsTeamId($user->current_business_id);
```

This is handled automatically by the `SetPermissionsTeamId` middleware in the `IAM` module. Never bypass it.

---

### 9e — Frontend Route Guards

**Location**: `berdikari-web/app/middleware/` and `app/stores/auth.ts`.

#### Auth store permission helper
The `auth.ts` Pinia store must expose:
```ts
// app/stores/auth.ts
const hasPermission = (permission: string): boolean =>
  authStore.user?.permissions?.includes(permission) ?? false

const hasAnyPermission = (permissions: string[]): boolean =>
  permissions.some(p => hasPermission(p))

const hasRole = (role: string): boolean =>
  authStore.user?.roles?.includes(role) ?? false
```

The API login/me endpoint returns `permissions[]` and `roles[]` for the authenticated user scoped to their active `business_id`.

#### Nuxt route middleware
Create a reusable `permission` middleware:

```ts
// app/middleware/permission.ts
export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()
  const required = to.meta.permissions as string[] | undefined

  if (!required || required.length === 0) return

  const allowed = required.some(p => auth.hasPermission(p))
  if (!allowed) {
    return navigateTo('/403')
  }
})
```

Apply it in page `definePageMeta`:

```ts
// pages/finance/index.vue
definePageMeta({
  middleware: ['auth', 'permission'],
  permissions: ['finance.view'],
})
```

#### Permission-aware UI elements
Hide (not just disable) unauthorized actions:

```vue
<!-- Good: conditionally render, not just disable -->
<Button v-if="auth.hasPermission('finance.create')" @click="openForm">
  Tambah Baru
</Button>
```

Never show disabled-only buttons for actions the user cannot take — it creates confusion for non-technical users.

---

### 9f — Dynamic Sidebar Generation

The sidebar (main navigation) must be **generated dynamically** from the user's resolved permission set. No nav item is hardcoded.

**Architecture:**

```ts
// app/config/nav.ts  (static nav registry — permissions drive visibility)
export const navItems = [
  {
    label: 'Dashboard',
    icon: 'i-lucide-layout-dashboard',
    to: '/',
    permissions: [], // always visible to authenticated users
  },
  {
    label: 'Kasir (POS)',
    icon: 'i-lucide-shopping-cart',
    to: '/pos',
    permissions: ['pos.open', 'pos.view'],
  },
  {
    label: 'Keuangan',
    icon: 'i-lucide-wallet',
    to: '/finance',
    permissions: ['finance.view'],
  },
  {
    label: 'Inventori',
    icon: 'i-lucide-package',
    to: '/inventory',
    permissions: ['inventory.view'],
  },
  {
    label: 'Katalog Produk',
    icon: 'i-lucide-tag',
    to: '/catalog',
    permissions: ['catalog.view'],
  },
  {
    label: 'Laporan',
    icon: 'i-lucide-bar-chart-2',
    to: '/reports',
    permissions: ['report.view'],
  },
  {
    label: 'Karyawan',
    icon: 'i-lucide-users',
    to: '/employees',
    permissions: ['employee.view'],
  },
  {
    label: 'Pengaturan',
    icon: 'i-lucide-settings',
    to: '/settings',
    permissions: ['business.manage', 'user.manage', 'role.assign'],
  },
]
```

**Computed visible nav** (in `app/layouts/default.vue` or a `useNav` composable):

```ts
const visibleNav = computed(() =>
  navItems.filter(item =>
    item.permissions.length === 0 ||
    item.permissions.some(p => auth.hasPermission(p))
  )
)
```

**Rules:**
- A nav item is visible if the user has **at least one** of its listed permissions.
- An empty `permissions: []` means "always show to any authenticated user."
- When adding a new page, add its nav entry to `nav.ts` — never add it directly to the layout template.

---

### 9g — Multi-Business / Multi-Tenant Compatibility

- Permissions are always resolved for the user's **active business** (`auth.activeBusiness.id`).
- When a user switches business (if they own multiple), the frontend must **re-fetch** the user's permission set for the new context and re-render the sidebar.
- The API returns `permissions` and `roles` scoped to the `business_id` passed in the request context (via `X-Business-ID` header or resolved from the auth token).
- Never cache permissions across business switches.

---

### 9h — Security Best Practices

1. **Deny-by-default**: if a permission check is missing or inconclusive, access is denied. The default stance is always "no access."
2. **Least-privilege**: new roles are created with zero permissions. Permissions are added explicitly via seeders or admin UI — never via a "copy all" shortcut.
3. **Double enforcement**: both the API (gate/policy) and the frontend (route guard + UI visibility) must enforce permissions independently. Frontend guards are UX only; the API is the authoritative enforcement layer.
4. **No permission escalation**: a user cannot assign a role that has permissions they themselves do not hold. The `role.assign` permission check must compare the assigner's permission superset against the target role's permissions.
5. **Wildcard permissions are banned**: never define `*.view`, `finance.*`, or similar wildcards. Every permission is explicit.
6. **Super Admin lockdown**: `super-admin` role assignment is restricted to platform-level seeders only — never exposed in the business admin UI.
7. **API tokens scope**: Sanctum tokens issued for the mobile app must carry a `abilities` array matching the user's permissions at issuance time. Token abilities are never elevated after issuance.

---

### 9i — Audit Logging for Authorization Changes

All of the following events must be written to the `audit_logs` table (Core module) with `actor_id`, `business_id`, `action`, `target_type`, `target_id`, `old_value`, `new_value`, and `ip_address`:

| Event | Action string |
|---|---|
| Role assigned to user | `role.assigned` |
| Role removed from user | `role.removed` |
| Permission added to role | `permission.added` |
| Permission removed from role | `permission.removed` |
| User created | `user.created` |
| User suspended/deactivated | `user.suspended` |
| Business owner transferred | `business.owner_transferred` |
| Login success | `auth.login` |
| Login failure | `auth.login_failed` |
| Token revoked | `auth.token_revoked` |

Use the `Core` module's `AuditLogger` service — never write directly to the `audit_logs` table from a controller:

```php
// In IAM event listeners or Observers
AuditLogger::log('role.assigned', $user, ['role' => $role->name]);
```

---

### 9j — Implementation Guidelines for New Features

When building any new feature, follow this RBAC integration checklist:

1. **Define permissions first** → add new `resource.action` strings to `IAM/database/seeders/PermissionSeeder.php` before writing any controller.
2. **Assign permissions to default roles** → update `IAM/database/seeders/RolePermissionSeeder.php` to map permissions to the appropriate roles.
3. **Add API authorization** → apply `can:<permission>` middleware on all new routes OR add a Policy for the new model and call `$this->authorize()` in the controller.
4. **Add frontend route guard** → set `permissions: [...]` in `definePageMeta` for all new pages.
5. **Register in nav config** → add nav entry to `app/config/nav.ts` with the correct `permissions` array.
6. **Gate UI elements** → wrap any create/edit/delete button with `v-if="auth.hasPermission('resource.action')"`.
7. **Log authorization-relevant actions** → if the feature involves role/permission changes, call `AuditLogger::log(...)`.
8. **Test denial path** → verify that a `viewer` role user receives `403 Forbidden` from the API and sees no unauthorized UI elements.

**Never ship a feature without completing all 8 steps above.** Incomplete RBAC integration is treated as a critical bug.
