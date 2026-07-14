<template>
  <div class="min-h-screen bg-background flex items-center justify-center p-6">
    <div class="text-center max-w-sm">
      <!-- Icon -->
      <div class="w-20 h-20 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
        <ShieldOff class="w-10 h-10 text-destructive" :stroke-width="1.5" />
      </div>

      <!-- Code -->
      <p class="text-caption text-muted-foreground uppercase tracking-widest mb-2">Error 403</p>

      <!-- Title -->
      <h1 class="text-h1 text-foreground mb-3">Akses Ditolak</h1>

      <!-- Description -->
      <p class="text-body text-muted-foreground mb-8">
        Kamu tidak memiliki izin untuk mengakses halaman ini.
        Hubungi pemilik usaha jika kamu merasa ini adalah kesalahan.
      </p>

      <!-- Actions -->
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <NuxtLink
          to="/"
          class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-body font-medium min-h-[44px] hover:opacity-90 transition-opacity"
        >
          <LayoutDashboard class="w-4 h-4" :stroke-width="1.75" />
          Kembali ke Beranda
        </NuxtLink>

        <button
          @click="$router.back()"
          class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-muted text-foreground text-body font-medium min-h-[44px] hover:bg-muted/80 transition-colors"
        >
          <ArrowLeft class="w-4 h-4" :stroke-width="1.75" />
          Kembali
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ShieldOff, LayoutDashboard, ArrowLeft } from '@lucide/vue'

definePageMeta({
  layout: false,  // standalone page — no sidebar
})

useSeoMeta({
  title: 'Akses Ditolak — Berdikari',
  description: 'Kamu tidak memiliki izin untuk mengakses halaman ini.',
})
</script>
