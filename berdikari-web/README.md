# Berdikari Web

Frontend for **Berdikari ERP** — a simple, Indonesian-language ERP for SMEs (UMKM). Built with Nuxt 4, Vue 3, Tailwind CSS, and deployed to Cloudflare Pages.

## Tech Stack

| Layer | Library / Tool |
|---|---|
| Framework | Nuxt 4 + Vue 3 |
| Styling | Tailwind CSS v3 |
| UI Primitives | Reka UI |
| Icons | Lucide Vue |
| State | Pinia |
| Utils | VueUse |
| Deploy target | Cloudflare Pages (SSR via Workers) |

## Pages

| Route | Description |
|---|---|
| `/` | Dashboard |
| `/login` | Authentication |
| `/pos` | Point of Sale |
| `/catalog` | Product catalog |
| `/finance` | Cash flow — income, expenses, balance summary |

## Local Development

```bash
npm install
npm run dev       # http://localhost:3000
```

## Build & Preview

```bash
npm run build     # Nitro → Cloudflare Pages preset → outputs to dist/
npm run preview   # Preview production build locally
```

## Deployment

### Manual

```bash
npx nuxt build
npx wrangler pages deploy dist --project-name=berdikari-web --branch=main
```

> **Note:** The `cloudflare-pages` preset writes to `dist/`, not `.output/public/`. Always deploy from `dist/`.

### CI/CD

Pushes to `main` trigger automatic deployment via GitHub Actions (`.github/workflows/deploy-frontend.yml`).

**Required GitHub Secrets:**

| Secret | Description |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Custom token with **Cloudflare Pages: Edit** permission |
| `CLOUDFLARE_ACCOUNT_ID` | Found in Cloudflare Dashboard → Workers & Pages |
| `NUXT_PUBLIC_API_BASE` | Backend API URL (e.g. `https://api.berdikari.id`) |

The Nitro `cloudflare-pages` preset outputs a `_worker.js` (SSR handler) alongside static assets into `dist/`, which is what Wrangler deploys.
