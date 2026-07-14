<template>
  <div class="p-4 md:p-6 max-w-2xl mx-auto space-y-5">

    <!-- Header -->
    <div class="flex items-start justify-between pt-1">
      <div>
        <p class="text-small text-muted-foreground">{{ formattedDate }}</p>
        <h1 class="text-h1 text-foreground mt-0.5">Stok &amp; Valuasi</h1>
      </div>
      <NuxtLink to="/inventory">
        <button class="flex items-center gap-2 h-10 px-4 rounded-lg border border-border text-body font-medium hover:bg-muted transition-colors">
          <CalendarDays class="w-4 h-4" :stroke-width="1.75" />
          Stok Harian
        </button>
      </NuxtLink>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="space-y-2">
      <div class="grid grid-cols-2 gap-3">
        <div v-for="i in 4" :key="i" class="skeleton h-20 rounded-xl" />
      </div>
      <div v-for="i in 5" :key="i" class="skeleton h-16 rounded-xl" />
    </div>

    <template v-else>
      <!-- Valuation summary -->
      <div class="grid grid-cols-2 gap-3">
        <div class="bg-surface rounded-xl border border-border p-4 shadow-elevation-1">
          <p class="text-small text-muted-foreground">Nilai Stok (Modal)</p>
          <p class="text-h2 text-foreground mt-1 tabular-nums">{{ formatRupiah(store.summary?.stock_value ?? 0) }}</p>
        </div>
        <div class="bg-surface rounded-xl border border-border p-4 shadow-elevation-1">
          <p class="text-small text-muted-foreground">Nilai Jual</p>
          <p class="text-h2 text-foreground mt-1 tabular-nums">{{ formatRupiah(store.summary?.retail_value ?? 0) }}</p>
        </div>
        <div class="bg-surface rounded-xl border border-border p-4 shadow-elevation-1">
          <p class="text-small text-muted-foreground">Total Produk</p>
          <p class="text-h2 text-foreground mt-1 tabular-nums">{{ store.summary?.total_products ?? 0 }}</p>
        </div>
        <div class="bg-surface rounded-xl border border-border p-4 shadow-elevation-1">
          <p class="text-small text-muted-foreground">Stok Menipis</p>
          <p class="text-h2 mt-1 tabular-nums" :class="(store.summary?.low_stock_count ?? 0) > 0 ? 'text-warning' : 'text-foreground'">
            {{ store.summary?.low_stock_count ?? 0 }}
          </p>
        </div>
      </div>

      <!-- Low stock alert -->
      <div v-if="lowStockRows.length" class="rounded-xl border border-warning/40 bg-warning/10 p-4">
        <div class="flex items-center gap-2 text-warning">
          <AlertTriangle class="w-4 h-4" :stroke-width="1.75" />
          <p class="text-body font-medium">{{ lowStockRows.length }} produk perlu segera diisi ulang</p>
        </div>
        <ul class="mt-2 space-y-1">
          <li v-for="r in lowStockRows" :key="r.product_id" class="text-small text-foreground flex justify-between">
            <span>{{ r.product_name }}</span>
            <span class="tabular-nums text-muted-foreground">sisa {{ r.quantity }} / min {{ r.min_stock }}</span>
          </li>
        </ul>
      </div>

      <!-- Empty -->
      <div v-if="store.rows.length === 0" class="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <div class="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <Package class="w-6 h-6 text-muted-foreground" :stroke-width="1.5" />
        </div>
        <div>
          <p class="text-h3 text-foreground">Belum ada stok</p>
          <p class="text-body text-muted-foreground mt-1">Terima stok masuk untuk mulai memantau inventori</p>
        </div>
      </div>

      <!-- Stock list -->
      <div v-else class="space-y-2">
        <div
          v-for="r in store.rows"
          :key="r.product_id"
          class="bg-surface rounded-xl border border-border p-3 flex items-center gap-3"
          :class="{ 'border-warning/50': r.is_low }"
        >
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="text-h3 text-foreground truncate">{{ r.product_name }}</p>
              <span v-if="r.is_low" class="text-xs px-1.5 py-0.5 rounded-full bg-warning/15 text-warning font-medium">Menipis</span>
            </div>
            <p class="text-small text-muted-foreground tabular-nums mt-0.5">
              {{ formatRupiah(r.purchase_price) }} • nilai {{ formatRupiah(r.stock_value) }}
            </p>
          </div>
          <div class="text-right flex-shrink-0">
            <p class="text-h2 text-foreground tabular-nums leading-none">{{ r.quantity }}</p>
            <p class="text-xs text-muted-foreground mt-0.5">min {{ r.min_stock }}</p>
          </div>
          <div class="flex flex-col gap-1 flex-shrink-0">
            <button @click="openAction('receive', r)" class="text-xs px-2 h-8 rounded-md bg-primary/10 text-primary font-medium hover:bg-primary/20">Terima</button>
            <button @click="openAction('adjust', r)" class="text-xs px-2 h-8 rounded-md bg-secondary text-secondary-foreground font-medium hover:bg-secondary/70">Sesuaikan</button>
          </div>
        </div>
      </div>
    </template>

    <!-- Action bottom sheet -->
    <Transition name="overlay">
      <div v-if="action" class="fixed inset-0 bg-foreground/40 z-40 backdrop-blur-[2px]" @click="closeAction" aria-hidden="true" />
    </Transition>
    <Transition name="sheet">
      <div
        v-if="action"
        class="fixed bottom-0 left-0 right-0 md:left-auto md:right-6 md:bottom-6 md:w-96 md:rounded-2xl z-50 bg-surface rounded-t-2xl shadow-elevation-3"
        role="dialog" aria-modal="true"
      >
        <div class="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 class="text-h2 text-foreground">{{ actionTitle }}</h2>
          <button @click="closeAction" class="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted" aria-label="Tutup">
            <X class="w-4 h-4" :stroke-width="1.75" />
          </button>
        </div>
        <div class="p-4 space-y-4">
          <p class="text-body text-muted-foreground">{{ activeRow?.product_name }} — stok saat ini <span class="font-medium text-foreground tabular-nums">{{ activeRow?.quantity }}</span></p>

          <div>
            <label class="text-small text-muted-foreground">{{ action === 'receive' ? 'Jumlah masuk' : 'Jumlah stok sebenarnya' }}</label>
            <input
              v-model.number="qtyInput" type="number" inputmode="numeric" min="0"
              class="mt-1 w-full h-12 px-3 bg-background border border-input rounded-lg text-h2 tabular-nums focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary"
              placeholder="0"
            />
          </div>

          <div v-if="action === 'adjust'">
            <label class="text-small text-muted-foreground">Ambang batas stok menipis</label>
            <input
              v-model.number="minInput" type="number" inputmode="numeric" min="0"
              class="mt-1 w-full h-11 px-3 bg-background border border-input rounded-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary"
              placeholder="0"
            />
          </div>

          <div>
            <label class="text-small text-muted-foreground">Catatan (opsional)</label>
            <input
              v-model="reasonInput" type="text"
              class="mt-1 w-full h-11 px-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary"
              :placeholder="action === 'receive' ? 'mis. Belanja pasar' : 'mis. Barang rusak'"
            />
          </div>

          <button
            :disabled="saving || qtyInput === null"
            @click="submitAction"
            class="w-full h-12 rounded-lg font-semibold text-base flex items-center justify-center gap-2"
            :class="(saving || qtyInput === null) ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary text-primary-foreground hover:bg-primary/90'"
          >
            <Loader2 v-if="saving" class="w-4 h-4 animate-spin" :stroke-width="2" />
            {{ saving ? 'Menyimpan...' : 'Simpan' }}
          </button>
        </div>
        <div style="height: env(safe-area-inset-bottom, 0px)" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'permission'],
  permissions: ['inventory.view'],
})

