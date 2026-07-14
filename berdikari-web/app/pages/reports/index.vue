<template>
  <div class="p-4 md:p-6 max-w-4xl mx-auto space-y-5">
    <!-- Page Header -->
    <div class="flex items-start justify-between gap-3 flex-wrap">
      <div>
        <p class="text-small text-muted-foreground">{{ today }}</p>
        <h1 class="text-h1 text-foreground mt-0.5">Laporan</h1>
      </div>
      <div class="flex items-center gap-2">
        <FilterSheet
          v-model="period"
          title="Pilih periode laporan"
          trigger-label="Periode"
          :options="periodOptions"
          default-value="7"
        />
        <button
          v-if="auth.hasPermission('report.export') && !loading"
          @click="exportCsv"
          class="h-9 px-3 rounded-full bg-secondary text-secondary-foreground text-small font-medium hover:bg-secondary/70 transition-colors flex items-center gap-1.5"
          aria-label="Unduh laporan CSV"
        >
          <Download class="w-3.5 h-3.5" :stroke-width="1.75" />
          Unduh CSV
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div v-for="i in 4" :key="i" class="skeleton h-24 rounded-xl" />
      </div>
      <div class="skeleton h-48 rounded-xl" />
    </div>

    <template v-else>
      <!-- Summary KPIs -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          v-for="kpi in kpiCards" :key="kpi.label"
          class="bg-surface rounded-xl border border-border p-4 space-y-1 shadow-elevation-1"
        >
          <div class="flex items-center justify-between">
            <p class="text-caption text-muted-foreground">{{ kpi.label }}</p>
            <component :is="kpi.icon" class="w-4 h-4 text-muted-foreground" :stroke-width="1.5" />
          </div>
          <p class="text-h2 text-foreground font-bold tabular-nums">{{ kpi.value }}</p>
          <p class="text-small text-muted-foreground">{{ kpi.hint }}</p>
        </div>
      </div>

      <!-- Insights -->
      <div v-if="insights.length > 0" class="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
        <p class="text-h3 text-foreground flex items-center gap-2">
          <Lightbulb class="w-4 h-4 text-primary" :stroke-width="1.75" />
          Sorotan Bisnis
        </p>
        <ul class="space-y-1">
          <li v-for="insight in insights" :key="insight" class="text-body text-muted-foreground flex gap-2">
            <span class="text-primary flex-shrink-0" aria-hidden="true">•</span>
            <span>{{ insight }}</span>
          </li>
        </ul>
      </div>

      <!-- Sales: daily + top products -->
      <div v-if="sales" class="space-y-3">
        <h2 class="text-h3 text-foreground">Penjualan</h2>

        <!-- Daily bars -->
        <div class="bg-surface rounded-xl border border-border p-4 shadow-elevation-1">
          <div v-if="sales.daily.length === 0" class="py-6 text-center text-body text-muted-foreground">
            Belum ada penjualan pada periode ini
          </div>
          <div v-else class="flex items-end gap-1.5 h-32" role="img" :aria-label="`Grafik penjualan harian, tertinggi ${formatRupiah(maxDaily)}`">
            <div
              v-for="day in sales.daily"
              :key="day.date"
              class="flex-1 flex flex-col items-center gap-1 min-w-0"
              :title="`${day.date}: ${formatRupiah(day.total)} (${day.orders} transaksi)`"
            >
              <div
                class="w-full rounded-t-md bg-primary/80 hover:bg-primary transition-colors"
                :style="{ height: `${maxDaily > 0 ? Math.max(4, (day.total / maxDaily) * 100) : 4}%` }"
              />
              <span class="text-caption text-muted-foreground truncate w-full text-center">{{ shortDate(day.date) }}</span>
            </div>
          </div>
        </div>

        <!-- Top products -->
        <div class="bg-surface rounded-xl border border-border overflow-hidden shadow-elevation-1">
          <p class="text-small font-medium text-muted-foreground px-4 pt-3 pb-1">Produk Terlaris</p>
          <div v-if="sales.top_products.length === 0" class="px-4 pb-4 text-body text-muted-foreground">Belum ada data</div>
          <div v-else class="divide-y divide-border">
            <div
              v-for="(product, index) in sales.top_products.slice(0, 5)"
              :key="product.product_id"
              class="flex items-center justify-between px-4 py-2.5"
            >
              <div class="flex items-center gap-3 min-w-0">
                <span class="w-6 h-6 rounded-full bg-primary/10 text-primary text-caption font-semibold flex items-center justify-center flex-shrink-0">{{ index + 1 }}</span>
                <p class="text-body text-foreground truncate">{{ product.name ?? 'Produk terhapus' }}</p>
              </div>
              <div class="text-right flex-shrink-0 ml-3">
                <p class="text-body text-foreground font-medium tabular-nums">{{ product.quantity }}x</p>
                <p class="text-small text-muted-foreground tabular-nums">{{ formatRupiah(product.subtotal) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Finance -->
      <div v-if="finance" class="space-y-3">
        <h2 class="text-h3 text-foreground">Keuangan</h2>
        <div class="grid sm:grid-cols-2 gap-3">
          <div class="bg-surface rounded-xl border border-border p-4 shadow-elevation-1">
            <p class="text-small font-medium text-muted-foreground mb-2">Pemasukan per Kategori</p>
            <div v-if="Object.keys(finance.income_by_category).length === 0" class="text-body text-muted-foreground">Belum ada data</div>
            <div v-else class="space-y-1.5">
              <div v-for="(amount, category) in finance.income_by_category" :key="category" class="flex items-center justify-between">
                <span class="text-body text-foreground">{{ category }}</span>
                <span class="text-body text-success font-medium tabular-nums">{{ formatRupiah(amount) }}</span>
              </div>
            </div>
          </div>
          <div class="bg-surface rounded-xl border border-border p-4 shadow-elevation-1">
            <p class="text-small font-medium text-muted-foreground mb-2">Pengeluaran per Kategori</p>
            <div v-if="Object.keys(finance.expense_by_category).length === 0" class="text-body text-muted-foreground">Belum ada data</div>
            <div v-else class="space-y-1.5">
              <div v-for="(amount, category) in finance.expense_by_category" :key="category" class="flex items-center justify-between">
                <span class="text-body text-foreground">{{ category }}</span>
                <span class="text-body text-destructive font-medium tabular-nums">{{ formatRupiah(amount) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Inventory -->
      <div v-if="lowStock !== null" class="space-y-3">
        <h2 class="text-h3 text-foreground">Stok</h2>
        <div class="bg-surface rounded-xl border border-border overflow-hidden shadow-elevation-1">
          <p class="text-small font-medium text-muted-foreground px-4 pt-3 pb-1">Stok Menipis</p>
          <div v-if="lowStock.length === 0" class="px-4 pb-4 text-body text-success flex items-center gap-2">
            <CheckCircle2 class="w-4 h-4" :stroke-width="1.75" />
            Semua stok di atas ambang batas
          </div>
          <div v-else class="divide-y divide-border">
            <div
              v-for="item in lowStock"
              :key="item.id ?? item.product_id"
              class="flex items-center justify-between px-4 py-2.5"
            >
              <p class="text-body text-foreground truncate">{{ item.product_name ?? item.product?.name ?? item.name ?? '—' }}</p>
              <span class="text-body text-warning font-medium tabular-nums flex-shrink-0 ml-3">{{ item.quantity }} tersisa</span>
            </div>
          </div>
        </div>
      </div>

      <!-- HR -->
      <div v-if="hrSummary" class="space-y-3">
        <h2 class="text-h3 text-foreground">Karyawan</h2>
        <div class="grid grid-cols-3 gap-3">
          <div class="bg-surface rounded-xl border border-border p-4 shadow-elevation-1 text-center">
            <p class="text-h2 text-foreground font-bold">{{ hrSummary.active_employees }}</p>
            <p class="text-caption text-muted-foreground mt-1">Karyawan aktif</p>
          </div>
          <div class="bg-surface rounded-xl border border-border p-4 shadow-elevation-1 text-center">
            <p class="text-h2 text-foreground font-bold">{{ hrSummary.present_today }}</p>
            <p class="text-caption text-muted-foreground mt-1">Hadir hari ini</p>
          </div>
          <div class="bg-surface rounded-xl border border-border p-4 shadow-elevation-1 text-center">
            <p class="text-h2 text-foreground font-bold">{{ hrSummary.pending_leaves }}</p>
            <p class="text-caption text-muted-foreground mt-1">Cuti menunggu</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'permission'],
  permissions: ['report.view'],
  title: 'Laporan',
})

import { ref, computed, onMounted, watch } from 'vue'
import type { Component } from 'vue'
import {
  CheckCircle2, Download, Lightbulb, Receipt, ShoppingCart, TrendingUp, Wallet,
} from '@lucide/vue'
import FilterSheet from '~/components/FilterSheet.vue'
import { useAuthStore } from '~/stores/auth'
import { formatRupiah, downloadCsv } from '~/utils'
import type { HrSummary } from '~/stores/hr'

useHead({ title: 'Laporan — Berdikari' })

interface SalesSummary {
  from: string
  to: string
  order_count: number
  gross_sales: number
  paid_amount: number
  average_ticket: number
  daily: { date: string, total: number, orders: number }[]
  top_products: { product_id: string, name: string | null, quantity: number, subtotal: number }[]
  payment_methods: Record<string, number>
}

interface FinanceSummary {
  total_income: number
  total_expense: number
  net: number
  income_by_category: Record<string, number>
  expense_by_category: Record<string, number>
}

const auth = useAuthStore()
const api = useApi()

const today = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())

