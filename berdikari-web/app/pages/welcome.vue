<template>
  <div class="min-h-screen bg-background text-foreground">
    <!-- Top bar -->
    <header class="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur">
      <div class="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 md:px-6">
        <div class="flex items-center gap-3">
          <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span class="text-sm font-bold leading-none text-primary-foreground">B</span>
          </div>
          <span class="text-h3 font-semibold">Berdikari ERP</span>
        </div>
        <NuxtLink
          to="/login"
          class="flex min-h-[44px] items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 active:bg-primary/80"
        >
          Masuk
        </NuxtLink>
      </div>
    </header>

    <main>
      <!-- Hero -->
      <section class="mx-auto max-w-5xl px-4 pb-14 pt-14 text-center md:px-6 md:pb-20 md:pt-24" aria-labelledby="hero-title">
        <p class="hero-item mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-small font-medium text-primary" style="--d: 0ms">
          <Sparkles class="h-3.5 w-3.5" :stroke-width="2" aria-hidden="true" />
          Dibuat untuk UMKM Indonesia
        </p>
        <h1 id="hero-title" class="hero-item mx-auto max-w-2xl text-3xl font-bold leading-tight md:text-5xl" style="--d: 80ms">
          Kelola usaha semudah
          <span class="text-primary">memakai kalkulator</span>
        </h1>
        <p class="hero-item mx-auto mt-4 max-w-xl text-body text-muted-foreground md:text-lg" style="--d: 160ms">
          Kasir, keuangan, stok, laporan, dan karyawan dalam satu aplikasi.
          Tanpa istilah akuntansi yang rumit — cukup catat, pantau, dan kembangkan usaha Anda.
        </p>
        <div class="hero-item mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row" style="--d: 240ms">
          <NuxtLink
            to="/login"
            class="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground shadow-elevation-2 transition-all hover:bg-primary/90 hover:shadow-elevation-3 active:scale-[0.98] sm:w-auto"
          >
            Mulai Sekarang
            <ArrowRight class="h-4 w-4" :stroke-width="2" aria-hidden="true" />
          </NuxtLink>
          <a
            href="#fitur"
            class="flex min-h-[48px] w-full items-center justify-center rounded-lg border border-border bg-surface px-8 text-base font-medium transition-colors hover:bg-muted sm:w-auto"
          >
            Lihat Fitur
          </a>
        </div>

        <!-- Stat strip -->
        <dl class="hero-item mx-auto mt-12 grid max-w-2xl grid-cols-3 gap-3" style="--d: 320ms">
          <div v-for="stat in stats" :key="stat.label" class="rounded-xl border border-border bg-surface p-4 shadow-elevation-1">
            <dt class="text-caption text-muted-foreground">{{ stat.label }}</dt>
            <dd class="mt-1 text-h2 font-bold text-primary">{{ stat.value }}</dd>
          </div>
        </dl>
      </section>

      <!-- Features -->
      <section id="fitur" class="border-t border-border bg-surface py-14 md:py-20" aria-labelledby="fitur-title">
        <div class="mx-auto max-w-5xl px-4 md:px-6">
          <div class="reveal mx-auto max-w-xl text-center">
            <h2 id="fitur-title" class="text-2xl font-bold md:text-3xl">Semua kebutuhan usaha Anda</h2>
            <p class="mt-3 text-body text-muted-foreground">
              Setiap fitur dirancang agar bisa dipakai tanpa pelatihan — oleh kasir, tim produksi, maupun pemilik usaha.
            </p>
          </div>

          <div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <article
              v-for="feature in features"
              :key="feature.title"
              class="reveal rounded-xl border border-border bg-background p-5 shadow-elevation-1 transition-shadow hover:shadow-elevation-2"
            >
              <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <component :is="feature.icon" class="h-5 w-5 text-primary" :stroke-width="1.75" aria-hidden="true" />
              </span>
              <h3 class="mt-4 text-h3 font-semibold">{{ feature.title }}</h3>
              <p class="mt-1.5 text-body text-muted-foreground">{{ feature.description }}</p>
            </article>
          </div>
        </div>
      </section>

      <!-- How it works -->
      <section class="py-14 md:py-20" aria-labelledby="cara-title">
        <div class="mx-auto max-w-5xl px-4 md:px-6">
          <div class="reveal mx-auto max-w-xl text-center">
            <h2 id="cara-title" class="text-2xl font-bold md:text-3xl">Tiga langkah untuk mulai</h2>
          </div>
          <ol class="mt-10 grid gap-4 md:grid-cols-3">
            <li
              v-for="(step, index) in steps"
              :key="step.title"
              class="reveal relative rounded-xl border border-border bg-surface p-5 shadow-elevation-1"
            >
              <span class="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground" aria-hidden="true">
                {{ index + 1 }}
              </span>
              <h3 class="mt-4 text-h3 font-semibold">{{ step.title }}</h3>
              <p class="mt-1.5 text-body text-muted-foreground">{{ step.description }}</p>
            </li>
          </ol>
        </div>
      </section>

      <!-- Closing CTA -->
      <section class="border-t border-border bg-primary py-14 md:py-20" aria-labelledby="cta-title">
        <div class="reveal mx-auto max-w-2xl px-4 text-center md:px-6">
          <h2 id="cta-title" class="text-2xl font-bold text-primary-foreground md:text-3xl">
            Siap mandiri mengelola usaha?
          </h2>
          <p class="mt-3 text-body text-primary-foreground/80">
            Masuk dan rasakan mencatat penjualan pertama Anda dalam hitungan detik.
          </p>
          <NuxtLink
            to="/login"
            class="mt-8 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-surface px-8 text-base font-semibold text-primary shadow-elevation-2 transition-all hover:bg-surface/90 active:scale-[0.98]"
          >
            Masuk ke Aplikasi
            <ArrowRight class="h-4 w-4" :stroke-width="2" aria-hidden="true" />
          </NuxtLink>
        </div>
      </section>
    </main>

    <footer class="border-t border-border bg-surface py-8">
      <div class="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 text-center md:flex-row md:px-6">
        <p class="text-small text-muted-foreground">© {{ new Date().getFullYear() }} Berdikari ERP — ERP sederhana untuk UMKM Indonesia.</p>
        <NuxtLink to="/help" class="flex min-h-[44px] items-center text-small text-primary hover:text-primary/80">
          Pusat Bantuan
        </NuxtLink>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
  middleware: ['guest'], // authenticated users go straight to the dashboard
})

