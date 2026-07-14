# Mode: ask

Core: context only. Skills: load a stack/domain skill ONLY if the answer needs it.

## Steps
1. **Answerable from docs/one file?** — if yes, read only that (project map points you there). Answer.
2. **Needs code?** — one targeted search → one file read → answer.
3. Do not investigate layers. Do not load stack skills for conceptual questions.

## Early stop
Stop as soon as the question is answered.

## Output
- Direct answer, with the single source (file+line or doc) it came from.
