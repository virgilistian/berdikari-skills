<template>
  <div class="p-4 md:p-6 max-w-4xl mx-auto space-y-5">
    <!-- Page Header -->
    <div>
      <p class="text-small text-muted-foreground">{{ today }}</p>
      <h1 class="text-h1 text-foreground mt-0.5">Absensi</h1>
    </div>

    <EmployeeSectionTabs current="attendance" />

    <!-- Self clock in/out (attendance.create) -->
    <div v-if="auth.hasPermission('attendance.create')" class="bg-surface rounded-xl border border-border p-5 shadow-elevation-1">
      <div class="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p class="text-h3 text-foreground">Kehadiran Saya Hari Ini</p>
          <p class="text-small text-muted-foreground mt-1">
            <template v-if="selfError">{{ selfError }}</template>
            <template v-else-if="hr.myToday?.clock_in">
              Masuk {{ formatTime(hr.myToday.clock_in) }}
              <template v-if="hr.myToday.clock_out"> · Pulang {{ formatTime(hr.myToday.clock_out) }}</template>
            </template>
            <template v-else>Anda belum absen masuk hari ini</template>
          </p>
        </div>
        <div class="flex gap-2">
          <button
            v-if="!hr.myToday?.clock_in"
            :disabled="acting || !!selfError"
            @click="doClock('in')"
            class="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg min-h-[44px] font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <LogIn class="w-4 h-4" :stroke-width="1.75" />
            Absen Masuk
          </button>
          <button
            v-else-if="!hr.myToday?.clock_out"
            :disabled="acting"
            @click="doClock('out')"
            class="bg-warning text-warning-foreground px-5 py-2.5 rounded-lg min-h-[44px] font-semibold text-sm hover:bg-warning/90 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <LogOut class="w-4 h-4" :stroke-width="1.75" />
            Absen Pulang
          </button>
          <span v-else class="flex items-center gap-2 text-success text-body font-medium">
            <CheckCircle2 class="w-5 h-5" :stroke-width="1.75" />
            Absensi hari ini lengkap
          </span>
        </div>
      </div>
    </div>

    <!-- History -->
    <div>
      <div class="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <h2 class="text-h3 text-foreground">{{ canViewAll ? 'Riwayat Absensi Tim' : 'Riwayat Saya' }}</h2>
        <FilterSheet
          v-if="canViewAll"
          v-model="rangeFilter"
          title="Pilih rentang waktu"
          trigger-label="Rentang"
          :options="rangeOptions"
          default-value="7"
        />
      </div>

      <div v-if="loadingHistory" class="space-y-2">
        <div v-for="i in 4" :key="i" class="skeleton h-[56px] rounded-xl" />
      </div>

      <div
        v-else-if="rows.length === 0"
        class="bg-surface rounded-xl border border-border p-10 flex flex-col items-center text-center gap-3"
      >
        <div class="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <CalendarCheck class="w-6 h-6 text-muted-foreground" :stroke-width="1.5" />
        </div>
        <p class="text-h3 text-foreground">Belum ada data absensi</p>
      </div>

      <div
        v-else
        class="bg-surface rounded-xl border border-border overflow-hidden shadow-elevation-1 divide-y divide-border"
      >
        <div
          v-for="row in rows"
          :key="row.id"
          class="flex items-center justify-between px-4 py-3"
        >
          <div class="min-w-0">
            <p class="text-body text-foreground font-medium truncate">
              {{ canViewAll ? (row.employee?.name ?? '—') : formatDate(row.date) }}
            </p>
            <p class="text-small text-muted-foreground">
              {{ canViewAll ? formatDate(row.date) : (row.employee?.position ?? '') }}
            </p>
          </div>
          <div class="text-right flex-shrink-0 ml-4">
            <p class="text-body text-foreground tabular-nums">
              {{ row.clock_in ? formatTime(row.clock_in) : '—' }} – {{ row.clock_out ? formatTime(row.clock_out) : '—' }}
            </p>
            <p class="text-small" :class="row.status === 'present' ? 'text-success' : 'text-muted-foreground'">
              {{ statusLabel[row.status] ?? row.status }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'permission'],
  permissions: ['attendance.create', 'attendance.view'],
  title: 'Absensi',
})

import { ref, computed, onMounted, watch } from 'vue'
import { CalendarCheck, CheckCircle2, LogIn, LogOut } from '@lucide/vue'
import FilterSheet from '~/components/FilterSheet.vue'
import EmployeeSectionTabs from '~/components/EmployeeSectionTabs.vue'
import { useAuthStore } from '~/stores/auth'
import { useHrStore } from '~/stores/hr'

useHead({ title: 'Absensi — Berdikari' })

const auth = useAuthStore()
const hr = useHrStore()

const today = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())

const canViewAll = computed(() => auth.hasPermission('attendance.view'))

const acting = ref(false)
const loadingHistory = ref(true)
const selfError = ref('')

const rangeFilter = ref('7')
const rangeOptions = [
  { value: '7', label: '7 hari terakhir' },
  { value: '30', label: '30 hari terakhir' },
  { value: '90', label: '3 bulan terakhir' },
]

const statusLabel: Record<string, string> = {
  present: 'Hadir',
  late: 'Terlambat',
  absent: 'Tidak hadir',
  leave: 'Cuti',
}

const rows = computed(() => (canViewAll.value ? hr.attendance : hr.myHistory))

function formatTime(value: string): string {
  return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(value))
}

async function loadHistory() {
  loadingHistory.value = true
  try {
    if (canViewAll.value) {
      const from = new Date(Date.now() - Number(rangeFilter.value) * 86_400_000).toISOString().slice(0, 10)
      await hr.fetchAttendance({ from })
    } else if (auth.hasPermission('attendance.create')) {
      await hr.fetchMyAttendance()
    }
  } catch (err: any) {
    if (!canViewAll.value) selfError.value = err?.data?.message ?? ''
  } finally {
    loadingHistory.value = false
  }
}

async function loadSelf() {
  if (!auth.hasPermission('attendance.create')) return
  try {
    await hr.fetchMyAttendance()
    selfError.value = ''
  } catch (err: any) {
    selfError.value = err?.data?.message ?? 'Data absensi tidak tersedia.'
  }
}

async function doClock(direction: 'in' | 'out') {
  if (acting.value) return
  acting.value = true
  try {
    if (direction === 'in') await hr.clockIn()
    else await hr.clockOut()
    await loadHistory()
  } catch (err: any) {
    selfError.value = err?.data?.message ?? 'Gagal mencatat absensi. Coba lagi.'
  } finally {
    acting.value = false
  }
}

watch(rangeFilter, () => { if (canViewAll.value) loadHistory() })

onMounted(async () => {
  await Promise.all([loadSelf(), loadHistory()])
})
</script>
