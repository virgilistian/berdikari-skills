# 17 — berdikari-api enhancements for offline-first sync (task list)

**Status**: Proposed — not started. Companion to [16-mobile-implementation-plan.md](16-mobile-implementation-plan.md) and the mobile offline-first architecture already shipped in `berdikari-mobile` (local-first Catalog/Finance/Dashboard repositories, `AppDatabase`, `SyncManager` — see `berdikari-mobile/lib/data/local/`).

## 1 — Why

The mobile app's offline-first layer currently syncs by **full-collection diffing**: every background sync re-downloads the entire product/category/finance list and upserts by id, because `berdikari-api` has no `since`/cursor filtering and no real pagination — list endpoints return a flat, capped collection (`GET /finance` caps at 200 rows, `GET /sales/orders` at 100, `GET /catalog/products` is unbounded). This was a deliberate v1 trade-off (see the conversation that shipped the mobile work): ship the mobile architecture **mobile-only**, accept the limitation, and document the backend work as a follow-up. This is that follow-up.

Two concrete problems this causes today:

1. **Incomplete sync for busy businesses.** A business with more than 200 Finance entries or 100 Sales orders never gets the older rows onto the device — the hard `limit()` silently drops them. This is a pre-existing bug independent of offline-first, but offline-first makes it more visible (the local cache becomes the thing users actually look at).
2. **No bandwidth-incremental sync.** Every sync pass re-downloads everything within the cap, even when nothing changed. Fine at today's pilot scale (Angkringan, single business), not fine once multiple businesses/branches with real transaction volume are on the app.

There's also a smaller, separate gap: **write idempotency**. `POST /sales/orders` already dedupes by `client_uuid` (`SaleOrderController::store` validates `client_uuid` as `nullable|uuid` and `SalesService::createOrder` looks up an existing order by `business_id` + `client_uuid` before creating — `Modules/Sales/app/Services/SalesService.php:47-57`). Finance, Catalog, and Inventory writes have no equivalent, so the mobile outbox can't safely auto-retry a write that fails with an ambiguous network timeout (request may have already reached the server) — it currently requires a manual retry tap in that case instead.

## 2 — Non-negotiables (per Project DNA §2 and CLAUDE.md)

- **Additive only.** Every change below must be backward compatible: existing `berdikari-web` and any current mobile behavior must work unchanged when new query params/fields are omitted. No route renames, no response shape breaks, no removed fields.
- **No cross-module violations.** Stay inside each module's existing boundaries (`Catalog`, `Finance`, `Sales`, `Inventory`) — no new direct cross-module queries.
- **Tenant scoping unchanged.** Every new query param still resolves against the existing `Tenantable` / `business_id` scoping — never bypass it.
- **Bahasa Indonesia** for any new user-facing validation/error messages.

## 3 — Task 1: incremental sync (`?since=` cursor)

Add an optional `since` query param (ISO 8601 datetime) to each list endpoint below. When present, filter to rows where `updated_at >= since` (using `>=`, not `>`, and having the client de-dupe by id — the standard "overlap window" pattern — avoids missing a row updated in the same second a previous sync ran). When absent, behavior is unchanged (full list, subject to existing caps until Task 2 lands).

