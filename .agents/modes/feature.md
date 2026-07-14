# Mode: feature

Core: investigation, search, context. Skills: project map + matched stack (laravel and/or nuxt-vue) + api/database if triggered. UI overlays (`ui:` block) when enhancing existing `web/**` UI: `ui-continuity`, `safe-enhancement`, `pattern-reuse`, `minimal-change` (loaded by trigger, not a redesign — redesign → mode `design`).

## Steps
1. **Acceptance** — restate the feature as 2–4 checkable criteria. Identify owning module(s) from the project map.
2. **Anchor** — find the existing sibling pattern (nearest controller/page/store) via one search. Mirror it; don't invent structure.
3. **Plan seam** — list the exact files to add/edit (route → controller → service → model/migration, or page → store → component). Keep to the module's conventions.
4. **Implement** — smallest vertical slice that satisfies criteria. Reuse existing helpers.
5. **Verify** — add/point to a test or run the path; confirm each acceptance criterion.

## Early stop
Stop when all acceptance criteria pass. Do not gold-plate.

## Output
- Files changed, how each criterion is met, verification, follow-ups (if any).
