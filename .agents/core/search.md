# Core: Repository Search Strategy (shared, loaded once)

Referenced by every investigative mode. Goal: reach the right file in the fewest reads.

## Pipeline (Principle 6) — never scan the whole repo

```
Search → Rank → Read → Validate → Expand (only if needed)
```

1. **Search** — one targeted exact/regex query for a symbol, string, route, or key.
   Prefer symbol/definition search over folder listing. Scope with a path glob from the project map.
2. **Rank** — from hits, pick the single most likely file by layer + module. Do not open all hits.
3. **Read** — read that one file, a **large** relevant range at once (not many small reads).
4. **Validate** — does it explain the symptom / hold the insertion point? If yes, stop searching.
5. **Expand** — only if invalidated: follow one concrete reference (a call, import, route target). Never widen blindly.

## Starting points (use the project map, not discovery)

Get entry points, module→path, and layer paths from `skills/project/berdikari.md`.
Jump directly. Do not `ls` to find where things live.

## Query discipline

- One query should disambiguate, not enumerate. Combine alternatives with regex `a|b|c`.
- Search by the most unique token available (error string, route URI, method name, config key).
- Bound every search to a module/path glob when the module is known.

## Read discipline

- Batch reads: one wide range beats five narrow ones.
- Never re-open a file already in context.
- Read tests/fixtures only when they are the evidence you named.
