<template>
  <div>
    <div class="p-4 md:p-6 max-w-4xl mx-auto space-y-5">

      <!-- Header -->
      <div class="flex items-start justify-between pt-1">
        <div>
          <p class="text-small text-muted-foreground">{{ formattedDate }}</p>
          <h1 class="text-h1 text-foreground mt-0.5">Keuangan</h1>
        </div>
        <NuxtLink to="/finance/new" class="hidden sm:block">
          <button
            class="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-body font-medium min-h-[44px] hover:bg-primary/90 active:bg-primary/80 transition-colors"
          >
            <Plus class="w-4 h-4" :stroke-width="1.75" />
            Tambah Baru
          </button>
        </NuxtLink>
      </div>

      <!-- Filters -->
      <div class="flex items-center gap-2 overflow-x-auto pb-0.5 -mx-1 px-1 scrollbar-none">
        <FilterSheet
          v-model="activePeriod"
          title="Pilih tanggal transaksi"
          trigger-label="Tanggal"
          :options="periodOptions"
          default-value="semua"
        >
          <template #extra="{ staged }">
            <div v-if="staged === 'kustom'" class="flex items-center gap-2 px-5 pb-4">
              <Input type="date" v-model="customFrom" class="flex-1" />
              <span class="flex-shrink-0 text-small text-muted-foreground">s/d</span>
              <Input type="date" v-model="customTo" class="flex-1" />
            </div>
          </template>
        </FilterSheet>

        <FilterSheet
          v-model="activeCategory"
          title="Pilih kategori"
          trigger-label="Kategori"
          :options="categoryOptions"
          default-value="Semua"
        />

        <FilterSheet
          v-if="businessOptions.length > 1"
          v-model="activeBusiness"
          title="Pilih bisnis"
          trigger-label="Bisnis"
          :options="businessOptions"
          default-value="Semua"
        />
      </div>

      <!-- Summary cards -->
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-success rounded-xl p-4 space-y-0.5 shadow-elevation-1">
            <p class="text-success-foreground/70 text-small">Pemasukan</p>
            <p class="text-h1 text-success-foreground tabular-nums font-bold leading-tight">
              Rp {{ filteredTotalIncome.toLocaleString('id-ID') }}
            </p>
            <p class="text-success-foreground/70 text-small">
              {{ filteredIncomeCount }} transaksi
            </p>
          </div>
          <div class="bg-destructive rounded-xl p-4 space-y-0.5 shadow-elevation-1">
            <p class="text-destructive-foreground/70 text-small">Pengeluaran</p>
            <p class="text-h1 text-destructive-foreground tabular-nums font-bold leading-tight">
              Rp {{ filteredTotalExpenses.toLocaleString('id-ID') }}
            </p>
            <p class="text-destructive-foreground/70 text-small">
              {{ filteredExpenseCount }} pengeluaran
            </p>
          </div>
        </div>

        <!-- Balance card -->
        <div class="bg-surface rounded-xl border border-border p-4 shadow-elevation-1">
          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <p class="text-small text-muted-foreground">Saldo Bersih · {{ activePeriodLabel }}</p>
              <p
                class="text-h1 tabular-nums font-bold leading-tight"
                :class="filteredBalance >= 0 ? 'text-success' : 'text-destructive'"
              >
                {{ filteredBalance >= 0 ? '+' : '−' }}Rp {{ Math.abs(filteredBalance).toLocaleString('id-ID') }}
              </p>
            </div>
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              :class="filteredBalance >= 0 ? 'bg-success/10' : 'bg-destructive/10'"
            >
              <TrendingUp v-if="filteredBalance >= 0" class="w-5 h-5 text-success" :stroke-width="1.75" />
              <TrendingDown v-else class="w-5 h-5 text-destructive" :stroke-width="1.75" />
            </div>
          </div>
        </div>
      </div>

      <!-- Business balances -->
      <div>
        <h2 class="text-h3 text-foreground mb-3">Rincian Kategori</h2>
        <div v-if="categoryBreakdown.length === 0" class="text-body text-muted-foreground">
          Belum ada rincian untuk filter ini.
        </div>
        <div v-else class="flex gap-3 overflow-x-auto pb-1 -mx-4 md:mx-0 px-4 md:px-0 scrollbar-none">
          <div
            v-for="c in categoryBreakdown"
            :key="c.category"
            class="flex-shrink-0 w-40 bg-surface rounded-xl border border-border p-3.5 shadow-elevation-1"
          >
            <p class="text-caption text-muted-foreground truncate">{{ c.category }}</p>
            <p class="text-h2 font-bold tabular-nums mt-1" :class="c.type === 'income' ? 'text-success' : 'text-destructive'">
              {{ c.type === 'income' ? '+' : '−' }}{{ formatRupiah(c.total) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Transaction history -->
      <div>
        <h2 class="text-h3 text-foreground mb-3">Riwayat Transaksi</h2>

        <!-- Empty state -->
        <div
          v-if="filteredTransactions.length === 0"
          class="bg-surface rounded-xl border border-border p-10 flex flex-col items-center text-center gap-3"
        >
          <div class="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Wallet class="w-6 h-6 text-muted-foreground" :stroke-width="1.5" />
          </div>
          <div>
            <p class="text-h3 text-foreground">Belum ada transaksi</p>
            <p class="text-body text-muted-foreground mt-1">Tidak ada transaksi untuk filter ini</p>
          </div>
          <NuxtLink to="/finance/new">
            <button class="text-body text-primary font-medium min-h-[44px] flex items-center hover:text-primary/80 transition-colors">
              Catat sekarang
            </button>
          </NuxtLink>
        </div>

        <!-- Transaction list -->
        <div
          v-else
          class="bg-surface rounded-xl border border-border overflow-hidden shadow-elevation-1 divide-y divide-border"
        >
          <div
            v-for="tx in filteredTransactions"
            :key="tx.key"
            class="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                :class="tx.type === 'income' ? 'bg-success/10' : 'bg-destructive/10'"
              >
                <ArrowUpRight v-if="tx.type === 'income'" class="w-4 h-4 text-success" :stroke-width="1.75" />
                <ArrowDownLeft v-else class="w-4 h-4 text-destructive" :stroke-width="1.75" />
              </div>
              <div class="min-w-0">
                <p class="text-body text-foreground font-medium truncate">{{ tx.category }}</p>
                <p class="text-small text-muted-foreground truncate">
                  <template v-if="tx.businessName">
                    <span class="font-medium text-foreground/70">{{ tx.businessName }}</span>
                    <span class="mx-1">·</span>
                  </template>
                  <span v-if="tx.isAuto" class="text-primary">Otomatis · POS</span>
                  <template v-if="tx.isAuto && tx.notes"> · </template>
                  <template v-if="tx.notes">{{ tx.notes }}</template>
                  <template v-if="!tx.isAuto && !tx.notes">Manual</template>
                </p>
              </div>
            </div>
            <div class="flex flex-col items-end flex-shrink-0 ml-4">
              <p
                class="text-body font-semibold tabular-nums"
                :class="tx.type === 'income' ? 'text-success' : 'text-destructive'"
              >
                {{ tx.type === 'income' ? '+' : '−' }}Rp {{ tx.amount.toLocaleString('id-ID') }}
              </p>
              <p class="text-small text-muted-foreground tabular-nums">{{ formatTime(new Date(tx.createdAt)) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile bottom spacer for FAB -->
      <div class="h-6 sm:hidden" aria-hidden="true" />

    </div>

    <!-- Mobile FAB -->
    <div class="sm:hidden fixed bottom-20 right-4 z-10">
      <NuxtLink to="/finance/new">
        <button
          class="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-elevation-3 flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Catat transaksi baru"
        >
          <Plus class="w-6 h-6" :stroke-width="2" />
        </button>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'permission'],
  permissions: ['finance.view'],
})

import { ref, computed, watch, onMounted } from 'vue'
import { Plus, Wallet, ArrowDownLeft, ArrowUpRight, TrendingUp, TrendingDown } from '@lucide/vue'
import { useFinanceStore } from '~/stores/finance'
import { formatRupiah } from '~/utils'
import { Input } from '@/components/ui/input'
import FilterSheet from '@/components/FilterSheet.vue'

const financeStore = useFinanceStore()

onMounted(() => {
  financeStore.fetchEntries()
  financeStore.fetchSummary()
  financeStore.fetchBusinesses()
})

const formattedDate = computed(() =>
  new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()),
)

