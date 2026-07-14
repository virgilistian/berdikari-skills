# Skill: Nuxt 4 / Vue 3 — Berdikari Web

Load when: touching `berdikari-web/**`. Assumes `core/*` already loaded.

## Stack versions (locked)
- **Nuxt** 4.4.8 · **Vue** 3.5 · **vue-router** 5.1
- **Pinia** 3.0 + **@pinia/nuxt** 0.11
- **Reka-UI** 2.10 (headless primitives — always prefer over writing raw HTML)
- **Tailwind CSS** via `@nuxtjs/tailwindcss` 6.14 · **tailwind-merge** · **clsx** · **cva**
- **@vueuse/core** + **@vueuse/nuxt** 14.3
- **@lucide/vue** 1.22 (icon library)
- **Target runtime**: Cloudflare Pages (`nitro.preset: 'cloudflare-pages'`)

## File map (jump directly — never scan)
```
berdikari-web/
  nuxt.config.ts            # modules, tailwind, nitro preset
  tailwind.config.js        # content globs, theme tokens
  app/
    app.vue                 # root shell
    utils.ts                # shared formatters / helpers
    assets/css/tailwind.css # base styles
    layouts/                # named layouts (check before adding a new one)
    pages/
      index.vue             # dashboard / home
      login.vue             # auth page
      catalog/              # product catalogue pages
      finance/              # finance pages
      inventory/            # stock / inventory pages
      pos/                  # point-of-sale pages
    stores/
      cart.ts               # POS cart state
      dailyStock.ts         # daily stock state
      finance.ts            # finance state
    components/
      FilterSheet.vue       # shared filter drawer
      PlateScanSheet.vue    # plate scan input sheet
      ui/
        button/             # Button primitive (reka-ui base)
        card/               # Card primitive
        drawer/             # Drawer primitive
        input/              # Input primitive
        radio-group/        # RadioGroup primitive
```

## Layer trace for any UI task
1. **Page** — `pages/<route>.vue`; read `<script setup>` to find which store + composables it uses.
2. **Store** — `stores/<name>.ts`; find the action/getter producing the value.
3. **API call** — inside the store's `$fetch` / `useFetch`; the URL is a Laravel endpoint. Only cross into `laravel` skill if the defect is confirmed server-side.
4. **Component tree** — follow props/emits from the page down to `components/ui/` primitives.
5. **Layout** — check `layouts/` if the page uses a named layout.

## Writing code — conventions

### Components
- Use `<script setup lang="ts">` — no Options API.
- Props with `defineProps<{...}>()`, emits with `defineEmits<{...}>()`.
- Import icons from `@lucide/vue`: `import { IconName } from '@lucide/vue'`.
- Use existing `components/ui/` primitives — **do not** create a new primitive if one exists.
- Style with Tailwind utility classes. Use `cn()` (from `utils.ts` or `clsx`+`tailwind-merge`) for conditional classes.
- Use `cva` (class-variance-authority) for multi-variant component styles.

### Stores (Pinia)
- One file per domain: `cart.ts`, `dailyStock.ts`, `finance.ts` — extend existing stores before creating a new one.
- Use `defineStore('name', () => { ... })` (setup-store style, not options).
- Keep state reactive: `ref()`/`computed()` — never return plain objects from actions.
- API calls use `$fetch` inside actions (client-side) or `useFetch` in pages for SSR-aware fetching.

### Composables & utils
- Reusable logic goes in a composable (`useXxx()`) inside `app/utils.ts` or a dedicated file — check `utils.ts` first before writing a new helper.
- Use `@vueuse/core` primitives (`useLocalStorage`, `useEventListener`, etc.) before writing custom DOM logic.

### Routing
- File-based routing — `pages/foo/bar.vue` → `/foo/bar`.
- Dynamic segments: `pages/catalog/[id].vue`.
- Navigating: `navigateTo('/path')` or `useRouter().push()`.

### Fetching data
- In pages (SSR): `const { data } = await useFetch('/api/...')` — reactive, cached.
- In store actions (client-only): `await $fetch('/api/...')`.
- Never call `$fetch` directly in `<template>` or component `setup` without `useFetch`/`useAsyncData`.

### Tailwind
- Content globs live in `tailwind.config.js` — if a class is not applied, verify the glob covers the file.
- Do not purge custom classes by using dynamic class strings — use the `safelist` or `cn()` approach.

## High-value evidence (check before diagnosing)
| Symptom | Check first |
|---|---|
| Class not applied | `tailwind.config.js` content glob missing the file |
| Hydration mismatch | `onMounted`-only logic leaking to SSR; wrap in `if (import.meta.client)` |
| Store state not reactive | Action returning a plain object instead of `ref`/`computed` |
| `useFetch` data undefined | Missing `await` in page `setup`; check `status` + `error` |
| Cloudflare deploy broken | `nitro.preset` must stay `'cloudflare-pages'`; no Node-only APIs |
| Icon not showing | Import path must be `@lucide/vue`, not `lucide-vue-next` |
| Drawer/Sheet not opening | Reka-UI requires a `v-model:open` binding on the root primitive |

## Reka-UI quick reference
- All primitives are unstyled; add Tailwind classes on the slot.
- Use `asChild` prop to merge trigger behaviour onto an existing element.
- Always control open-state via `v-model:open` — do not imperatively toggle DOM.
- Components: `<Button>`, `<Card>`, `<Drawer>`, `<Input>`, `<RadioGroup>` — located in `components/ui/`.

## UI copy rule
**All user-visible text must be in Bahasa Indonesia.** No English in labels, placeholders, error messages, or button text.

## Do not
- Load `laravel` unless the trace confirms the bug is server-side.
- Create a new `components/ui/` primitive if one already exists.
- Read every store — load only the one the failing page uses.
- Use Options API, `this`, or class-based components.
- Import Lucide from `lucide-vue-next` — use `@lucide/vue`.
