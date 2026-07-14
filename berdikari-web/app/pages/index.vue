<template>
  <div class="p-4 md:p-6 max-w-4xl mx-auto space-y-5">
    <!-- Header -->
    <div class="flex items-start justify-between pt-1">
      <div>
        <p class="text-small text-muted-foreground">{{ formattedDate }}</p>
        <h1 class="text-h1 text-foreground mt-0.5">Selamat datang, {{ firstName }}</h1>
      </div>
      <div
        class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0"
        aria-hidden="true"
      >
        {{ initials }}
      </div>
    </div>

    <!-- KPI cards (permission-driven) -->
    <div v-if="visibleKpis.length > 0" class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <template v-if="loadingKpi">
        <div v-for="i in visibleKpis.length" :key="i" class="skeleton h-24 rounded-xl" />
      </template>
      <template v-else>
        <div
          v-for="kpi in visibleKpis" :key="kpi.label"
          class="bg-surface rounded-xl border border-border p-4 space-y-1 shadow-elevation-1"
        >
          <div class="flex items-center justify-between">
            <p class="text-caption text-muted-foreground">{{ kpi.label }}</p>
            <component :is="kpi.icon" class="w-4 h-4 text-muted-foreground" :stroke-width="1.5" />
          </div>
          <p class="text-h2 text-foreground font-bold tabular-nums">{{ kpi.value }}</p>
          <p class="text-small text-muted-foreground">{{ kpi.hint }}</p>
        </div>
      </template>
    </div>

    <!-- Quick actions (permission-driven) -->
    <div
      v-if="primaryAction"
      class="bg-primary rounded-xl p-5 flex items-center justify-between gap-4"
    >
      <div>
        <p class="text-primary-foreground text-h3">{{ primaryAction.title }}</p>
        <p class="text-primary-foreground/70 text-small mt-0.5">{{ primaryAction.subtitle }}</p>
      </div>
      <NuxtLink :to="primaryAction.to">
        <button
          class="flex-shrink-0 bg-surface text-primary font-semibold text-sm px-5 py-2.5 rounded-lg min-h-[44px] hover:bg-surface/90 active:bg-surface/80 transition-colors shadow-elevation-1"
        >
          {{ primaryAction.cta }}
        </button>
      </NuxtLink>
    </div>

    <div v-if="secondaryActions.length > 0" class="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <NuxtLink
        v-for="action in secondaryActions"
        :key="action.to"
        :to="action.to"
        class="flex items-center gap-3 bg-surface rounded-xl border border-border p-4 shadow-elevation-1 hover:border-primary transition-colors min-h-[44px]"
        :aria-label="action.title"
      >
        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <component :is="action.icon" class="w-4.5 h-4.5 text-primary" :stroke-width="1.75" />
        </span>
        <span class="text-body text-foreground font-medium leading-tight">{{ action.title }}</span>
      </NuxtLink>
    </div>

    <!-- Recent transactions (pos.view only) -->
    <div v-if="auth.hasPermission('pos.view')">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-h3 text-foreground">Transaksi Terbaru</h2>
        <NuxtLink
          to="/pos/orders"
          class="text-small text-primary hover:text-primary/80 transition-colors min-h-[44px] flex items-center"
        >
          Lihat semua
        </NuxtLink>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loadingTransactions" class="space-y-2">
        <div v-for="i in 4" :key="i" class="skeleton h-[60px] rounded-xl" />
      </div>

      <!-- Empty state -->
      <div
        v-else-if="recentTransactions.length === 0"
        class="bg-surface rounded-xl border border-border p-10 flex flex-col items-center text-center gap-3"
      >
        <div class="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <ShoppingCart class="w-6 h-6 text-muted-foreground" :stroke-width="1.5" />
        </div>
        <div>
          <p class="text-h3 text-foreground">Belum ada transaksi</p>
          <p class="text-body text-muted-foreground mt-1">Mulai kasir untuk mencatat penjualan pertama hari ini</p>
        </div>
        <NuxtLink v-if="auth.hasPermission('pos.open')" to="/pos">
          <button class="text-body text-primary font-medium min-h-[44px] flex items-center hover:text-primary/80 transition-colors">
            Buka kasir sekarang
          </button>
        </NuxtLink>
      </div>

      <!-- Data list -->
      <div
        v-else
        class="bg-surface rounded-xl border border-border overflow-hidden shadow-elevation-1 divide-y divide-border"
      >
        <div
          v-for="tx in recentTransactions"
          :key="tx.id"
          class="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              :class="tx.paid ? 'bg-success/10' : 'bg-warning/10'"
            >
              <CheckCircle2 v-if="tx.paid" class="w-4 h-4 text-success" :stroke-width="1.75" />
              <Clock v-else class="w-4 h-4 text-warning" :stroke-width="1.75" />
            </div>
            <div class="min-w-0">
              <p class="text-body text-foreground font-medium truncate">{{ tx.label }}</p>
              <p class="text-small text-muted-foreground">{{ tx.time }}</p>
            </div>
          </div>
          <p class="text-body text-foreground font-semibold flex-shrink-0 ml-4 tabular-nums">{{ tx.amount }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],  // dashboard: visible to all authenticated users
})

