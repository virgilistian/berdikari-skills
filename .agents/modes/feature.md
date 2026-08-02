# Mode: feature

Core: investigation, search, context. Skills: project map + matched stack (laravel and/or nuxt-vue) + api/database if triggered. UI overlays (`ui:` block) when enhancing existing `web/**` UI: `ui-continuity`, `safe-enhancement`, `pattern-reuse`, `minimal-change` (loaded by trigger, not a redesign — redesign → mode `design`).

## Steps
1. **Acceptance** — restate the feature as 2–4 checkable criteria. Identify owning module(s) from the project map.
2. **Threat model (hard gate)** — run `security-architecture`: assets, actors, entry points, abuse cases, blast radius, controls. Emit the verdict. `RENTAN — BLOKIR` → stop here, present safer designs, wait. `PERLU PENGUATAN` → append the named controls to the acceptance criteria in step 1.
3. **Anchor** — find the existing sibling pattern (nearest controller/page/store) via one search. Mirror it; don't invent structure.
4. **Plan seam** — list the exact files to add/edit (route → controller → service → model/migration, or page → store → component). Keep to the module's conventions.
5. **Implement** — smallest vertical slice that satisfies criteria. Reuse existing helpers. Run the `security` implementation checklist on the touched surface.
6. **Verify** — add/point to a test or run the path; confirm each acceptance criterion, including the security ones. For any authorization-relevant feature, test the denial path (project DNA §9j.8).

## Early stop
Stop when all acceptance criteria pass. Do not gold-plate. Never stop early past an unresolved Critical/High architecture finding.

## Output
- Threat model + architecture verdict, files changed, how each criterion is met, verification, follow-ups (if any).