// ─── Period filter ────────────────────────────────────────────────────────────
const periodTabs = [
  { label: 'Semua',    value: 'semua' },
  { label: 'Harian',   value: 'harian' },
  { label: 'Mingguan', value: 'mingguan' },
  { label: 'Bulanan',  value: 'bulanan' },
  { label: 'Tahunan',  value: 'tahunan' },
  { label: 'Kustom',   value: 'kustom' },
]
const activePeriod = ref('semua')
const customFrom   = ref('')
const customTo     = ref('')

function periodRangeLabel(value: string): string | undefined {
  const now      = new Date()
  const fmtLong  = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const fmtShort = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  switch (value) {
    case 'harian':
      return fmtLong.format(now)
    case 'mingguan': {
      const weekStart = new Date(now)
      const day = now.getDay()
      weekStart.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
      return `${fmtShort.format(weekStart)} – ${fmtShort.format(now)}`
    }
    case 'bulanan':
      return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(now)
    case 'tahunan':
      return String(now.getFullYear())
    case 'kustom':
      return 'Atur rentang tanggal sendiri'
    default:
      return undefined
  }
}

const periodOptions = computed(() =>
  periodTabs.map(p => ({ ...p, subtitle: periodRangeLabel(p.value) })),
)

function isInPeriod(date: Date): boolean {
  const now = new Date()
  switch (activePeriod.value) {
    case 'harian':
      return date.toDateString() === now.toDateString()
    case 'mingguan': {
      const weekStart = new Date(now)
      const day = now.getDay()
      weekStart.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
      weekStart.setHours(0, 0, 0, 0)
      return date >= weekStart
    }
    case 'bulanan':
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    case 'tahunan':
      return date.getFullYear() === now.getFullYear()
    case 'kustom': {
      const from = customFrom.value ? new Date(customFrom.value) : null
      const to   = customTo.value   ? new Date(customTo.value + 'T23:59:59') : null
      if (from && date < from) return false
      if (to   && date > to)   return false
      return true
    }
    default:
      return true
  }
}

