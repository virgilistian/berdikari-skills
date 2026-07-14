# AGENTS.md — Berdikari

Portable agent architecture. Works with any coding agent (Copilot, Claude Code, Cursor, Cline, Gemini CLI, Qwen, Antigravity).

## How to use (minimal interface)

Give the agent only:

```
mode: <bugfix|rca|feature|refactor|deploy|review|design|ask>
task: <what you want>
```

`mode:` is optional — the Router infers it. Nothing else is required.

## Start here

1. Read `.agents/router.md` — the Agent Manager. It selects, loads, and orchestrates everything.
2. The Router loads `.agents/manifest.yaml` to pick the minimum skills, then the mode recipe and shared core rules.

## Rules of engagement (enforced by the architecture)

- Operate only inside this workspace.
- Router decides; skills investigate. The Router never reads source itself.
- Nothing loads automatically — skills load only when their triggers match (`.agents/manifest.yaml`).
- Never scan the repo — use the pre-built map `.agents/skills/project/berdikari.md`.
- Investigate progressively (Entry→Controller→Service→Repository→DB→Infra) and stop at first sufficient evidence.
- Shared rules live once in `.agents/core/` — never duplicated in skills.

## Layout

```
.agents/
  router.md            # Agent Manager (orchestration only)
  manifest.yaml        # skill/mode registry + triggers + costs (the lazy-loading index)
  core/                # shared rules, loaded once: investigation, search, context
  modes/               # thin recipes: bugfix, rca, feature, refactor, deploy, review, design, ask
  skills/
    project/berdikari.md   # pre-built repo map (replaces scanning)
    stack/                 # laravel, nuxt-vue, postgres, redis, minio, docker, kubernetes
    domain/                # api, database, deployment, git
    ui/                    # UI engineering overlays: ui-continuity, safe-enhancement,
                           # pattern-reuse, minimal-change (loaded on top of the stack skill
                           # when ENHANCING existing UI — not a redesign)
    design/                # UI/UX multi-agent pipeline: art-director, design-researcher,
                           # ux-architect, visual-designer, ui-engineer, design-critic (+ foundation)
```

## UI/UX design tasks

Use `mode: design`. It runs a multi-agent pipeline (Art Director → Researcher → UX Architect → Visual Designer → UI Engineer → Design Critic) that produces professional, non-generic interfaces. **A cited inspiration source is required** — attach an image or give a web URL; it is extracted into design tokens and shown in the output's Source panel.
