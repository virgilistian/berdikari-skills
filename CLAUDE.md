# CLAUDE.md

This repo uses a portable, model-agnostic agent architecture. Rules are defined once — do not restate them here.

**Entry point:** read `.agents/router.md` (the Agent Manager) and obey it.

Minimal task interface:

```
mode: <bugfix|rca|feature|refactor|deploy|review|design|ask>
task: <request>
```

Core contract: the Router selects/loads/orchestrates skills via `.agents/manifest.yaml`; skills (not the Router) do the investigating; never scan the repo — use the map at `.agents/skills/project/berdikari.md`; investigate progressively and stop early; shared rules live in `.agents/core/`.

## Git commits

Do not add a `Co-Authored-By` trailer or any other AI-attribution line to commit messages.
