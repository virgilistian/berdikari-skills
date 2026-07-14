# Mode: refactor

Core: investigation, search, context. Skills: project map + matched stack skill. UI overlays (`ui:` block) apply when touching existing `web/**` UI: `minimal-change` + `safe-enhancement` (keep diff small, behavior intact); `pattern-reuse`/`ui-continuity` when consolidating toward existing patterns/tokens. Behavior must not change.

## Steps
1. **Scope** — restate the exact structural change and the invariant ("no behavior change"). Bound to named files.
2. **Safety net** — confirm covering tests exist; if none, note the risk before touching code.
3. **Map references** — find all usages of the symbol(s) being changed (one reference search, not a scan).
4. **Transform** — apply mechanical change across the known reference set. No opportunistic edits.
5. **Verify** — run the covering tests / type check; behavior identical.

## Early stop
Stop when the structural change is complete and tests are green.

## Output
- What moved/renamed/extracted, reference count updated, test result, confirmation of unchanged behavior.
