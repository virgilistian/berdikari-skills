# Skill: Laravel 13 — Berdikari API (nwidart modular monolith)

Load when: touching `berdikari-api/**`. Assumes `core/*` already loaded.

## Stack versions (locked)
- **Laravel** 13.8 · **PHP** 8.3 · **nwidart/laravel-modules** 13.0
- **Composer** 2 (image: `composer:2`)
- **anthropic-ai/sdk** 0.7 (AI features)
- Dev: PHPUnit 12, Pint, Mockery, Collision, Pail

## Docker runtime (mandatory — never use host machine)
All PHP, Composer, and Artisan commands run **inside the `api` container**. Never run `php`, `composer`, or `php artisan` directly on the host.

```bash
# Start the full stack
docker compose up -d

# Run any artisan command
docker compose exec api php artisan <command>

# Run composer
docker compose exec api composer <command>

# Open a shell in the API container
docker compose exec api sh
```

Service name: `api` · Image: `php:8.3-fpm-alpine` · Port: `8000` (direct) or via nginx at `http://berdikari.test` · See `docker-compose.yml` for all env vars.

## Module registry (never scan — use this table)

| Module | Controllers | Models | Services | Events/Listeners | Notes |
|---|---|---|---|---|---|
| `IAM` | `IAMController`, `AuthController`, `UserController` | — | — | — | Auth, users, permissions |
| `Catalog` | `CatalogController`, `CategoryController`, `ProductController` | ✓ | — | — | Products & categories |
| `Inventory` | — | ✓ | ✓ | Listeners/ | Stock management |
| `Sales` | `PlateScanController`, `SalesController` | ✓ | ✓ | Events/ | POS, transactions |
| `Core` | — | — | — | — | Cross-module contracts, shared interfaces |

## Module filesystem layout
```
Modules/<Name>/
  routes/api.php          # URI → controller method
  app/Http/Controllers/   # thin; delegate to Services
  app/Services/           # business logic (Sales, Inventory have these)
  app/Models/             # Eloquent (Catalog, Sales, Inventory)
  app/Events/             # Sales fires events here
  app/Listeners/          # Inventory listens here
  app/Providers/          # ServiceProvider — bindings, observers, macros
  database/migrations/    # module-scoped schema changes
  tests/                  # Feature + Unit per module
```

## Layer trace for any request (follow strictly)
1. **Route** — `php artisan route:list --path=<uri>` OR grep `Modules/*/routes/api.php`.
2. **Controller** — find the method; note middleware chain (auth/tenant guard matters first).
3. **Service** — constructor-injected; read the invoked method only.
4. **Model** — Eloquent relations; confirm column truth in `database/migrations/` not the model fillable.
5. **Events** — if `Sales` dispatches, check `Inventory`'s Listeners for side-effects.
6. **Docs cross-check** — `docs/04-database-design.md` (schema intent), `docs/07-event-design.md` (event contract).

## High-value evidence (cheap, run first)
```bash
# Real handler for a URI (always exec into the container)
docker compose exec api php artisan route:list --path=<uri> --columns=method,uri,name,action

# Which modules are enabled (host-readable file, no container needed)
cat berdikari-api/modules_statuses.json

# Module list with status
docker compose exec api php artisan module:list
```

## Writing code — conventions
- **Controllers** are thin: validate input, call one Service method, return a JSON Resource.
- **Services** are injectable classes; use constructor DI. No static methods.
- **Eloquent** — define `$fillable` + `$casts`. Use API Resources (`docker compose exec api php artisan make:resource`) not raw `->toArray()`.
- **Migrations** — use `Schema::table()` for alters. Always add `->comment()` on ambiguous columns.
- **Events** — follow existing `Sales/Events/` shape; Listeners go in `Inventory/Listeners/`.
- **Artisan make** commands scoped to module: `docker compose exec api php artisan module:make-controller <Name> <Module>`.

## Post-edit PHP hygiene (mandatory after every controller write/edit)

After writing or editing **any** PHP class, run both checks before declaring done:

```bash
# 1. Syntax-check the file (catches parse errors immediately)
docker compose exec api php -l Modules/<Name>/app/Http/Controllers/<File>.php

# 2. Confirm routes load (a ParseError in any class blocks ALL routes)
docker compose exec api php artisan route:list --path=<related-prefix> 2>&1 | head -5
```

**Known failure pattern — "Unmatched '}'":** Occurs when an LLM or editor appends a duplicate method body (or partial copy of `scan`/`checkout`/`show` etc.) after the class-closing `}`. The PHP parser sees top-level `}` with no matching opener and reports the first orphaned `}` as unmatched. Fix: delete every line that appears after the final class-closing `}`. Check this whenever `ParseError: Unmatched '}'` is reported on the last method of a controller.
- **API Resources**: `docker compose exec api php artisan make:resource <Name>`.
- **nwidart v13** — config lives in `Modules/<Name>/module.json`; autoload via `composer.json` merge-plugin.

## Generating a new module feature (checklist)
1. Identify the owning module from the table above — never create a new module unless explicitly required.
2. Add migration → run `docker compose exec api php artisan migrate`.
3. Update/create Model with `$fillable`, `$casts`, relations.
4. Add Service method.
5. Add Controller method → add route to `routes/api.php`.
6. Write Feature test in `Modules/<Name>/tests/Feature/`.
7. Cross-check `docs/06-api-specification.md` for contract alignment.

## Common failure patterns
| Symptom | Root cause |
|---|---|
| 0 rows returned | Global/tenant scope silently filtering; check `Model::withoutGlobalScopes()` |
| Mass-assignment exception | Missing entry in `$fillable` |
| Binding not resolved | `register()` vs `boot()` order in ServiceProvider |
| Migration drift | Model `$casts` differs from actual column type in migration |
| Event not handled | Listener not registered in `EventServiceProvider` or module Provider |
| N+1 queries | Missing `->with([...])` in Service; add `->withCount()` for aggregates |
| Queue job not processed | Worker not running; check `QUEUE_CONNECTION` in `.env` |

## Security checklist (run before output)
- [ ] All controller inputs validated via `$request->validate()` or a dedicated FormRequest.
- [ ] Authorization: `$this->authorize()` or a Policy for every controller action.
- [ ] No raw SQL with user input — use Eloquent bindings or `DB::select()` with `?` placeholders.
- [ ] File uploads go through MinIO, never `public/` — use presigned URLs.
- [ ] Sensitive values (tokens, passwords) never logged.

## Do not
- Load `nuxt-vue` — stack isolation.
- Scan all modules — the table above is the index.
- Read seeders unless the bug is data-shape.
- Propose a new Module unless the task explicitly creates one.
