<template>
  <div class="p-4 md:p-6 max-w-2xl mx-auto pb-28 md:pb-6 space-y-5">
    <!-- Page Header -->
    <div>
      <p class="text-small text-muted-foreground">{{ today }}</p>
      <h1 class="text-h1 text-foreground mt-0.5">Manajemen Shift</h1>
    </div>

    <!-- Active shift banner -->
    <div v-if="store.activeShift" class="bg-success/10 border border-success/20 rounded-xl p-4 space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
          <span class="text-body font-semibold text-success">Shift Aktif</span>
        </div>
        <span class="text-caption text-muted-foreground">{{ formatTime(store.activeShift.opened_at) }}</span>
      </div>
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p class="text-caption text-muted-foreground">Kas Awal</p>
          <p class="text-body font-semibold tabular-nums">{{ formatCurrency(store.activeShift.opening_cash) }}</p>
        </div>
        <div>
          <p class="text-caption text-muted-foreground">Transaksi</p>
          <p class="text-body font-semibold tabular-nums">{{ store.activeShift.transaction_count }}</p>
        </div>
      </div>
      <button
        v-if="auth.hasPermission('pos.close')"
        @click="showCloseForm = true"
        class="w-full h-11 rounded-lg bg-destructive text-destructive-foreground font-semibold text-sm hover:bg-destructive/90 transition-colors"
      >
        Tutup Shift
      </button>
    </div>

    <!-- Open shift card (no active shift) -->
    <div v-else-if="auth.hasPermission('pos.open')" class="bg-surface border border-border rounded-xl p-5 space-y-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Clock class="w-5 h-5 text-primary" :stroke-width="1.75" />
        </div>
        <div>
          <p class="text-h3 text-foreground">Belum Ada Shift Aktif</p>
          <p class="text-small text-muted-foreground">Buka shift untuk mulai menerima transaksi</p>
        </div>
      </div>
      <button
        @click="showOpenForm = true"
        class="w-full h-12 rounded-lg bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 active:bg-primary/80 transition-colors"
      >
        Buka Shift
      </button>
    </div>

    <!-- Shift history -->
    <div>
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-h3 text-foreground">Riwayat Shift</h2>
        <FilterSheet
          v-model="statusFilter"
          title="Filter status shift"
          trigger-label="Status"
          :options="statusOptions"
          default-value="semua"
        />
      </div>

      <div v-if="store.loading" class="space-y-2">
        <div v-for="i in 3" :key="i" class="skeleton h-[88px] rounded-xl" />
      </div>

      <div
        v-else-if="filteredShifts.length === 0"
        class="bg-surface border border-border rounded-xl p-10 flex flex-col items-center text-center gap-3"
      >
        <div class="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <Clock class="w-6 h-6 text-muted-foreground" :stroke-width="1.5" />
        </div>
        <p class="text-h3 text-foreground">Belum ada riwayat shift</p>
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="shift in filteredShifts"
          :key="shift.id"
          @click="selectedShift = shift; showDetail = true"
          class="bg-surface border border-border rounded-xl p-4 shadow-elevation-1 cursor-pointer hover:border-input transition-colors space-y-2"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <p class="text-body text-foreground font-medium truncate">
                {{ shift.cashier?.name ?? '—' }}
              </p>
              <p class="text-small text-muted-foreground">
                {{ formatTime(shift.opened_at) }}
                <template v-if="shift.closed_at"> → {{ formatTime(shift.closed_at) }}</template>
              </p>
            </div>
            <span
              class="text-caption px-2 py-1 rounded-full flex-shrink-0"
              :class="shift.status === 'open'
                ? 'bg-success/10 text-success'
                : 'bg-muted text-muted-foreground'"
            >
              {{ shift.status === 'open' ? 'Aktif' : 'Selesai' }}
            </span>
          </div>
          <div v-if="shift.status === 'closed'" class="grid grid-cols-3 gap-2 pt-1 border-t border-border/50">
            <div>
              <p class="text-caption text-muted-foreground">Penjualan</p>
              <p class="text-small font-semibold tabular-nums text-foreground">{{ formatCurrency(shift.total_sales) }}</p>
            </div>
            <div>
              <p class="text-caption text-muted-foreground">Transaksi</p>
              <p class="text-small font-semibold tabular-nums text-foreground">{{ shift.transaction_count }}</p>
            </div>
            <div>
              <p class="text-caption text-muted-foreground">Selisih Kas</p>
              <p
                class="text-small font-semibold tabular-nums"
                :class="(shift.cash_difference ?? 0) < 0 ? 'text-destructive' : (shift.cash_difference ?? 0) > 0 ? 'text-success' : 'text-foreground'"
              >
                {{ formatDiff(shift.cash_difference) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Open shift drawer -->
    <DrawerRoot v-model:open="showOpenForm">
      <DrawerContent aria-label="Buka shift">
        <DrawerHeader>
          <DrawerTitle>Buka Shift Kasir</DrawerTitle>
        </DrawerHeader>
        <div class="flex-1 overflow-y-auto px-5 pb-4 space-y-4">
          <p class="text-small text-muted-foreground">
            Masukkan jumlah uang kas awal yang tersedia di laci kasir.
          </p>
          <div>
            <label for="opening-cash" class="text-small text-muted-foreground">
              Kas Awal <span class="text-destructive">*</span>
            </label>
            <Input
              id="opening-cash"
              v-model.number="openForm.opening_cash"
              type="number"
              inputmode="numeric"
              min="0"
              step="1000"
              class="mt-1 h-11"
              placeholder="0"
            />
          </div>
          <p v-if="store.error" class="text-small text-destructive" role="alert">{{ store.error }}</p>
        </div>
        <DrawerFooter>
          <div class="flex w-full gap-2">
            <button type="button" :class="cn(buttonVariants({ variant: 'outline' }), 'flex-1')" @click="showOpenForm = false">
              Batal
            </button>
            <button
              type="button"
              :class="cn(buttonVariants(), 'flex-1')"
              :disabled="store.loading"
              @click="doOpenShift"
            >
              <Loader2 v-if="store.loading" class="w-4 h-4 animate-spin mr-1" />
              Buka Shift
            </button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </DrawerRoot>

    <!-- Close shift drawer -->
    <DrawerRoot v-model:open="showCloseForm">
      <DrawerContent aria-label="Tutup shift">
        <DrawerHeader>
          <DrawerTitle>Tutup Shift Kasir</DrawerTitle>
        </DrawerHeader>
        <div v-if="store.activeShift" class="flex-1 overflow-y-auto px-5 pb-4 space-y-4">
          <!-- Summary preview -->
          <div class="bg-muted/50 rounded-xl p-4 space-y-2">
            <p class="text-small text-muted-foreground font-medium">Ringkasan Shift</p>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <p class="text-caption text-muted-foreground">Total Penjualan</p>
                <p class="text-body font-bold tabular-nums text-foreground">{{ formatCurrency(store.activeShift.total_sales) }}</p>
              </div>
              <div>
                <p class="text-caption text-muted-foreground">Transaksi</p>
                <p class="text-body font-bold tabular-nums text-foreground">{{ store.activeShift.transaction_count }}</p>
              </div>
              <div>
                <p class="text-caption text-muted-foreground">Kas Awal</p>
                <p class="text-body font-semibold tabular-nums">{{ formatCurrency(store.activeShift.opening_cash) }}</p>
              </div>
            </div>
          </div>

          <!-- Payment breakdown -->
          <div v-if="store.activeShift.payment_breakdown" class="space-y-1.5">
            <p class="text-small text-muted-foreground font-medium">Rekapitulasi Pembayaran</p>
            <div
              v-for="(amount, method) in store.activeShift.payment_breakdown"
              :key="method"
              class="flex items-center justify-between px-3 py-2 bg-surface rounded-lg border border-border/60"
            >
              <span class="text-small text-foreground capitalize">{{ methodLabel(method) }}</span>
              <span class="text-small font-semibold tabular-nums">{{ formatCurrency(amount) }}</span>
            </div>
          </div>

          <div>
            <label for="closing-cash" class="text-small text-muted-foreground">
              Kas Aktual Saat Tutup <span class="text-destructive">*</span>
            </label>
            <Input
              id="closing-cash"
              v-model.number="closeForm.closing_cash"
              type="number"
              inputmode="numeric"
              min="0"
              step="1000"
              class="mt-1 h-11"
              placeholder="0"
            />
            <!-- Live difference preview -->
            <p v-if="closeForm.closing_cash !== null" class="text-small mt-1.5"
              :class="cashDiff < 0 ? 'text-destructive' : cashDiff > 0 ? 'text-success' : 'text-muted-foreground'"
            >
              Selisih: {{ formatDiff(cashDiff) }}
            </p>
          </div>
          <div>
            <label for="closing-note" class="text-small text-muted-foreground">Catatan (opsional)</label>
            <Input
              id="closing-note"
              v-model="closeForm.closing_note"
              class="mt-1 h-11"
              placeholder="Keterangan selisih atau catatan lain..."
            />
          </div>
          <p v-if="store.error" class="text-small text-destructive" role="alert">{{ store.error }}</p>
        </div>
        <DrawerFooter>
          <div class="flex w-full gap-2">
            <button type="button" :class="cn(buttonVariants({ variant: 'outline' }), 'flex-1')" @click="showCloseForm = false">
              Batal
            </button>
            <button
              type="button"
              :class="cn(buttonVariants({ variant: 'destructive' }), 'flex-1')"
              :disabled="store.loading || closeForm.closing_cash === null"
              @click="doCloseShift"
            >
              <Loader2 v-if="store.loading" class="w-4 h-4 animate-spin mr-1" />
              Tutup Shift
            </button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </DrawerRoot>

    <!-- Shift detail drawer -->
    <DrawerRoot v-model:open="showDetail">
      <DrawerContent aria-label="Detail shift">
        <DrawerHeader>
          <DrawerTitle>Detail Shift</DrawerTitle>
        </DrawerHeader>
        <div v-if="selectedShift" class="flex-1 overflow-y-auto px-5 pb-4 space-y-4">
          <div class="space-y-2">
            <div class="flex justify-between text-small">
              <span class="text-muted-foreground">Kasir</span>
              <span class="text-foreground font-medium">{{ selectedShift.cashier?.name ?? '—' }}</span>
            </div>
            <div class="flex justify-between text-small">
              <span class="text-muted-foreground">Buka</span>
              <span class="text-foreground">{{ formatDateTime(selectedShift.opened_at) }}</span>
            </div>
            <div v-if="selectedShift.closed_at" class="flex justify-between text-small">
              <span class="text-muted-foreground">Tutup</span>
              <span class="text-foreground">{{ formatDateTime(selectedShift.closed_at) }}</span>
            </div>
            <div class="flex justify-between text-small">
              <span class="text-muted-foreground">Kas Awal</span>
              <span class="text-foreground font-semibold tabular-nums">{{ formatCurrency(selectedShift.opening_cash) }}</span>
            </div>
            <div v-if="selectedShift.closing_cash !== null" class="flex justify-between text-small">
              <span class="text-muted-foreground">Kas Aktual</span>
              <span class="text-foreground font-semibold tabular-nums">{{ formatCurrency(selectedShift.closing_cash) }}</span>
            </div>
            <div v-if="selectedShift.expected_cash !== null" class="flex justify-between text-small">
              <span class="text-muted-foreground">Kas Seharusnya</span>
              <span class="text-foreground tabular-nums">{{ formatCurrency(selectedShift.expected_cash) }}</span>
            </div>
            <div v-if="selectedShift.cash_difference !== null" class="flex justify-between text-small">
              <span class="text-muted-foreground">Selisih Kas</span>
              <span
                class="font-semibold tabular-nums"
                :class="selectedShift.cash_difference < 0 ? 'text-destructive' : selectedShift.cash_difference > 0 ? 'text-success' : 'text-foreground'"
              >{{ formatDiff(selectedShift.cash_difference) }}</span>
            </div>
            <div class="flex justify-between text-small">
              <span class="text-muted-foreground">Total Penjualan</span>
              <span class="text-foreground font-bold tabular-nums text-success">{{ formatCurrency(selectedShift.total_sales) }}</span>
            </div>
            <div class="flex justify-between text-small">
              <span class="text-muted-foreground">Jumlah Transaksi</span>
              <span class="text-foreground font-semibold">{{ selectedShift.transaction_count }}</span>
            </div>
          </div>

          <div v-if="selectedShift.payment_breakdown && Object.keys(selectedShift.payment_breakdown).length > 0">
            <p class="text-small text-muted-foreground font-medium mb-2">Rekapitulasi Pembayaran</p>
            <div class="space-y-1.5">
              <div
                v-for="(amount, method) in selectedShift.payment_breakdown"
                :key="method"
                class="flex justify-between items-center px-3 py-2 bg-muted/40 rounded-lg"
              >
                <span class="text-small text-foreground">{{ methodLabel(method) }}</span>
                <span class="text-small font-semibold tabular-nums">{{ formatCurrency(amount) }}</span>
              </div>
            </div>
          </div>

          <div v-if="selectedShift.closing_note" class="bg-warning/8 border border-warning/20 rounded-xl p-3">
            <p class="text-caption text-muted-foreground mb-0.5">Catatan</p>
            <p class="text-small text-foreground italic">"{{ selectedShift.closing_note }}"</p>
          </div>
        </div>
        <DrawerFooter>
          <button type="button" :class="cn(buttonVariants({ variant: 'outline' }), 'w-full')" @click="showDetail = false">
            Tutup
          </button>
        </DrawerFooter>
      </DrawerContent>
    </DrawerRoot>
  </div>
</template>

<script setup lang="ts">
import { Clock, Loader2 } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { buttonVariants } from '~/components/ui/button'
import { useAuthStore } from '~/stores/auth'
import { useShiftStore, type CashierShift } from '~/stores/shift'
import { cn } from '~/utils'

definePageMeta({
  middleware: ['auth', 'permission'],
  permissions: ['pos.view', 'pos.open', 'pos.close'],
})

const auth = useAuthStore()
const store = useShiftStore()

const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

const showOpenForm = ref(false)
const showCloseForm = ref(false)
const showDetail = ref(false)
const selectedShift = ref<CashierShift | null>(null)
const statusFilter = ref('semua')

const openForm = ref({ opening_cash: 0 })
const closeForm = ref<{ closing_cash: number | null; closing_note: string }>({
  closing_cash: null,
  closing_note: '',
})

const statusOptions = [
  { label: 'Semua', value: 'semua' },
  { label: 'Aktif', value: 'open' },
  { label: 'Selesai', value: 'closed' },
]

const filteredShifts = computed(() => {
  if (statusFilter.value === 'semua') return store.shifts
  return store.shifts.filter(s => s.status === statusFilter.value)
})

const cashDiff = computed(() => {
  if (!store.activeShift || closeForm.value.closing_cash === null) return 0
  const cashSales = store.activeShift.payment_breakdown?.cash ?? 0
  const expected = (store.activeShift.opening_cash ?? 0) + cashSales
  return closeForm.value.closing_cash - expected
})

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value)
}

