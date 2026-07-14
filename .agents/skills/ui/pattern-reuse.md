# Skill: Pattern Reuse (overlay)

Load when: a task would **introduce new UI/code** (component, utility, composable, helper, store logic, formatting) and an existing equivalent may already exist. Assumes core/* loaded; leans on core/`search`; defers stack specifics to `nuxt-vue`/`laravel`.

## Purpose
Prevent duplication: always find and reuse an existing component/utility/composable/helper/pattern before writing anything new. Order of preference: **reuse → extend → create new (last resort)**.

## Responsibilities
- Run a targeted search (core/search) for an existing equivalent before creating: primitives in `web/app/components/ui/`, helpers in `web/app/utils.ts`, composables (`useX`), stores, and sibling implementations.
- If a close match exists → **reuse** it as-is.
- If a near match exists → **extend** it (new prop/variant/option) rather than fork it.
- Only when neither exists → **create new**, mirroring the nearest existing pattern's shape and location.
- Record the reuse decision (what was found, what was chosen, why).

## Inputs
- The capability the task needs (e.g. number formatting, a masked input).
- Search results for existing equivalents across `web/**` (and `berdikari-api/**` when server-side).

## Dependencies
- core: `search` (primary), `investigation`, `context`.
- `nuxt-vue` / `laravel` — for where each artifact type conventionally lives.

## Stopping conditions
Stop as soon as a suitable existing artifact is found and reused/extended. Only fall through to "create new" after the search demonstrably finds no equivalent. Do not enumerate every candidate — one disambiguating search per artifact type.

## Outputs
- The reused/extended artifact (or a justified new one), plus a one-line reuse rationale ("found `formatCurrency` in utils.ts → reused").

## Success criteria
- No duplicate of an existing component/utility/composable/helper was created.
- New code exists only where search proved no reusable equivalent.
- New/extended code mirrors the existing pattern's location and shape.
