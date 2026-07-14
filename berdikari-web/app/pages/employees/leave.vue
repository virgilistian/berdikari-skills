<template>
  <div class="p-4 md:p-6 max-w-4xl mx-auto space-y-5">
    <!-- Page Header -->
    <div class="flex items-start justify-between">
      <div>
        <p class="text-small text-muted-foreground">{{ today }}</p>
        <h1 class="text-h1 text-foreground mt-0.5">Cuti & Izin</h1>
      </div>
      <button
        v-if="auth.hasPermission('leave.create')"
        @click="openForm"
        class="bg-primary text-primary-foreground px-4 py-2 rounded-lg min-h-[44px] font-semibold text-sm hover:bg-primary/90 active:bg-primary/80 transition-colors flex items-center gap-2"
      >
        <Plus class="w-4 h-4" :stroke-width="2" />
        Ajukan
      </button>
    </div>

    <EmployeeSectionTabs current="leave" />

    <!-- Kuota cuti tahunan (for leave.create permission holders) -->
    <div v-if="auth.hasPermission('leave.create') && hr.myQuota">
      <h2 class="text-h3 text-foreground mb-3">Kuota Cuti Tahunan {{ hr.myQuota.quota.year }}</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="bg-surface rounded-xl border border-border p-4 shadow-elevation-1">
          <p class="text-caption text-muted-foreground">Total Kuota</p>
          <p class="text-h1 font-bold text-foreground tabular-nums mt-1">{{ hr.myQuota.quota.total_available }}</p>
          <p class="text-caption text-muted-foreground">hari</p>
        </div>
        <div class="bg-surface rounded-xl border border-border p-4 shadow-elevation-1">
          <p class="text-caption text-muted-foreground">Terpakai</p>
          <p class="text-h1 font-bold text-foreground tabular-nums mt-1">{{ hr.myQuota.quota.used_days }}</p>
          <p class="text-caption text-muted-foreground">hari</p>
        </div>
        <div class="bg-surface rounded-xl border border-border p-4 shadow-elevation-1">
          <p class="text-caption text-muted-foreground">Menunggu</p>
          <p class="text-h1 font-bold text-warning tabular-nums mt-1">{{ hr.myQuota.quota.pending_days }}</p>
          <p class="text-caption text-muted-foreground">hari</p>
        </div>
        <div class="bg-primary/8 rounded-xl border border-primary/20 p-4">
          <p class="text-caption text-primary/80">Sisa Kuota</p>
          <p
            class="text-h1 font-bold tabular-nums mt-1"
            :class="hr.myQuota.quota.remaining_days <= 3 ? 'text-destructive' : hr.myQuota.quota.remaining_days <= 6 ? 'text-warning' : 'text-primary'"
          >{{ hr.myQuota.quota.remaining_days }}</p>
          <p class="text-caption text-primary/80">hari</p>
        </div>
      </div>
    </div>

    <!-- Approval queue (leave.approve) -->
    <div v-if="auth.hasPermission('leave.approve')">
      <h2 class="text-h3 text-foreground mb-3">Menunggu Persetujuan</h2>

      <div v-if="loading" class="space-y-2">
        <div v-for="i in 2" :key="i" class="skeleton h-[88px] rounded-xl" />
      </div>

      <div
        v-else-if="pendingLeaves.length === 0"
        class="bg-surface rounded-xl border border-border p-6 text-center"
      >
        <p class="text-body text-muted-foreground">Tidak ada pengajuan yang menunggu persetujuan</p>
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="leave in pendingLeaves"
          :key="leave.id"
          class="bg-surface rounded-xl border border-border p-4 shadow-elevation-1 space-y-3"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-body text-foreground font-medium truncate">{{ leave.employee?.name ?? '—' }}</p>
              <p class="text-small text-muted-foreground">
                {{ typeLabel[leave.type] }} · {{ formatRange(leave.start_date, leave.end_date) }}
              </p>
              <p v-if="leave.reason" class="text-small text-muted-foreground mt-1 italic">"{{ leave.reason }}"</p>
            </div>
            <span class="text-caption px-2 py-1 rounded-full bg-warning/10 text-warning flex-shrink-0">Menunggu</span>
          </div>
          <div class="flex gap-2">
            <button
              :disabled="deciding === leave.id"
              @click="decide(leave.id, 'approve')"
              class="flex-1 h-10 rounded-lg bg-success text-success-foreground text-small font-semibold hover:bg-success/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Check class="w-4 h-4" :stroke-width="2" />
              Setujui
            </button>
            <button
              :disabled="deciding === leave.id"
              @click="decide(leave.id, 'reject')"
              class="flex-1 h-10 rounded-lg border border-border text-destructive text-small font-semibold hover:bg-destructive/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <X class="w-4 h-4" :stroke-width="2" />
              Tolak
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Requests list -->
    <div>
      <div class="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <h2 class="text-h3 text-foreground">{{ canViewAll ? 'Semua Pengajuan' : 'Pengajuan Saya' }}</h2>
        <FilterSheet
          v-if="canViewAll"
          v-model="statusFilter"
          title="Pilih status pengajuan"
          trigger-label="Status"
          :options="statusOptions"
          default-value="semua"
        />
      </div>

      <div v-if="loading" class="space-y-2">
        <div v-for="i in 3" :key="i" class="skeleton h-[64px] rounded-xl" />
      </div>

      <div
        v-else-if="listedLeaves.length === 0"
        class="bg-surface rounded-xl border border-border p-10 flex flex-col items-center text-center gap-3"
      >
        <div class="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <CalendarDays class="w-6 h-6 text-muted-foreground" :stroke-width="1.5" />
        </div>
        <div>
          <p class="text-h3 text-foreground">Belum ada pengajuan cuti</p>
          <p v-if="selfError" class="text-body text-muted-foreground mt-1">{{ selfError }}</p>
        </div>
      </div>

      <div
        v-else
        class="bg-surface rounded-xl border border-border overflow-hidden shadow-elevation-1 divide-y divide-border"
      >
        <div
          v-for="leave in listedLeaves"
          :key="leave.id"
          class="flex items-center justify-between px-4 py-3 gap-3"
        >
          <div class="min-w-0">
            <p class="text-body text-foreground font-medium truncate">
              {{ canViewAll ? (leave.employee?.name ?? '—') : typeLabel[leave.type] }}
            </p>
            <p class="text-small text-muted-foreground truncate">
              {{ canViewAll ? typeLabel[leave.type] + ' · ' : '' }}{{ formatRange(leave.start_date, leave.end_date) }}
              <template v-if="leave.decision_note"> · {{ leave.decision_note }}</template>
            </p>
          </div>
          <span
            class="text-caption px-2 py-1 rounded-full flex-shrink-0"
            :class="{
              'bg-warning/10 text-warning': leave.status === 'pending',
              'bg-success/10 text-success': leave.status === 'approved',
              'bg-destructive/10 text-destructive': leave.status === 'rejected',
            }"
          >
            {{ statusLabel[leave.status] }}
          </span>
        </div>
      </div>
    </div>

    <!-- Submit drawer -->
    <DrawerRoot v-model:open="showForm">
      <DrawerContent aria-label="Ajukan cuti">
        <DrawerHeader>
          <DrawerTitle>Ajukan Cuti / Izin</DrawerTitle>
        </DrawerHeader>
        <form class="flex-1 overflow-y-auto px-5 pb-4 space-y-4" @submit.prevent="submit">
          <div>
            <label class="text-small text-muted-foreground">Jenis</label>
            <div class="flex gap-2 mt-1">
              <button
                v-for="option in typeOptions"
                :key="option.value"
                type="button"
                class="flex-1 h-11 rounded-lg text-small font-medium transition-colors border"
                :class="form.type === option.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-input hover:bg-muted'"
                @click="form.type = option.value"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
          <!-- Quota reminder for annual leave -->
          <div
            v-if="form.type === 'annual' && hr.myQuota"
            class="bg-muted/50 rounded-xl p-3 flex items-center justify-between"
          >
            <span class="text-small text-muted-foreground">Sisa kuota cuti tahunan</span>
            <span
              class="text-body font-bold tabular-nums"
              :class="hr.myQuota.quota.remaining_days <= 3 ? 'text-destructive' : 'text-primary'"
            >{{ hr.myQuota.quota.remaining_days }} hari</span>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="leave-start" class="text-small text-muted-foreground">Mulai <span class="text-destructive">*</span></label>
              <Input id="leave-start" v-model="form.start_date" type="date" class="mt-1 h-11" required />
            </div>
            <div>
              <label for="leave-end" class="text-small text-muted-foreground">Selesai <span class="text-destructive">*</span></label>
              <Input id="leave-end" v-model="form.end_date" type="date" class="mt-1 h-11" required />
            </div>
          </div>
          <div>
            <label for="leave-reason" class="text-small text-muted-foreground">Alasan</label>
            <Input id="leave-reason" v-model="form.reason" class="mt-1 h-11" placeholder="opsional" />
          </div>
          <p v-if="formError" class="text-small text-destructive" role="alert">{{ formError }}</p>
        </form>
        <DrawerFooter>
          <div class="flex w-full gap-2">
            <button type="button" :class="cn(buttonVariants({ variant: 'outline' }), 'flex-1')" @click="showForm = false">
              Batal
            </button>
            <button
              type="button"
              :class="cn(buttonVariants(), 'flex-1')"
              :disabled="submitting || !form.start_date || !form.end_date"
              @click="submit"
            >
              <Loader2 v-if="submitting" class="w-4 h-4 animate-spin" :stroke-width="2" />
              {{ submitting ? 'Mengirim...' : 'Kirim Pengajuan' }}
            </button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </DrawerRoot>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'permission'],
  permissions: ['leave.create', 'leave.view', 'leave.approve'],
  title: 'Cuti & Izin',
})

