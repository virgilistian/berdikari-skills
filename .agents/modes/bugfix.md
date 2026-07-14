# Mode: bugfix

Core: investigation, search, context. Skill: project map + matched stack/domain skills only. UI overlays (`ui:` block) when the fix touches existing `web/**` UI: `minimal-change` + `safe-enhancement` keep the fix additive and scoped.

## Steps
1. **Locate symptom layer** — map the task noun to a module (project map). Start at the layer nearest the symptom, not the top.
2. **Reproduce path** — search the exact error string / route / symbol (core/search). Rank → read the one file.
3. **Prove cause** — confirm the exact file+line that produces the wrong behavior (core/investigation). Descend a layer only if unproven.
4. **Fix** — minimal change at the proven line. No refactors, no unrelated cleanup.
5. **Verify** — run/point to the test or path that now behaves correctly.

## Known patterns (check before deep investigation)

| Symptom | First check | Typical cause |
|---|---|---|
| `ParseError: Unmatched '}'` on last method of a controller | Read the file from the class-closing `}` to EOF | Duplicate method body (or partial copy) pasted **after** the class `}` — delete every line after the closing `}` |
| `Class not found` / `Failed to open stream` for a controller | Check `routes/api.php` references vs. existing files in `app/Http/Controllers/` | Route references a file that was never created |

## Early stop
Stop when cause is proven AND the minimal fix is applied+verified.

## Output
- Root cause (file+line), the fix (diff), verification, confidence.