import { ref, computed, onMounted } from 'vue'
import type { Component } from 'vue'
import {
  ShoppingCart, Package, TrendingUp, CheckCircle2, Receipt, Clock,
  Wallet, Users, ClipboardList, BarChart2, PlusCircle, CalendarCheck,
} from '@lucide/vue'
import { useAuthStore } from '~/stores/auth'
import { formatRupiah } from '~/utils'

interface KpiCard { label: string, value: string, hint: string, icon: Component }

const auth = useAuthStore()
const api = useApi()

const loadingKpi = ref(true)
const loadingTransactions = ref(true)
const kpis = ref<KpiCard[]>([])
const recentTransactions = ref<{ id: string, label: string, time: string, amount: string, paid: boolean }[]>([])

const formattedDate = computed(() =>
  new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())
)

const firstName = computed(() => auth.user?.name?.split(' ')[0] ?? '')
const initials = computed(() =>
  (auth.user?.name ?? 'B').split(' ').slice(0, 2).map(part => part[0]).join('').toUpperCase()
)

const visibleKpis = computed(() => kpis.value)

/**
 * The single highlighted action depends on the user's main responsibility:
 * kasir → buka kasir; keuangan → catat kas; staf inventori → stok harian;
 * karyawan umum → absensi.
 */
const primaryAction = computed(() => {
  if (auth.hasPermission('pos.open')) {
    return { title: 'Buka Kasir', subtitle: 'Mulai transaksi hari ini', cta: 'Buka Kasir', to: '/pos' }
  }
  if (auth.hasPermission('finance.create')) {
    return { title: 'Catat Keuangan', subtitle: 'Tambah pemasukan / pengeluaran', cta: 'Tambah', to: '/finance/new' }
  }
  if (auth.hasPermission('inventory.create')) {
    return { title: 'Stok Harian', subtitle: 'Input stok pembukaan hari ini', cta: 'Input Stok', to: '/inventory/new' }
  }
  if (auth.hasPermission('attendance.create')) {
    return { title: 'Absensi', subtitle: 'Catat kehadiran Anda hari ini', cta: 'Absen', to: '/employees/attendance' }
  }
  return null
})

