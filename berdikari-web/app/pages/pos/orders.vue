<template>
  <div class="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
    <!-- Header -->
    <div class="flex items-start justify-between pt-1">
      <div>
        <p class="text-small text-muted-foreground">{{ formattedDate }}</p>
        <h1 class="text-h1 text-foreground mt-0.5">Pesanan</h1>
      </div>
      <NuxtLink to="/pos">
        <button class="flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-body font-medium hover:bg-primary/90 transition-colors">
          <Plus class="w-4 h-4" :stroke-width="1.75" />
          Kasir
        </button>
      </NuxtLink>
    </div>

    <!-- Filter tabs -->
    <div class="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
      <button
        v-for="t in tabs"
        :key="t.value"
        @click="activeTab = t.value; load()"
        class="flex-shrink-0 h-8 px-3 rounded-full text-small font-medium transition-colors"
        :class="activeTab === t.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'"
      >{{ t.label }}</button>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="space-y-2">
      <div v-for="i in 5" :key="i" class="skeleton h-20 rounded-xl" />
    </div>

    <!-- Empty -->
    <div v-else-if="store.orders.length === 0" class="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div class="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
        <ReceiptText class="w-6 h-6 text-muted-foreground" :stroke-width="1.5" />
      </div>
      <p class="text-h3 text-foreground">Tidak ada pesanan</p>
      <p class="text-body text-muted-foreground">Belum ada pesanan untuk filter ini</p>
    </div>

    <!-- Order list -->
    <div v-else class="space-y-2">
      <button
        v-for="o in store.orders"
        :key="o.id"
        @click="openDetail(o)"
        class="w-full text-left bg-surface rounded-xl border border-border p-3 hover:border-primary/40 transition-colors"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <p class="text-h3 text-foreground truncate">{{ o.order_no ?? 'Pesanan' }}</p>
              <span class="text-xs px-1.5 py-0.5 rounded-full font-medium" :class="statusClass(o)">{{ statusLabel(o) }}</span>
            </div>
            <p class="text-small text-muted-foreground mt-0.5">
              {{ o.items.length }} item · {{ formatTime(o.created_at) }}
              <template v-if="o.customer_name"> · {{ o.customer_name }}</template>
            </p>
          </div>
          <div class="text-right flex-shrink-0">
            <p class="text-h3 text-foreground tabular-nums">{{ formatRupiah(o.total_amount) }}</p>
            <p v-if="o.balance_due > 0" class="text-small text-warning tabular-nums">Sisa {{ formatRupiah(o.balance_due) }}</p>
          </div>
        </div>
      </button>
    </div>

    <!-- Detail / action sheet -->
    <Transition name="overlay">
      <div v-if="detail" class="fixed inset-0 bg-foreground/40 z-40 backdrop-blur-[2px]" @click="detail = null" aria-hidden="true" />
    </Transition>
    <Transition name="sheet">
      <div
        v-if="detail"
        class="fixed bottom-0 left-0 right-0 md:left-auto md:right-6 md:bottom-6 md:w-[26rem] md:rounded-2xl z-50 bg-surface rounded-t-2xl shadow-elevation-3 flex flex-col max-h-[92svh]"
        role="dialog" aria-modal="true"
      >
        <div class="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <div>
            <h2 class="text-h2 text-foreground">{{ detail.order_no ?? 'Pesanan' }}</h2>
            <span class="text-xs px-1.5 py-0.5 rounded-full font-medium" :class="statusClass(detail)">{{ statusLabel(detail) }}</span>
          </div>
          <button @click="detail = null" class="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted" aria-label="Tutup">
            <X class="w-4 h-4" :stroke-width="1.75" />
          </button>
        </div>

        <div class="p-4 space-y-3 overflow-y-auto">
          <!-- Items -->
          <div class="space-y-1.5">
            <div v-for="it in detail.items" :key="it.id" class="flex justify-between text-body">
              <span class="text-foreground">{{ it.quantity }}× <span class="text-muted-foreground">{{ productName(it.product_id) }}</span></span>
              <span class="tabular-nums text-foreground">{{ formatRupiah(it.subtotal) }}</span>
            </div>
          </div>
          <div class="h-px bg-border" />
          <div class="space-y-1 text-body">
            <div class="flex justify-between"><span class="text-muted-foreground">Total</span><span class="tabular-nums font-medium">{{ formatRupiah(detail.total_amount) }}</span></div>
            <div class="flex justify-between"><span class="text-muted-foreground">Dibayar</span><span class="tabular-nums">{{ formatRupiah(detail.paid_amount) }}</span></div>
            <div v-if="detail.balance_due > 0" class="flex justify-between"><span class="text-muted-foreground">Sisa (Piutang)</span><span class="tabular-nums text-warning font-medium">{{ formatRupiah(detail.balance_due) }}</span></div>
            <div v-if="Number(detail.change_amount) > 0" class="flex justify-between"><span class="text-muted-foreground">Kembalian</span><span class="tabular-nums text-success">{{ formatRupiah(detail.change_amount) }}</span></div>
          </div>

          <!-- Payment input (for settle/complete) -->
          <div v-if="showPayInput" class="pt-1">
            <label class="text-small text-muted-foreground">Uang diterima</label>
            <input :value="payDisplay" @input="onPayInput" type="text" inputmode="numeric"
              class="mt-1 w-full h-11 px-3 bg-background border border-input rounded-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary" placeholder="0" />
          </div>
          <p v-if="actionError" class="text-small text-destructive">{{ actionError }}</p>
        </div>

        <!-- Actions -->
        <div class="p-4 border-t border-border flex-shrink-0 space-y-2">
          <!-- Held order: complete + cancel -->
          <template v-if="detail.status === 'open'">
            <button :disabled="busy" @click="doComplete" class="w-full h-12 rounded-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-60">
              <Loader2 v-if="busy" class="w-4 h-4 animate-spin" :stroke-width="2" /> Selesaikan &amp; Bayar
            </button>
            <button :disabled="busy" @click="doCancel" class="w-full h-11 rounded-lg font-medium text-small text-destructive hover:bg-destructive/10">Batalkan Pesanan</button>
          </template>

          <!-- Completed unpaid/partial: settle -->
          <template v-else-if="detail.status === 'completed' && detail.balance_due > 0">
            <button :disabled="busy" @click="doPay" class="w-full h-12 rounded-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-60">
              <Loader2 v-if="busy" class="w-4 h-4 animate-spin" :stroke-width="2" /> Terima Pembayaran
            </button>
          </template>

          <!-- Completed paid: refund -->
          <template v-else-if="detail.status === 'completed'">
            <button :disabled="busy" @click="doRefund" class="w-full h-12 rounded-lg font-medium text-destructive border border-destructive/40 hover:bg-destructive/10 flex items-center justify-center gap-2 disabled:opacity-60">
              <Loader2 v-if="busy" class="w-4 h-4 animate-spin" :stroke-width="2" /> Refund Pesanan
            </button>
          </template>

          <p v-else class="text-center text-small text-muted-foreground py-2">
            Pesanan {{ statusLabel(detail).toLowerCase() }}.
          </p>
        </div>
        <div style="height: env(safe-area-inset-bottom, 0px)" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'permission'],
  permissions: ['pos.view'],
})

