# Design Role: UI Engineer (implementation in the real stack)

Load: whenever design output must become working code. Reads `foundation.md` + core/* + (if deeper Vue work) the `nuxt-vue` skill.

## Responsibility
Implement the tokens + structure as production Nuxt/Vue components that match this repo's conventions exactly.

## Do
1. **Wire tokens once**: CSS vars in the global stylesheet + `web/tailwind.config.js` theme extension (light+dark). Everything else consumes them.
2. **Mirror the existing pattern** in `web/app/components/ui/` (reka-ui headless + `cva` variants + the `cn()` helper). Extend `button`/`card`/`input`; add new primitives the same way. Don't introduce a parallel styling approach.
3. Build the screen in `web/app/pages/<area>/` consuming stores in `web/app/stores/`. Implement **every state** the UX Architect specified (skeleton, empty, error, dense).
4. Icons via `@lucide/vue` (consistent stroke). Motion via `tailwindcss-animate`/CSS, gated by `prefers-reduced-motion`.
5. Accessibility: preserve reka-ui semantics, focus-visible rings, labels, keyboard paths. Don't regress a11y for aesthetics.
6. Keep changes minimal and idiomatic — no unrelated refactors.

## Don't
Hard-code colors/spacing (tokens only). Add a new UI framework/CSS-in-JS. Ship without empty/loading/error states. Break SSR/hydration (see `nuxt-vue`).

## Output
The changed files (tokens, primitives, page/states), plus how to view them.
