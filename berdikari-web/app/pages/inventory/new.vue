<template>
  <div>
    <div class="p-4 md:p-6 max-w-lg mx-auto pb-28 md:pb-6 space-y-6">

      <!-- Back + title -->
      <div class="flex items-center gap-2 -ml-1 pt-1">
        <button
          @click="router.back()"
          class="w-10 h-10 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors flex-shrink-0"
          aria-label="Kembali"
        >
          <ArrowLeft class="w-5 h-5" :stroke-width="1.75" />
        </button>
        <div>
          <h1 class="text-h1 text-foreground">Buka Stok Hari Ini</h1>
          <p class="text-small text-muted-foreground mt-0.5">{{ formattedDate }}</p>
        </div>
      </div>

      <!-- Instruction -->
      <p class="text-body text-muted-foreground -mt-2">
        Masukkan jumlah stok awal untuk setiap menu sebelum toko buka.
      </p>

      <!-- Product rows -->
      <div class="space-y-2">
        <div v-if="store.loading" class="space-y-2">
          <div v-for="i in 5" :key="i" class="skeleton h-[72px] rounded-xl" />
        </div>

        <div v-else-if="items.length === 0" class="bg-surface rounded-xl border border-border p-10 text-center">
          <p class="text-body text-muted-foreground">Belum ada produk aktif di katalog.</p>
          <NuxtLink to="/catalog" class="text-small text-primary mt-2 inline-block hover:underline">
            Tambah produk di Katalog →
          </NuxtLink>
        </div>

        <div
          v-for="item in items"
          :key="item.product_id"
          class="flex items-center gap-3 bg-surface rounded-xl border border-border px-4 py-3 hover:border-input transition-colors"
        >
          <!-- Product image -->
          <div class="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
            <img
              v-if="item.image_url"
              :src="item.image_url"
              :alt="item.product_name"
              class="w-full h-full object-cover"
              loading="lazy"
            />
            <Package v-else class="w-5 h-5 text-muted-foreground" :stroke-width="1.5" />
          </div>

          <!-- Product info -->
          <div class="flex-1 min-w-0">
            <p class="text-h3 text-foreground truncate">{{ item.product_name }}</p>
            <div class="flex items-center gap-3 mt-0.5">
              <span v-if="item.price" class="text-caption text-muted-foreground tabular-nums">
                {{ formatCurrency(item.price) }}
              </span>
              <span v-if="item.current_stock !== undefined" class="text-caption text-muted-foreground">
                Stok: <span class="font-medium" :class="item.current_stock <= 5 ? 'text-warning' : 'text-foreground'">{{ item.current_stock }}</span>
              </span>
            </div>
          </div>

          <!-- Qty stepper + manual input -->
          <div class="flex items-center gap-1.5 flex-shrink-0">
            <button
              @click="decrease(item)"
              :disabled="item.opening_qty <= 0"
              class="w-8 h-8 flex items-center justify-center rounded-lg border border-input text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              :aria-label="`Kurangi stok ${item.product_name}`"
            >
              <Minus class="w-3.5 h-3.5" :stroke-width="2" />
            </button>

            <input
              v-model.number="item.opening_qty"
              type="number"
              inputmode="numeric"
              min="0"
              :aria-label="`Jumlah stok ${item.product_name}`"
              class="w-14 h-8 text-center text-h3 font-semibold tabular-nums bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              @input="clampQty(item)"
            />

            <button
              @click="item.opening_qty++"
              class="w-8 h-8 flex items-center justify-center rounded-lg border border-input text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              :aria-label="`Tambah stok ${item.product_name}`"
            >
              <Plus class="w-3.5 h-3.5" :stroke-width="2" />
            </button>
          </div>
        </div>
      </div>

      <!-- Summary chip -->
      <div v-if="totalItems > 0" class="flex items-center justify-between bg-primary/8 rounded-xl px-4 py-3 border border-primary/20">
        <span class="text-body text-foreground font-medium">Total stok dibuka</span>
        <span class="text-h3 font-bold tabular-nums text-primary">{{ totalItems }} pcs</span>
      </div>

      <!-- Error -->
      <p v-if="store.error" class="text-small text-destructive">{{ store.error }}</p>

      <!-- Desktop save button -->
      <div class="hidden md:block">
        <button
          @click="save"
          :disabled="!canSave || store.loading"
          class="w-full h-12 rounded-lg font-medium text-body transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          :class="canSave
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'bg-muted text-muted-foreground cursor-not-allowed'"
        >
          <Loader2 v-if="store.loading" class="w-4 h-4 animate-spin" />
          <template v-else>
            <Check class="w-4 h-4" :stroke-width="2.5" />
            Buka Stok Hari Ini
          </template>
        </button>
      </div>

    </div>

    <!-- Mobile fixed save bar -->
    <div
      class="md:hidden fixed bottom-16 left-0 right-0 z-20 bg-surface border-t border-border px-4 pt-3"
      style="padding-bottom: max(0.75rem, env(safe-area-inset-bottom, 0.75rem))"
    >
      <!-- Preview -->
      <div
        v-if="totalItems > 0"
        class="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2 mb-2.5"
      >
        <p class="text-small text-muted-foreground">
          {{ nonZeroCount }} menu · {{ formattedDate }}
        </p>
        <p class="text-body font-semibold tabular-nums text-primary">
          {{ totalItems }} pcs
        </p>
      </div>
      <button
        @click="save"
        :disabled="!canSave || store.loading"
        class="w-full h-12 rounded-lg font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-colors"
        :class="canSave
          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
          : 'bg-muted text-muted-foreground cursor-not-allowed'"
      >
        <Loader2 v-if="store.loading" class="w-4 h-4 animate-spin" />
        <template v-else>
          <Check class="w-4 h-4" :stroke-width="2.5" />
          {{ store.loading ? 'Menyimpan...' : 'Buka Stok Hari Ini' }}
        </template>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'permission'],
  permissions: ['inventory.create'],
})

import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Minus, Plus, Check, Loader2, Package } from '@lucide/vue'
import { useDailyStockStore, type ProductForStock } from '~/stores/dailyStock'

const router = useRouter()
const store = useDailyStockStore()

interface StockItem {
  product_id: string
  product_name: string
  price: number | null
  image_url: string | null
  current_stock: number
  opening_qty: number
}

const items = ref<StockItem[]>([])

function formatCurrency(value: number | null): string {
  if (!value) return ''
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value)
}

const formattedDate = computed(() =>
  new Date(store.today ?? new Date()).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
)

const totalItems = computed(() => items.value.reduce((sum, i) => sum + (i.opening_qty || 0), 0))
const nonZeroCount = computed(() => items.value.filter(i => i.opening_qty > 0).length)
const canSave = computed(() => totalItems.value > 0)

function decrease(item: StockItem) {
  if (item.opening_qty > 0) item.opening_qty--
}

function clampQty(item: StockItem) {
  if (!item.opening_qty || item.opening_qty < 0) item.opening_qty = 0
  item.opening_qty = Math.floor(item.opening_qty)
}

async function save() {
  if (!canSave.value) return
  try {
    await store.openDay(items.value.map(i => ({
      product_id: i.product_id,
      product_name: i.product_name,
      opening_qty: i.opening_qty,
    })))
    router.push('/inventory')
  } catch {
    // error shown via store.error
  }
}

onMounted(async () => {
  await store.fetchProducts()
  items.value = store.products.map((p: ProductForStock) => ({
    product_id: p.id,
    product_name: p.name,
    price: p.price,
    image_url: p.image_url,
    current_stock: p.current_stock,
    opening_qty: 0,
  }))
})
</script>
