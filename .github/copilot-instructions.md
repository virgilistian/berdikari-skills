# Copilot instructions — Berdikari

This repo uses a portable agent architecture. Do not duplicate rules here.

**Entry point:** read [`.agents/router.md`](../.agents/router.md) (the Agent Manager) and follow it.

Minimal interface for every task:

```
mode: <bugfix|rca|feature|refactor|deploy|review|design|ask>
task: <request>
```

Non-negotiables: Router orchestrates, skills investigate; load skills only when `.agents/manifest.yaml` triggers match; never scan the repo (use `.agents/skills/project/berdikari.md`); investigate progressively and stop at first sufficient evidence; shared rules live once in `.agents/core/`.