// ─── Combined transactions ────────────────────────────────────────────────────
interface Transaction {
  key: string
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  isAuto: boolean
  notes: string
  createdAt: Date
  businessName: string | null
}

const allTransactions = computed<Transaction[]>(() =>
  financeStore.entries.map(e => ({
    key:          e.id,
    id:           e.id,
    type:         e.type,
    amount:       Number(e.amount),
    category:     e.category,
    isAuto:       !!e.source_type && e.source_type !== 'manual',
    notes:        e.note ?? '',
    createdAt:    new Date(e.occurred_at),
    businessName: e.business_name ?? null,
  })).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
)

const periodFilteredTransactions = computed<Transaction[]>(() =>
  allTransactions.value.filter(t => isInPeriod(new Date(t.createdAt))),
)

// ─── Category filter ──────────────────────────────────────────────────────────
const activeCategory = ref('Semua')

watch(activePeriod, () => {
  activeCategory.value = 'Semua'
})

const availableCategories = computed(() => {
  const cats = new Set(periodFilteredTransactions.value.map(t => t.category))
  return ['Semua', ...Array.from(cats).sort()]
})

const categoryOptions = computed(() =>
  availableCategories.value.map(cat => ({ value: cat, label: cat })),
)

// ─── Business filter ──────────────────────────────────────────────────────────
const activeBusiness = ref('Semua')

const availableBusinessNames = computed(() => {
  const names = new Set(
    periodFilteredTransactions.value.map(t => t.businessName).filter(Boolean) as string[],
  )
  return ['Semua', ...Array.from(names).sort()]
})

const businessOptions = computed(() =>
  availableBusinessNames.value.map(name => ({ value: name, label: name })),
)

const filteredTransactions = computed<Transaction[]>(() => {
  let result = periodFilteredTransactions.value
  if (activeCategory.value !== 'Semua') {
    result = result.filter(t => t.category === activeCategory.value)
  }
  if (activeBusiness.value !== 'Semua') {
    result = result.filter(t => t.businessName === activeBusiness.value)
  }
  return result
})

// ─── Filtered summaries ─────────────────────────────────────────────────────
const filteredTotalIncome = computed(() =>
  filteredTransactions.value.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
)

const filteredTotalExpenses = computed(() =>
  filteredTransactions.value.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
)

const filteredBalance = computed(() => filteredTotalIncome.value - filteredTotalExpenses.value)

const filteredIncomeCount = computed(() =>
  filteredTransactions.value.filter(t => t.type === 'income').length,
)

const filteredExpenseCount = computed(() =>
  filteredTransactions.value.filter(t => t.type === 'expense').length,
)

const activePeriodLabel = computed(() =>
  periodTabs.find(p => p.value === activePeriod.value)?.label ?? 'Semua',
)

// ─── Category breakdown (from filtered transactions) ─────────────────────────
const categoryBreakdown = computed(() => {
  const map = new Map<string, { category: string; type: 'income' | 'expense'; total: number }>()
  for (const t of filteredTransactions.value) {
    const key = `${t.type}:${t.category}`
    const existing = map.get(key)
    if (existing) existing.total += t.amount
    else map.set(key, { category: t.category, type: t.type, total: t.amount })
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total)
})

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(date: Date): string {
  const today = new Date().toDateString()
  if (date.toDateString() === today) {
    return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(date)
  }
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(date)
}
</script>
