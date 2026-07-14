# Mode: rca

Core: investigation, search, context. Skills: project map; add `git` if "since when/regression"; stack/domain only if triggered.

## Steps
1. **Frame** — state the observed effect and the one question to answer. Set hypothesis + confidence=low.
2. **Timeline (optional)** — if regression, load `git`: blame/bisect the suspect symbol only. Correlation ≠ proof.
3. **Trace one path** — Entry→Controller→Service→Repository→DB, descending only while unexplained (core/investigation).
4. **Prove** — pin the exact origin (file+line / query / config). Raise confidence only on direct evidence.
5. **Fix recommendation** — do not implement unless task says so; name the change and blast radius.

## Early stop
Stop when the origin is proven and confidence is high.

## Output
- Cause chain (effect ← … ← origin), evidence per link, confidence, recommended fix.