const period = ref('7')
const periodOptions = [
  { value: '1', label: 'Hari ini' },
  { value: '7', label: '7 hari terakhir' },
  { value: '30', label: '30 hari terakhir' },
  { value: '90', label: '3 bulan terakhir' },
]

const loading = ref(true)
const sales = ref<SalesSummary | null>(null)
const finance = ref<FinanceSummary | null>(null)
const lowStock = ref<any[] | null>(null)
const hrSummary = ref<HrSummary | null>(null)

const range = computed(() => {
  const to = new Date()
  const from = new Date(Date.now() - (Number(period.value) - 1) * 86_400_000)
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) }
})

const maxDaily = computed(() => Math.max(0, ...(sales.value?.daily.map(d => d.total) ?? [0])))

const kpiCards = computed(() => {
  const cards: { label: string, value: string, hint: string, icon: Component }[] = []
  if (sales.value) {
    cards.push(
      { label: 'Total Penjualan', value: formatRupiah(sales.value.gross_sales), hint: `${sales.value.order_count} transaksi`, icon: TrendingUp },
      { label: 'Rata-rata Nota', value: formatRupiah(sales.value.average_ticket), hint: 'per transaksi', icon: Receipt },
    )
  }
  if (finance.value) {
    cards.push(
      { label: 'Laba / Rugi Kas', value: formatRupiah(finance.value.net), hint: `Keluar ${formatRupiah(finance.value.total_expense)}`, icon: Wallet },
    )
  }
  if (sales.value) {
    const methods = Object.entries(sales.value.payment_methods)
    const top = methods.sort((a, b) => b[1] - a[1])[0]
    cards.push({
      label: 'Metode Terbanyak',
      value: top ? methodLabel(top[0]) : '—',
      hint: top ? formatRupiah(top[1]) : 'belum ada pembayaran',
      icon: ShoppingCart,
    })
  }
  return cards
})

