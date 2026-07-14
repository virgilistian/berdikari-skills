# Core: Investigation Rules (shared, loaded once)

Referenced by every mode and skill. Never restate these inside a skill — link here.

## Progressive layering (Principle 3)

Investigate one layer at a time, top-down. Stop the moment evidence is sufficient.

```
Entry point → Controller → Service → Repository → Database → Infrastructure
```

- Start at the layer nearest the symptom, not always the top.
- Descend only when the current layer does not explain the observation.
- Do not read a lower layer "to be thorough." Thoroughness = proof, not coverage.

## Evidence-based expansion (Principle 4)

Before any search, read, or tool call, state in one clause: **"Collecting: <evidence>."**
If you cannot name the evidence, do not run the call. Blind exploration is prohibited.

An action is justified only if its result can change your next decision.

## Confidence & proof

Track a working hypothesis and a confidence level (low/medium/high).

- Raise confidence only with **direct evidence** (a line of code, a log, a query result, a test).
- A fix is "identified" only when you can point to the exact file+line that produces the behavior.
- Correlation (git timing, similar names) is a lead, never proof.

## Anti-patterns (never do)

- Reading a whole directory to "understand structure" → use the project map.
- Re-reading a file already in context.
- Opening files whose relevance you cannot state.
- Continuing after the answer is proven.
