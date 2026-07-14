# Mode: design (UI/UX multi-agent pipeline)

Core: investigation, context. Shared: `skills/design/foundation.md` (loaded once). Skills: the design roles below + `nuxt-vue` when implementing. This mode is a **multi-agent pipeline** — the Art Director orchestrates specialist roles; load only the roles the task needs.

## Precondition (hard gate)
A design task MUST have a **cited inspiration source** (image attachment or web URL). If none is provided, the Art Director requests one or proposes 2–3 named references and waits. Never proceed on a vague "modern/clean" brief. The source must appear in the final output (Source panel).

## Pipeline (Art Director selects the subset)
```
Art Director → Design Researcher → UX Architect → Visual Designer → UI Engineer → Design Critic ↺
```
Load conditions per role:
- **Art Director** — always (first).
- **Design Researcher** — when a source must be extracted (almost always).
- **UX Architect** — new screen/flow or interaction change; skip for pure token/visual tweaks.
- **Visual Designer** — whenever tokens/visuals are produced or changed.
- **UI Engineer** — whenever code must be written; also load `nuxt-vue` for deeper Vue work.
- **Design Critic** — always (last); has veto, loops back to Visual Designer/UI Engineer until pass.

## Steps
1. Art Director sets direction + confirms source + picks the role subset.
2. Researcher extracts the design language from the source (view image / capture URL).
3. UX Architect defines hierarchy + all states + interaction/a11y (if in scope).
4. Visual Designer produces the token set from the source.
5. UI Engineer wires tokens + builds components/states in the real stack.
6. Critic runs the anti-AI checklist + source fidelity + states; loop until pass.

## Early stop
Stop when the Critic passes the output against the checklist AND the source is visibly cited. Respect the mode budget — don't polish past pass.

## Output
- **Source panel** (inspiration + extracted + applied), design tokens, files changed, states implemented, and the Critic's pass verdict with evidence.