/** Plain-language takeaways generated from the aggregates. */
const insights = computed(() => {
  const list: string[] = []
  if (sales.value) {
    const topProduct = sales.value.top_products[0]
    if (topProduct?.name) list.push(`Produk terlaris: ${topProduct.name} (${topProduct.quantity} terjual).`)
    const best = [...sales.value.daily].sort((a, b) => b.total - a.total)[0]
    if (best && sales.value.daily.length > 1) list.push(`Penjualan tertinggi pada ${longDate(best.date)} sebesar ${formatRupiah(best.total)}.`)
    if (sales.value.gross_sales > sales.value.paid_amount) {
      list.push(`Ada piutang ${formatRupiah(sales.value.gross_sales - sales.value.paid_amount)} yang belum dibayar pelanggan.`)
    }
  }
  if (finance.value && finance.value.net < 0) {
    list.push(`Pengeluaran melebihi pemasukan sebesar ${formatRupiah(Math.abs(finance.value.net))} pada periode ini.`)
  }
  if (lowStock.value && lowStock.value.length > 0) {
    list.push(`${lowStock.value.length} produk hampir habis — segera isi ulang stok.`)
  }
  return list
})

function methodLabel(method: string): string {
  const labels: Record<string, string> = { cash: 'Tunai', qris: 'QRIS', transfer: 'Transfer', other: 'Lainnya' }
  return labels[method] ?? method
}