import { ref, computed, onMounted, watch } from 'vue'
import { CalendarDays, Check, Loader2, Plus, X } from '@lucide/vue'
import FilterSheet from '~/components/FilterSheet.vue'
import EmployeeSectionTabs from '~/components/EmployeeSectionTabs.vue'
import { Input } from '@/components/ui/input'
import { buttonVariants } from '@/components/ui/button'
import {
  DrawerContent, DrawerFooter, DrawerHeader, DrawerRoot, DrawerTitle,
} from '@/components/ui/drawer'
import { cn } from '@/utils'
import { useAuthStore } from '~/stores/auth'
import { useHrStore } from '~/stores/hr'

useHead({ title: 'Cuti & Izin — Berdikari' })

const auth = useAuthStore()
const hr = useHrStore()

const today = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())

const canViewAll = computed(() => auth.hasPermission('leave.view'))

const loading = ref(true)
const deciding = ref<string | null>(null)
const selfError = ref('')

const statusFilter = ref('semua')
const statusOptions = [
  { value: 'semua', label: 'Semua' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'rejected', label: 'Ditolak' },
]

const typeLabel: Record<string, string> = { annual: 'Cuti', sick: 'Sakit', other: 'Izin lain' }
const statusLabel: Record<string, string> = { pending: 'Menunggu', approved: 'Disetujui', rejected: 'Ditolak' }
const typeOptions = [
  { value: 'annual', label: 'Cuti' },
  { value: 'sick', label: 'Sakit' },
  { value: 'other', label: 'Lainnya' },
] as const