import { ref, computed, onMounted } from 'vue'
import { CalendarDays, AlertTriangle, Package, X, Loader2 } from '@lucide/vue'
import { useInventoryStore, type StockRow } from '~/stores/inventory'
import { formatRupiah } from '~/utils'

const store = useInventoryStore()

const formattedDate = new Date().toLocaleDateString('id-ID', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
})

const lowStockRows = computed(() => store.rows.filter(r => r.is_low))

const action = ref<'receive' | 'adjust' | null>(null)
const activeRow = ref<StockRow | null>(null)
const qtyInput = ref<number | null>(null)
const minInput = ref<number | null>(null)
const reasonInput = ref('')
const saving = ref(false)

const actionTitle = computed(() => (action.value === 'receive' ? 'Stok Masuk' : 'Sesuaikan Stok'))

function openAction(type: 'receive' | 'adjust', row: StockRow) {
  action.value = type
  activeRow.value = row
  qtyInput.value = type === 'adjust' ? row.quantity : null
  minInput.value = row.min_stock
  reasonInput.value = ''
}

function closeAction() {
  action.value = null
  activeRow.value = null
}

async function submitAction() {
  if (!activeRow.value || qtyInput.value === null) return
  saving.value = true
  try {
    if (action.value === 'receive') {
      await store.receive(activeRow.value.product_id, qtyInput.value, undefined, reasonInput.value || undefined)
    } else {
      await store.adjust(activeRow.value.product_id, qtyInput.value, reasonInput.value || undefined)
      if (minInput.value !== null && minInput.value !== activeRow.value.min_stock) {
        await store.setMinStock(activeRow.value.product_id, minInput.value)
      }
    }
    closeAction()
  } finally {
    saving.value = false
  }
}

onMounted(store.fetchStock)
</script>