function formatDiff(value: number | null): string {
  if (value === null || value === undefined) return '—'
  const prefix = value > 0 ? '+' : ''
  return prefix + new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value)
}

function formatTime(datetime: string): string {
  return new Date(datetime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function formatDateTime(datetime: string): string {
  return new Date(datetime).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function methodLabel(method: string): string {
  const labels: Record<string, string> = {
    cash: 'Tunai',
    qris: 'QRIS',
    transfer: 'Transfer',
    other: 'Lainnya',
  }
  return labels[method] ?? method
}

async function doOpenShift() {
  try {
    await store.openShift(openForm.value.opening_cash ?? 0)
    showOpenForm.value = false
    openForm.value = { opening_cash: 0 }
    await store.fetchShifts()
  } catch { /* error shown in form */ }
}

async function doCloseShift() {
  if (!store.activeShift || closeForm.value.closing_cash === null) return
  try {
    await store.closeShift(store.activeShift.id, {
      closing_cash: closeForm.value.closing_cash,
      closing_note: closeForm.value.closing_note || undefined,
    })
    showCloseForm.value = false
    closeForm.value = { closing_cash: null, closing_note: '' }
    await store.fetchShifts()
  } catch { /* error shown in form */ }
}

onMounted(async () => {
  await Promise.all([store.fetchActive(), store.fetchShifts()])
})
</script>