import { ref, computed, onMounted } from 'vue'
import { Plus, X, Loader2, ReceiptText } from '@lucide/vue'
import { useOrdersStore, type Order } from '~/stores/orders'
import { useCatalogStore } from '~/stores/catalog'
import { formatRupiah } from '~/utils'

const store = useOrdersStore()
const catalog = useCatalogStore()

const formattedDate = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })

const tabs = [
  { label: 'Semua', value: 'all' },
  { label: 'Tertunda', value: 'open' },
  { label: 'Belum Lunas', value: 'unpaid' },
  { label: 'Selesai', value: 'paid' },
]
const activeTab = ref('all')

const detail = ref<Order | null>(null)
const payAmount = ref<number | null>(null)
const { display: payDisplay, onInput: onPayInput } = useRupiahInput(payAmount)
const busy = ref(false)
const actionError = ref<string | null>(null)

const showPayInput = computed(() =>
  !!detail.value && (detail.value.status === 'open' || (detail.value.status === 'completed' && detail.value.balance_due > 0)),
)

function load() {
  const f: Record<string, string> = {}
  if (activeTab.value === 'open') f.status = 'open'
  else if (activeTab.value === 'paid') { f.status = 'completed'; f.payment_status = 'paid' }
  else if (activeTab.value === 'unpaid') { f.status = 'completed' }
  store.fetchOrders(f).then(() => {
    if (activeTab.value === 'unpaid') {
      store.orders = store.orders.filter(o => o.balance_due > 0)
    }
  })
}

function productName(id: string): string {
  return catalog.products.find(p => p.id === id)?.name ?? 'Produk'
}

function statusLabel(o: Order): string {
  if (o.status === 'open') return 'Tertunda'
  if (o.status === 'cancelled') return 'Dibatalkan'
  if (o.status === 'refunded') return 'Direfund'
  if (o.payment_status === 'paid') return 'Lunas'
  if (o.payment_status === 'partial') return 'Sebagian'
  return 'Belum Lunas'
}

function statusClass(o: Order): string {
  if (o.status === 'open') return 'bg-muted text-muted-foreground'
  if (o.status === 'cancelled' || o.status === 'refunded') return 'bg-destructive/10 text-destructive'
  if (o.payment_status === 'paid') return 'bg-success/10 text-success'
  return 'bg-warning/15 text-warning'
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const today = new Date().toDateString()
  return d.toDateString() === today
    ? new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(d)
    : new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(d)
}

function openDetail(o: Order) {
  detail.value = o
  payAmount.value = o.balance_due || null
  actionError.value = null
}

async function run(fn: () => Promise<void>) {
  busy.value = true
  actionError.value = null
  try {
    await fn()
    detail.value = null
  } catch (e: any) {
    actionError.value = e?.data?.message ?? 'Terjadi kesalahan.'
  } finally {
    busy.value = false
  }
}

const doComplete = () => run(() => store.complete(detail.value!.id, payAmount.value ?? 0))
const doPay = () => run(() => store.pay(detail.value!.id, payAmount.value ?? 0))
const doCancel = () => run(() => store.cancel(detail.value!.id))
const doRefund = () => run(() => store.refund(detail.value!.id))

onMounted(() => {
  catalog.fetchProducts()
  load()
})
</script>
