// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt', '@vueuse/nuxt'],
  css: ['~/assets/css/tailwind.css'],
  nitro: {
    preset: 'cloudflare-pages',
  },
  runtimeConfig: {
    // Server-only base URL the Nuxt server uses to reach the API during SSR.
    // In Docker this is the internal service name (web -> api); it is never
    // exposed to the browser. Falls back to the public base for local dev.
    apiBaseServer:
      process.env.NUXT_API_BASE_SERVER ||
      process.env.NUXT_PUBLIC_API_BASE ||
      'http://localhost:8000/api',
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8000/api',
    },
  },
})
