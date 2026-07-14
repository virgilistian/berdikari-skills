<template>
  <div class="p-4 md:p-6 max-w-lg mx-auto space-y-5">

    <!-- Header -->
    <div class="flex items-start justify-between pt-1">
      <div>
        <p class="text-small text-muted-foreground">{{ formattedDate }}</p>
        <h1 class="text-h1 text-foreground mt-0.5">Stok Harian</h1>
        <NuxtLink to="/inventory/stock" class="inline-flex items-center gap-1 text-small text-primary hover:text-primary/80 mt-1">
          Stok &amp; Valuasi
          <ChevronRight class="w-3.5 h-3.5" :stroke-width="1.75" />
        </NuxtLink>
      </div>
      <!-- Only show Add button when day hasn't been opened yet -->
      <NuxtLink v-if="!store.hasStocks && !store.loading" to="/inventory/new">
        <button
          class="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-body font-medium min-h-[44px] hover:bg-primary/90 active:bg-primary/80 transition-colors"
        >
          <Plus class="w-4 h-4" :stroke-width="1.75" />
          Buka Stok
        </button>
      </NuxtLink>
      <!-- Close Day button when stock is open -->
      <button
        v-else-if="store.isOpen"
        @click="handleCloseDay"
        :disabled="store.loading"
        class="flex items-center gap-2 h-10 px-4 rounded-lg bg-destructive text-destructive-foreground text-body font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Loader2 v-if="store.loading" class="w-4 h-4 animate-spin" :stroke-width="2" />
        <LogOut v-else class="w-4 h-4" :stroke-width="1.75" />
        Tutup Hari Ini
      </button>
    </div>

    <!-- ── Loading skeleton ── -->
    <template v-if="store.loading">
      <div class="space-y-2">
        <div v-for="i in 6" :key="i" class="skeleton h-14 rounded-xl" />
      </div>
    </template>

    <!-- ── STATE 1: No stock opened yet → Empty state ── -->
    <template v-else-if="!store.hasStocks">
      <div class="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div class="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
          <Boxes class="w-7 h-7 text-muted-foreground" :stroke-width="1.5" />
        </div>
        <div>
          <p class="text-h3 text-foreground">Stok hari ini belum dibuka</p>
          <p class="text-body text-muted-foreground mt-1">Catat stok awal sebelum toko buka</p>
        </div>
        <NuxtLink to="/inventory/new">
          <button class="flex items-center gap-2 bg-primary text-primary-foreground px-5 h-11 rounded-lg text-body font-medium hover:bg-primary/90 active:bg-primary/80 transition-colors">
            <Plus class="w-4 h-4" :stroke-width="1.75" />
            Buka Stok Hari Ini
          </button>
        </NuxtLink>
      </div>
    </template>

    <!-- ── STATE 2: Stock open → live table ── -->
    <template v-else-if="store.isOpen">
      <div class="rounded-xl border border-border overflow-hidden">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-muted/50 border-b border-border">
              <th class="px-4 py-3 text-small font-semibold text-muted-foreground">Menu</th>
              <th class="px-4 py-3 text-small font-semibold text-muted-foreground text-right">Buka</th>
              <th class="px-4 py-3 text-small font-semibold text-muted-foreground text-right">Terjual</th>
              <th class="px-4 py-3 text-small font-semibold text-muted-foreground text-right">Sisa</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr v-for="s in store.stocks" :key="s.id" class="bg-surface hover:bg-muted/30 transition-colors">
              <td class="px-4 py-3 text-body text-foreground">{{ s.product_name }}</td>
              <td class="px-4 py-3 text-body text-muted-foreground text-right tabular-nums">{{ s.opening_qty }}</td>
              <td
                class="px-4 py-3 text-body text-right tabular-nums"
                :class="s.sold_qty > 0 ? 'text-destructive font-medium' : 'text-muted-foreground'"
              >{{ s.sold_qty }}</td>
              <td
                class="px-4 py-3 text-body font-semibold text-right tabular-nums"
                :class="remaining(s) <= 0 ? 'text-destructive' : 'text-foreground'"
              >{{ remaining(s) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="store.error" class="text-small text-destructive">{{ store.error }}</p>
    </template>

    <!-- ── STATE 3: Day closed → EOD recap ── -->
    <template v-else-if="store.isClosed">
      <div class="flex items-center gap-2 bg-success/10 text-success rounded-xl px-4 py-3 border border-success/20">
        <CheckCircle2 class="w-5 h-5 flex-shrink-0" :stroke-width="1.75" />
        <span class="text-body font-medium">Hari telah ditutup — Rekap akhir hari</span>
      </div>

      <div class="rounded-xl border border-border overflow-hidden">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-muted/50 border-b border-border">
              <th class="px-4 py-3 text-small font-semibold text-muted-foreground">Menu</th>
              <th class="px-4 py-3 text-small font-semibold text-muted-foreground text-right">Buka</th>
              <th class="px-4 py-3 text-small font-semibold text-muted-foreground text-right">Terjual</th>
              <th class="px-4 py-3 text-small font-semibold text-muted-foreground text-right">Tutup</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr v-for="s in store.stocks" :key="s.id" class="bg-surface">
              <td class="px-4 py-3 text-body text-foreground">{{ s.product_name }}</td>
              <td class="px-4 py-3 text-body text-muted-foreground text-right tabular-nums">{{ s.opening_qty }}</td>
              <td
                class="px-4 py-3 text-body text-right tabular-nums"
                :class="s.sold_qty > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'"
              >{{ s.sold_qty }}</td>
              <td class="px-4 py-3 text-body font-semibold text-right tabular-nums text-foreground">
                {{ s.closing_qty ?? 0 }}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="bg-muted/50 border-t border-border">
              <td class="px-4 py-3 text-body font-semibold text-foreground">Total</td>
              <td class="px-4 py-3 text-body font-semibold text-right tabular-nums text-muted-foreground">{{ totalOpening }}</td>
              <td class="px-4 py-3 text-body font-semibold text-right tabular-nums text-foreground">{{ totalSold }}</td>
              <td class="px-4 py-3 text-body font-semibold text-right tabular-nums text-foreground">{{ totalClosing }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </template>

  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'permission'],
  permissions: ['inventory.view'],
})

import { onMounted, computed } from 'vue'
import { Plus, Loader2, LogOut, CheckCircle2, Boxes, ChevronRight } from '@lucide/vue'
import { useDailyStockStore, type DailyStockItem } from '~/stores/dailyStock'

const store = useDailyStockStore()

const formattedDate = computed(() =>
  new Date(store.today ?? new Date()).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
)

function remaining(s: DailyStockItem) {
  return Math.max(0, s.opening_qty - s.sold_qty)
}

const totalOpening = computed(() => store.stocks.reduce((sum, s) => sum + s.opening_qty, 0))
const totalSold = computed(() => store.stocks.reduce((sum, s) => sum + s.sold_qty, 0))
const totalClosing = computed(() => store.stocks.reduce((sum, s) => sum + (s.closing_qty ?? 0), 0))

async function handleCloseDay() {
  await store.closeDay()
}

onMounted(() => store.fetchToday())
</script>
