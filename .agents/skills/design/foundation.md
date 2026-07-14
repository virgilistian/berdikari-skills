# Design Foundation (shared across all design roles — defined once)

Referenced by every `skills/design/*` role. Assumes core/* loaded. Never restate this inside a role — link here.

## Non-negotiable: cite the inspiration source (visible attribution)

Every design task MUST be anchored to a **named source**, and that source MUST appear in the output.

- **Image attachment** → actually view it (e.g. `view_image`). Extract: palette (hex), type feel, spacing rhythm, shape language (radius), density, mood, layout skeleton.
- **Web URL** → capture it (fetch content + a visual snapshot, e.g. `open_browser_page` → `screenshot_page`, or `fetch_webpage`). Extract the same attributes.
- **No source given** → ask for one, OR propose 2–3 concrete named references (real products/sites) and proceed only after the user picks. Never invent a vague "modern, clean" direction.

Output must include a **Source panel**:
```
Inspiration: <image name | url>
Extracted → palette: #.. #.. #..  · type: <family/feel> · radius: <n> · density: <compact|comfortable> · mood: <3 words>
Applied → <how each extracted trait maps to the design tokens below>
```
This is the evidence trail (Principle 4): every visual decision traces to the source or to an explicit product rationale.

## Anti-"AI-generated" checklist (the taste bar)

Reject and revise any output that shows these generic tells:

1. **Purple/indigo gradient default** on hero/buttons/blobs. Use a source-derived palette instead.
2. **Everything centered** with identical vertical rhythm. Use intentional asymmetry, a real grid, and alignment hierarchy.
3. **Uniform glassmorphism / drop-shadow on every card.** Elevation must mean something.
4. **Emoji as icons.** Use the icon set (`@lucide/vue`) with consistent stroke width.
5. **Generic copy** ("Unlock the power of…", "Seamlessly…"). Write domain-specific, concrete microcopy.
6. **Perfectly even spacing everywhere** — no optical adjustments, no density contrast between primary and secondary content.
7. **One weight, one size** typography. Establish a real type scale with contrast between display / body / caption.
8. **Rounded-2xl + big shadow + pastel** on literally everything. Vary radius/elevation by component role.
9. **Placeholder-looking hierarchy** — hero, three feature cards, CTA. Design for the actual screen and its states.
10. **No empty / loading / error / dense-data states.** Real interfaces are defined by their edge states.

## Design token schema (single source of truth for a design)

Produce tokens before components. Map to Tailwind theme + CSS vars (matches this repo's shadcn-vue setup):
```
color:   bg, surface, surface-muted, border, foreground, muted-foreground, primary, primary-foreground, accent, destructive, success, warning (+ ring)
type:    font family(ies), scale (display/h1/h2/h3/body/small/caption) with size · line-height · weight · tracking
space:   base unit, scale (used consistently, with optical exceptions noted)
radius:  by role (input, card, pill, sheet)
shadow:  elevation levels (0–3) with intended meaning
motion:  durations + easing (respect prefers-reduced-motion)
```

## Stack conventions (implement to these, do not reinvent)

- Nuxt 4 / Vue 3 `<script setup>`. Primitives in `web/app/components/ui/` (reka-ui headless + `cva` variants, `clsx` + `tailwind-merge` via the repo's `cn()` helper). Mirror existing `button`/`card`/`input`.
- Icons: `@lucide/vue`. Animation: `tailwindcss-animate` + CSS; heavier interaction via `@vueuse/core`.
- Tokens live as CSS vars in the global stylesheet + `tailwind.config.js` theme extension. Components consume tokens, never hard-coded hex.
- Accessibility is part of "done": semantic elements, focus-visible rings, contrast ≥ WCAG AA, keyboard paths (reka-ui gives most of this — don't break it).
