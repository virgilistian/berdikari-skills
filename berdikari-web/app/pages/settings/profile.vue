<template>
  <div class="p-4 md:p-6 space-y-5 max-w-lg">
    <!-- Page Header with back button -->
    <div class="flex items-center gap-3">
      <NuxtLink
        to="/settings"
        class="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Kembali ke Pengaturan"
      >
        <ArrowLeft class="w-5 h-5" :stroke-width="1.75" />
      </NuxtLink>
      <div>
        <h1 class="text-h1 text-foreground">Profil Saya</h1>
      </div>
    </div>

    <!-- Profile card -->
    <div class="bg-surface rounded-xl border border-border shadow-elevation-1 overflow-hidden">
      <!-- Avatar section -->
      <div class="flex items-center gap-4 px-5 py-5 border-b border-border bg-muted/10">
        <div class="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
          <span class="text-h1 text-primary font-bold">{{ initials }}</span>
        </div>
        <div>
          <p class="text-h3 text-foreground">{{ auth.user?.name ?? '...' }}</p>
          <p class="text-small text-muted-foreground">{{ roleDisplay }}</p>
        </div>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSave" class="px-5 py-5 space-y-4">
        <!-- Success alert -->
        <div
          v-if="successMsg"
          class="flex items-center gap-2 px-3 py-2.5 bg-green-500/10 border border-green-500/20 rounded-lg"
          role="status"
        >
          <CheckCircle2 class="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" :stroke-width="1.75" />
          <p class="text-body text-green-700 dark:text-green-400">{{ successMsg }}</p>
        </div>

        <!-- Error alert -->
        <div
          v-if="errorMsg"
          class="flex items-start gap-2 px-3 py-2.5 bg-destructive/8 border border-destructive/20 rounded-lg"
          role="alert"
        >
          <AlertCircle class="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" :stroke-width="1.75" />
          <p class="text-body text-destructive">{{ errorMsg }}</p>
        </div>

        <!-- Name -->
        <div class="space-y-1.5">
          <label for="profile-name" class="text-h3 text-foreground">Nama Lengkap</label>
          <Input
            id="profile-name"
            v-model="form.name"
            type="text"
            placeholder="Nama lengkap Anda"
            required
            :disabled="saving"
            class="h-11"
          />
        </div>

        <!-- Email -->
        <div class="space-y-1.5">
          <label for="profile-email" class="text-h3 text-foreground">Alamat Email</label>
          <Input
            id="profile-email"
            v-model="form.email"
            type="email"
            placeholder="email@perusahaan.com"
            required
            :disabled="saving"
            class="h-11"
          />
        </div>

        <!-- Actions -->
        <div class="flex gap-3 pt-1">
          <NuxtLink to="/settings" class="flex-1">
            <Button type="button" variant="outline" class="w-full" :disabled="saving">Batal</Button>
          </NuxtLink>
          <Button type="submit" class="flex-1" :disabled="saving || !hasChanges">
            <Loader2 v-if="saving" class="w-4 h-4 mr-2 animate-spin" />
            {{ saving ? 'Menyimpan...' : 'Simpan Perubahan' }}
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  middleware: ['auth'],
  title: 'Profil Saya',
})

useHead({ title: 'Profil Saya — Berdikari' })

const auth = useAuthStore()

// ── Form state ────────────────────────────────────────────────────────────────
const form = reactive({ name: '', email: '' })
const saving = ref(false)
const successMsg = ref('')
const errorMsg = ref('')

onMounted(() => {
  form.name = auth.user?.name ?? ''
  form.email = auth.user?.email ?? ''
})

const hasChanges = computed(() =>
  form.name !== (auth.user?.name ?? '') || form.email !== (auth.user?.email ?? ''),
)

// ── Role display ──────────────────────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  'super-admin':     'Super Admin',
  'business-owner':  'Pemilik Usaha',
  'manager':         'Manajer',
  'supervisor':      'Supervisor',
  'cashier':         'Kasir',
  'kitchen-staff':   'Staf Dapur',
  'inventory-staff': 'Staf Inventori',
  'finance':         'Keuangan',
  'employee':        'Karyawan',
  'viewer':          'Peninjau / Auditor',
}

const roleDisplay = computed(() => {
  const roles = auth.user?.roles ?? []
  if (roles.length === 0) return auth.user?.role ?? 'Pengguna'
  return roles.map(r => ROLE_LABELS[r] ?? r).join(', ')
})

const initials = computed(() => {
  return (auth.user?.name ?? '')
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
})

// ── Save ──────────────────────────────────────────────────────────────────────
async function handleSave() {
  saving.value = true
  successMsg.value = ''
  errorMsg.value = ''
  try {
    await auth.updateProfile(form.name, form.email)
    successMsg.value = 'Profil berhasil diperbarui.'
  } catch (e: any) {
    const msgs = e?.data?.errors
    if (msgs) {
      errorMsg.value = Object.values(msgs).flat().join(' ')
    } else {
      errorMsg.value = e?.data?.message ?? 'Terjadi kesalahan. Coba lagi.'
    }
  } finally {
    saving.value = false
  }
}
</script>