import { onMounted } from 'vue'
import {
  ArrowRight, BarChart2, Boxes, Camera, ShieldCheck, ShoppingCart,
  Sparkles, Users, Wallet,
} from '@lucide/vue'

useSeoMeta({
  title: 'Berdikari ERP — Aplikasi Kasir & Manajemen Usaha untuk UMKM',
  description:
    'Aplikasi kasir, keuangan, stok, laporan, dan karyawan dalam satu genggaman. '
    + 'Dirancang sederhana untuk UMKM Indonesia — tanpa istilah akuntansi yang rumit.',
  ogTitle: 'Berdikari ERP — Kelola usaha semudah memakai kalkulator',
  ogDescription: 'Kasir, keuangan, stok, laporan, dan karyawan dalam satu aplikasi sederhana untuk UMKM Indonesia.',
  ogType: 'website',
  twitterCard: 'summary_large_image',
})

useHead({
  htmlAttrs: { lang: 'id' },
})

const stats = [
  { label: 'Modul usaha', value: '6+' },
  { label: 'Latihan dibutuhkan', value: '0' },
  { label: 'Bahasa', value: 'ID' },
]

const features = [
  {
    icon: ShoppingCart,
    title: 'Kasir (POS)',
    description: 'Catat pesanan, terima pembayaran, simpan nota — tetap jalan walau internet putus.',
  },
  {
    icon: Camera,
    title: 'Pindai Piring AI',
    description: 'Foto piring pelanggan dan biarkan AI mengisi pesanan secara otomatis.',
  },
  {
    icon: Wallet,
    title: 'Keuangan Sederhana',
    description: 'Pemasukan dan pengeluaran tercatat rapi, tanpa istilah debit-kredit.',
  },
  {
    icon: Boxes,
    title: 'Stok Harian',
    description: 'Stok pembukaan pagi, terpotong otomatis oleh penjualan, tutup di malam hari.',
  },
  {
    icon: BarChart2,
    title: 'Laporan Bisnis',
    description: 'Ringkasan penjualan, kas, dan produk terlaris dalam satu tampilan.',
  },
  {
    icon: Users,
    title: 'Karyawan & Absensi',
    description: 'Profil karyawan, absen masuk-pulang, dan persetujuan cuti dari genggaman.',
  },
  {
    icon: ShieldCheck,
    title: 'Akses Sesuai Peran',
    description: 'Kasir, dapur, keuangan, hingga pemilik — setiap orang hanya melihat yang perlu.',
  },
]

const steps = [
  { title: 'Masuk ke akun Anda', description: 'Gunakan akun yang dibuatkan pemilik usaha — tidak perlu instalasi apa pun.' },
  { title: 'Catat aktivitas harian', description: 'Buka kasir, input stok pagi, atau catat pengeluaran seperti biasa.' },
  { title: 'Pantau perkembangan', description: 'Lihat laporan penjualan dan keuangan kapan saja, dari perangkat apa saja.' },
]

// Reveal-on-scroll animation. Respects prefers-reduced-motion (handled in CSS)
// and falls back to visible content when IntersectionObserver is missing.
onMounted(() => {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'))
    return
  }
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      }
    }
  }, { threshold: 0.15 })
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
})
</script>

<style scoped>
/* Hero: staggered entrance on load */
.hero-item {
  animation: rise-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: var(--d, 0ms);
}

/* Sections: reveal on scroll */
.reveal {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.55s ease-out, transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
}
.reveal.is-visible {
  opacity: 1;
  transform: none;
}

@keyframes rise-in {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-item {
    animation: none;
  }
  .reveal {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