| Module | Endpoint | Controller | Notes |
|---|---|---|---|
| Catalog | `GET /catalog/products` | `Modules/Catalog/app/Http/Controllers/ProductController.php` (`index`, existing filters: `category_id`, `search`, `active_only`) | Add `since` alongside existing filters |
| Catalog | `GET /catalog/categories` | `Modules/Catalog/app/Http/Controllers/CategoryController.php` (`index`, currently no filters) | Add `since` |
| Finance | `GET /finance` | `Modules/Finance/app/Http/Controllers/FinanceController.php` (`index`, existing filters: `type`, `category`, `from`/`to`, `business_id`, `source_type`, `source_id`) | `since` is independent of the existing `from`/`to` **date** range filter (that's a business-date filter for the UI; `since` is a sync cursor on `updated_at`) |
| Sales | `GET /sales/orders` | `Modules/Sales/app/Services/SalesService.php` (`listOrders`, called from `SaleOrderController::index`) | Add `since` |
| Inventory | `GET /inventory`, `GET /inventory/daily-stock/history` | `Modules/Inventory/app/Http/Controllers/InventoryController.php` | Out of scope for the current mobile app (Inventory isn't in the shipped offline-first slice) — include only if/when Inventory gets a local-first mobile repository |

**Acceptance criteria**: each endpoint accepts `?since=<ISO8601>`; response is unchanged when omitted; a feature test seeds two rows at different `updated_at` timestamps and asserts `?since=<between>` returns only the newer one.

## 4 — Task 2: replace hard caps with real pagination

Replace `->limit(200)` (`FinanceController.php:71`) and `->limit(100)` (`SalesService.php:229`) with Laravel's standard `->paginate()` / cursor pagination, and add the same to Catalog's currently-unbounded `products`/`categories` queries. Response envelope becomes `{data: [...], meta: {...}, links: {...}}` — **additive**: keep `data` as the top-level key clients already read (`response['data']` in every mobile service today), just also include `meta`/`links`. Existing callers that only read `data` are unaffected.

Recommend **cursor pagination** (`cursorPaginate()`) over offset/page pagination — stable under concurrent inserts, which matters once `since`-based sync and pagination combine (a business backfilling 500+ historical Finance entries via `since=1970-01-01` should get consistent pages even if new entries are being written concurrently).

**Acceptance criteria**: default page size documented per endpoint (suggest 200 for Finance/Sales, matching today's cap as the new default so nothing regresses); `per_page` override capped at a sane max (e.g. 500) to prevent abuse; existing tests that assert on today's uncapped/200/100-row behavior updated to account for pagination metadata.

## 5 — Task 3: `client_uuid` idempotency on Finance/Catalog/Inventory writes

Mirror the pattern already proven in `Modules/Sales/app/Services/SalesService.php:47-57`: accept an optional `client_uuid` (`nullable|uuid`) on:

- `POST /finance` (`FinanceController::store`)
- `POST /catalog/products`, `PUT /catalog/products/{id}` (`ProductController`)
- `POST /catalog/categories` (`CategoryController`)
- `POST /inventory/receive`, `POST /inventory/adjust` (`InventoryController`) — if/when Inventory joins the offline-first slice

Server behavior: if `client_uuid` is present and a row already exists for that `business_id` + `client_uuid`, return the existing row instead of creating a duplicate (same as `SalesService::createOrder`). Requires a new nullable, indexed `client_uuid` column per target table (migration per module).

**Acceptance criteria**: a feature test posts the same payload + `client_uuid` twice and asserts exactly one row is created, the second response returning the first row unchanged; omitting `client_uuid` preserves today's behavior exactly.

**Once this lands**, `berdikari-mobile`'s `CatalogRepository`/`FinanceRepository` outbox can safely auto-retry ambiguous network failures instead of requiring a manual retry tap (see the "Failed" state in `SyncStatusIndicator`) — that's a mobile-side follow-up, not part of this task.

## 6 — Task 4 (lower priority): deletion detection

`FinanceEntry` already has `SoftDeletes` (`Modules/Finance/app/Models/FinanceEntry.php`, migration `2026_07_16_000001_add_soft_deletes_to_finance_entries_table.php`) — `since`-based sync (Task 1) should include soft-deleted rows via `withTrashed()` + a `deleted_at` field in the payload so the client can remove them locally, instead of relying on full-collection diffing to infer deletions.

`Product`, `Category`, and `SaleOrder` have **no** soft deletes today (Catalog hard-deletes; Sales uses status transitions like `cancelled`/`refunded` instead of deletion). Two options, pick per product judgment rather than defaulting to "add soft deletes everywhere":
- Add `SoftDeletes` to `Product`/`Category` (Catalog) — enables the same tombstone pattern as Finance. Low risk, no existing behavior depends on hard delete.
- Leave Sales alone — orders are never actually deleted, so there's no deletion-detection gap there.

**Acceptance criteria**: deferred until this is prioritized — write acceptance criteria at that point based on the chosen approach.

## 7 — Suggested order

1. Task 3 (idempotency) — smallest, most isolated, unblocks safer mobile retry behavior immediately.
2. Task 1 (`since` cursor) — additive, no schema changes, immediately reduces sync payload size.
3. Task 2 (pagination) — larger surface (response shape, existing tests), do after 1 to avoid re-touching the same controllers twice.
4. Task 4 (deletion detection) — only when a concrete product need shows up (e.g. a business actually deletes products regularly).

## 8 — Out of scope

- Any change to `berdikari-web` — it doesn't use these params and isn't affected by their addition.
- Rewriting the mobile sync engine — this doc only covers what the API needs to expose; consuming `since`/pagination/`client_uuid` from `berdikari-mobile` is separate follow-up work once each task lands.
- Extending offline-first to Inventory/HR modules — not requested, not started; mentioned above only where a task would need to cover them if that happens later.
