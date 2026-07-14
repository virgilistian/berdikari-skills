# Skill: UI Continuity (overlay)

Load when: a task **modifies existing UI** in `web/**` (enhance/adjust a field, form, component, page) — NOT a full redesign (redesign → mode `design`). Assumes core/* loaded; defers stack specifics to `nuxt-vue`; reads the token/system rules in `skills/design/foundation.md` only when a visual decision is in question.

## Purpose
Guarantee every UI change inherits the existing design system — components, typography, color, spacing, radius/elevation, and interaction patterns — so the result is indistinguishable in style from the surrounding UI.

## Responsibilities
- Anchor to the **nearest existing sibling** (same page/section/primitive) and match its structure and classes.
- Consume existing design tokens (CSS vars / `web/tailwind.config.js` theme, the `cn()` + `cva` primitives in `web/app/components/ui/`). Never hard-code color/spacing.
- Preserve established interaction patterns (focus rings, keyboard paths, hover/disabled/loading states, reka-ui semantics).
- Keep copy, iconography (`@lucide/vue`), and density consistent with the module.
- Flag — do not silently perform — any change that would alter the established look and feel.

## Inputs
- The target UI location (page/component) and the requested enhancement.
- The existing sibling pattern + active tokens (found via core/search, not a scan).

## Dependencies
- core: `investigation`, `search`, `context`.
- `nuxt-vue` (stack conventions) — loaded alongside.
- `skills/design/foundation.md` — consulted only to resolve a token/system question; not restated here.

## Stopping conditions
Stop once the change reuses existing tokens/primitives/patterns and visually matches its siblings. Do not extend into restyling, theming, or layout redesign — if the task truly needs that, escalate to mode `design`.

## Outputs
- The enhanced UI using existing tokens/primitives, plus a one-line note of which sibling pattern was mirrored.

## Success criteria
- No new color/spacing hex or ad-hoc styling; only existing tokens/primitives used.
- Change is visually consistent with adjacent UI and preserves all interaction/a11y patterns.
- No existing UI was redesigned or restyled beyond the explicit request.