const pendingLeaves = computed(() => hr.leaves.filter(l => l.status === 'pending'))

const listedLeaves = computed(() => {
  if (!canViewAll.value) return hr.myLeaves
  if (statusFilter.value === 'semua') return hr.leaves
  return hr.leaves.filter(l => l.status === statusFilter.value)
})

function formatRange(start: string, end: string): string {
  const fmt = (v: string) => new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(new Date(v))
  return start === end ? fmt(start) : `${fmt(start)} – ${fmt(end)}`
}

async function load() {
  loading.value = true
  try {
    const jobs: Promise<unknown>[] = []
    if (canViewAll.value || auth.hasPermission('leave.approve')) jobs.push(hr.fetchLeaves())
    if (auth.hasPermission('leave.create')) {
      jobs.push(hr.fetchMyLeaves().catch((err: any) => {
        selfError.value = err?.data?.message ?? ''
      }))
      jobs.push(hr.fetchMyQuota().catch(() => {}))
    }
    await Promise.all(jobs)
  } finally {
    loading.value = false
  }
}

async function decide(id: string, decision: 'approve' | 'reject') {
  deciding.value = id
  try {
    await hr.decideLeave(id, decision)
  } catch (err: any) {
    selfError.value = err?.data?.message ?? 'Gagal memproses pengajuan.'
  } finally {
    deciding.value = null
  }
}

// ── Submit form ───────────────────────────────────────────────────────────────

const showForm = ref(false)
const submitting = ref(false)
const formError = ref('')
const form = ref({
  type: 'annual' as 'annual' | 'sick' | 'other',
  start_date: '',
  end_date: '',
  reason: '',
})

function openForm() {
  form.value = { type: 'annual', start_date: '', end_date: '', reason: '' }
  formError.value = ''
  showForm.value = true
}

async function submit() {
  if (submitting.value || !form.value.start_date || !form.value.end_date) return
  submitting.value = true
  formError.value = ''
  try {
    await hr.submitLeave({
      type: form.value.type,
      start_date: form.value.start_date,
      end_date: form.value.end_date,
      reason: form.value.reason || undefined,
    })
    showForm.value = false
    if (canViewAll.value) await hr.fetchLeaves()
  } catch (err: any) {
    formError.value = err?.data?.message ?? 'Gagal mengirim pengajuan. Periksa tanggal dan coba lagi.'
  } finally {
    submitting.value = false
  }
}

watch(statusFilter, () => { /* client-side filter, no refetch needed */ })

onMounted(load)
</script>
