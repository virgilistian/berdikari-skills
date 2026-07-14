<template>
  <div class="p-4 md:p-6 space-y-5 max-w-2xl">
    <!-- Page Header -->
    <div>
      <p class="text-small text-muted-foreground">{{ today }}</p>
      <h1 class="text-h1 text-foreground mt-0.5">Bantuan</h1>
    </div>

    <!-- Intro -->
    <div class="bg-surface rounded-xl border border-border shadow-elevation-1 p-5 space-y-2">
      <div class="flex items-start gap-3">
        <div class="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <HelpCircle class="w-5.5 h-5.5 text-primary" :stroke-width="1.75" />
        </div>
        <div>
          <h2 class="text-h3 text-foreground">Butuh bantuan?</h2>
          <p class="text-small text-muted-foreground mt-1">
            Berikut beberapa panduan singkat dan cara menghubungi tim kami.
          </p>
        </div>
      </div>
    </div>

    <!-- Quick links -->
    <div class="bg-surface rounded-xl border border-border shadow-elevation-1 divide-y divide-border overflow-hidden">
      <NuxtLink
        v-for="link in quickLinks"
        :key="link.to"
        :to="link.to"
        class="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors"
      >
        <component :is="link.icon" class="w-4.5 h-4.5 text-muted-foreground flex-shrink-0" :stroke-width="1.75" />
        <span class="flex-1 text-body text-foreground">{{ link.label }}</span>
        <ChevronRight class="w-4 h-4 text-muted-foreground flex-shrink-0" :stroke-width="1.75" />
      </NuxtLink>
    </div>

    <!-- Contact -->
    <div class="bg-surface rounded-xl border border-border shadow-elevation-1 p-5 space-y-3">
      <h2 class="text-h3 text-foreground">Hubungi Kami</h2>
      <p class="text-small text-muted-foreground">
        Jika Anda mengalami kendala, tim dukungan Berdikari siap membantu.
      </p>
      <div class="flex flex-col gap-2">
        <a href="mailto:support@berdikari.test" class="flex items-center gap-2.5 text-body text-primary hover:underline">
          <Mail class="w-4 h-4 flex-shrink-0" :stroke-width="1.75" />
          support@berdikari.test
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { HelpCircle, ChevronRight, Mail, ShoppingCart, Wallet, Boxes } from '@lucide/vue'

definePageMeta({
  middleware: ['auth'],
  title: 'Bantuan',
})

useHead({ title: 'Bantuan — Berdikari' })

const today = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())

const quickLinks = [
  { to: '/pos', icon: ShoppingCart, label: 'Cara menggunakan Kasir (POS)' },
  { to: '/finance', icon: Wallet, label: 'Mencatat pemasukan & pengeluaran' },
  { to: '/inventory', icon: Boxes, label: 'Mengelola stok harian' },
]
</script>