function shortDate(value: string): string {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'numeric' }).format(new Date(value))
}

function longDate(value: string): string {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long' }).format(new Date(value))
}

async function load() {
  loading.value = true
  const { from, to } = range.value
  const jobs: Promise<void>[] = []

  jobs.push((async () => {
    try {
      const res = await api<{ data: SalesSummary }>('/v1/sales/summary', { query: { from, to } })
      sales.value = res.data
    } catch { sales.value = null }
  })())

  if (auth.hasPermission('finance.view')) {
    jobs.push((async () => {
      try {
        const res = await api<{ data: FinanceSummary }>('/v1/finance/summary', { query: { from, to } })
        finance.value = res.data
      } catch { finance.value = null }
    })())
  }

  if (auth.hasPermission('inventory.view')) {
    jobs.push((async () => {
      try {
        const res = await api<{ data: any[] }>('/v1/inventory/low-stock')
        lowStock.value = res.data
      } catch { lowStock.value = null }
    })())
  }

  if (auth.hasPermission('employee.view')) {
    jobs.push((async () => {
      try {
        const res = await api<{ data: HrSummary }>('/v1/hr/summary')
        hrSummary.value = res.data
      } catch { hrSummary.value = null }
    })())
  }

  await Promise.all(jobs)
  loading.value = false
}

function exportCsv() {
  const { from, to } = range.value
  const rows: (string | number | null)[][] = []

  if (sales.value) {
    rows.push(['PENJUALAN HARIAN', '', ''])
    rows.push(['Tanggal', 'Total', 'Transaksi'])
    for (const day of sales.value.daily) rows.push([day.date, day.total, day.orders])
    rows.push(['', '', ''])
    rows.push(['PRODUK TERLARIS', '', ''])
    rows.push(['Produk', 'Jumlah', 'Subtotal'])
    for (const product of sales.value.top_products) rows.push([product.name ?? '-', product.quantity, product.subtotal])
    rows.push(['', '', ''])
  }
  if (finance.value) {
    rows.push(['KEUANGAN', '', ''])
    rows.push(['Total Pemasukan', finance.value.total_income, ''])
    rows.push(['Total Pengeluaran', finance.value.total_expense, ''])
    rows.push(['Selisih (Laba/Rugi Kas)', finance.value.net, ''])
  }

  downloadCsv(`laporan-berdikari-${from}-sd-${to}`, ['Keterangan', 'Nilai', 'Info'], rows)
}

watch(period, load)
onMounted(load)
</script>