/** Shortcut grid: only routes the user can actually open. */
const secondaryActions = computed(() => {
  const actions: { title: string, icon: Component, to: string, show: boolean }[] = [
    { title: 'Tambah Catatan Kas', icon: PlusCircle, to: '/finance/new', show: auth.hasPermission('finance.create') && auth.hasPermission('pos.open') },
    { title: 'Stok Harian', icon: ClipboardList, to: '/inventory/new', show: auth.hasPermission('inventory.create') && primaryAction.value?.to !== '/inventory/new' },
    { title: 'Laporan Bisnis', icon: BarChart2, to: '/reports', show: auth.hasPermission('report.view') },
    { title: 'Karyawan', icon: Users, to: '/employees', show: auth.hasPermission('employee.view') },
    { title: 'Absensi Saya', icon: CalendarCheck, to: '/employees/attendance', show: auth.hasPermission('attendance.create') && primaryAction.value?.to !== '/employees/attendance' },
  ]
  return actions.filter(a => a.show)
})

async function loadKpis() {
  loadingKpi.value = true
  const today = new Date().toISOString().slice(0, 10)
  const cards: KpiCard[] = []

  const jobs: Promise<void>[] = []

  if (auth.hasPermission('pos.view')) {
    jobs.push((async () => {
      try {
        const res = await api<{ data: any[] }>('/v1/sales/orders', { query: { date: today, status: 'completed' } })
        const orders = res.data
        const total = orders.reduce((sum, o) => sum + Number(o.total_amount ?? 0), 0)
        cards.push({ label: 'Penjualan Hari Ini', value: formatRupiah(total), hint: `${orders.length} transaksi`, icon: TrendingUp })
        cards.push({
          label: 'Rata-rata Nota',
          value: formatRupiah(orders.length > 0 ? Math.round(total / orders.length) : 0),
          hint: 'per transaksi',
          icon: Receipt,
        })
      } catch { /* kartu dilewati saat gagal */ }
    })())
  }

  if (auth.hasPermission('finance.view')) {
    jobs.push((async () => {
      try {
        const res = await api<{ data: { total_income: number, total_expense: number, net: number } }>('/v1/finance/summary')
        cards.push({
          label: 'Kas Hari Ini',
          value: formatRupiah(res.data.net),
          hint: `Masuk ${formatRupiah(res.data.total_income)}`,
          icon: Wallet,
        })
      } catch { /* kartu dilewati saat gagal */ }
    })())
  }

  if (auth.hasPermission('inventory.view')) {
    jobs.push((async () => {
      try {
        const res = await api<{ data: any[] }>('/v1/inventory/low-stock')
        cards.push({
          label: 'Stok Menipis',
          value: String(res.data.length),
          hint: res.data.length > 0 ? 'perlu diisi ulang' : 'semua stok aman',
          icon: Package,
        })
      } catch { /* kartu dilewati saat gagal */ }
    })())
  }

  if (auth.hasPermission('employee.view')) {
    jobs.push((async () => {
      try {
        const res = await api<{ data: { active_employees: number, present_today: number, pending_leaves: number } }>('/v1/hr/summary')
        cards.push({
          label: 'Kehadiran Hari Ini',
          value: `${res.data.present_today}/${res.data.active_employees}`,
          hint: res.data.pending_leaves > 0 ? `${res.data.pending_leaves} cuti menunggu` : 'tidak ada cuti menunggu',
          icon: Users,
        })
      } catch { /* kartu dilewati saat gagal */ }
    })())
  }

  await Promise.all(jobs)
  kpis.value = cards
  loadingKpi.value = false
}

async function loadTransactions() {
  if (!auth.hasPermission('pos.view')) {
    loadingTransactions.value = false
    return
  }
  loadingTransactions.value = true
  try {
    const res = await api<{ data: any[] }>('/v1/sales/orders')
    recentTransactions.value = res.data.slice(0, 5).map(order => ({
      id: order.id,
      label: `${order.items?.length ?? 0} item · ${order.customer_name ?? order.order_no ?? 'Tanpa nama'}`,
      time: new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(new Date(order.created_at)),
      amount: formatRupiah(order.total_amount),
      paid: order.payment_status === 'paid',
    }))
  } catch {
    recentTransactions.value = []
  } finally {
    loadingTransactions.value = false
  }
}

onMounted(() => {
  loadKpis()
  loadTransactions()
})
</script>
