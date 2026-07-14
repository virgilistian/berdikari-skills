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
        <h1 class="text-h1 text-foreground">Ganti Kata Sandi</h1>
      </div>
    </div>

    <!-- Card -->
    <div class="bg-surface rounded-xl border border-border shadow-elevation-1 overflow-hidden">
      <!-- Security info banner -->
      <div class="flex items-center gap-3 px-5 py-3.5 bg-muted/30 border-b border-border">
        <ShieldCheck class="w-4 h-4 text-muted-foreground flex-shrink-0" :stroke-width="1.75" />
        <p class="text-small text-muted-foreground">Gunakan kata sandi yang kuat dan unik. Minimal 8 karakter.</p>
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

        <!-- Current password -->
        <div class="space-y-1.5">
          <label for="pw-current" class="text-h3 text-foreground">Kata Sandi Saat Ini</label>
          <div class="relative">
            <Input
              id="pw-current"
              v-model="form.current"
              :type="showCurrent ? 'text' : 'password'"
              placeholder="Kata sandi yang digunakan sekarang"
              required
              :disabled="saving"
              class="h-11 pr-11"
            />
            <button
              type="button"
              @click="showCurrent = !showCurrent"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors w-8 h-8 flex items-center justify-center"
              :aria-label="showCurrent ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'"
            >
              <Eye v-if="!showCurrent" class="w-4 h-4" :stroke-width="1.75" />
              <EyeOff v-else class="w-4 h-4" :stroke-width="1.75" />
            </button>
          </div>
        </div>

        <!-- Divider -->
        <div class="border-t border-border" />

        <!-- New password -->
        <div class="space-y-1.5">
          <label for="pw-new" class="text-h3 text-foreground">Kata Sandi Baru</label>
          <div class="relative">
            <Input
              id="pw-new"
              v-model="form.password"
              :type="showNew ? 'text' : 'password'"
              placeholder="Minimal 8 karakter"
              required
              :disabled="saving"
              class="h-11 pr-11"
            />
            <button
              type="button"
              @click="showNew = !showNew"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors w-8 h-8 flex items-center justify-center"
              :aria-label="showNew ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'"
            >
              <Eye v-if="!showNew" class="w-4 h-4" :stroke-width="1.75" />
              <EyeOff v-else class="w-4 h-4" :stroke-width="1.75" />
            </button>
          </div>
          <!-- Strength indicator -->
          <div class="flex gap-1 mt-1">
            <div
              v-for="i in 4"
              :key="i"
              class="h-1 flex-1 rounded-full transition-colors duration-200"
              :class="strengthBarClass(i)"
            />
          </div>
          <p v-if="form.password" class="text-caption" :class="strengthLabelClass">{{ strengthLabel }}</p>
        </div>

        <!-- Confirm new password -->
        <div class="space-y-1.5">
          <label for="pw-confirm" class="text-h3 text-foreground">Konfirmasi Kata Sandi Baru</label>
          <div class="relative">
            <Input
              id="pw-confirm"
              v-model="form.confirmation"
              :type="showConfirm ? 'text' : 'password'"
              placeholder="Ketik ulang kata sandi baru"
              required
              :disabled="saving"
              class="h-11 pr-11"
              :class="confirmMismatch ? 'border-destructive focus-visible:ring-destructive/50' : ''"
            />
            <button
              type="button"
              @click="showConfirm = !showConfirm"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors w-8 h-8 flex items-center justify-center"
              :aria-label="showConfirm ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'"
            >
              <Eye v-if="!showConfirm" class="w-4 h-4" :stroke-width="1.75" />
              <EyeOff v-else class="w-4 h-4" :stroke-width="1.75" />
            </button>
          </div>
          <p v-if="confirmMismatch" class="text-caption text-destructive">Kata sandi tidak cocok.</p>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 pt-1">
          <NuxtLink to="/settings" class="flex-1">
            <Button type="button" variant="outline" class="w-full" :disabled="saving">Batal</Button>
          </NuxtLink>
          <Button type="submit" class="flex-1" :disabled="saving || !canSubmit">
            <Loader2 v-if="saving" class="w-4 h-4 mr-2 animate-spin" />
            {{ saving ? 'Menyimpan...' : 'Ganti Kata Sandi' }}
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ArrowLeft, ShieldCheck, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  middleware: ['auth'],
  title: 'Ganti Kata Sandi',
})

useHead({ title: 'Ganti Kata Sandi — Berdikari' })

const auth = useAuthStore()

// ── Form state ────────────────────────────────────────────────────────────────
const form = reactive({ current: '', password: '', confirmation: '' })
const showCurrent = ref(false)
const showNew = ref(false)
const showConfirm = ref(false)
const saving = ref(false)
const successMsg = ref('')
const errorMsg = ref('')

// ── Validation helpers ────────────────────────────────────────────────────────
const confirmMismatch = computed(() =>
  form.confirmation.length > 0 && form.password !== form.confirmation,
)

const canSubmit = computed(() =>
  form.current.length > 0 &&
  form.password.length >= 8 &&
  form.password === form.confirmation,
)

// Password strength (0–4)
const strength = computed(() => {
  const p = form.password
  if (!p) return 0
  let score = 0
  if (p.length >= 8) score++
  if (p.length >= 12) score++
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++
  if (/\d/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++
  return Math.min(score, 4)
})

const STRENGTH_COLORS = ['bg-muted', 'bg-destructive', 'bg-yellow-400', 'bg-yellow-500', 'bg-green-500']

function strengthBarClass(idx: number): string {
  return idx <= strength.value ? STRENGTH_COLORS[strength.value] : 'bg-muted'
}

const STRENGTH_LABELS = ['', 'Lemah', 'Cukup', 'Kuat', 'Sangat Kuat']
const STRENGTH_TEXT_CLASSES = ['', 'text-destructive', 'text-yellow-600 dark:text-yellow-400', 'text-yellow-500', 'text-green-600 dark:text-green-400']

const strengthLabel = computed(() => STRENGTH_LABELS[strength.value] ?? '')
const strengthLabelClass = computed(() => STRENGTH_TEXT_CLASSES[strength.value] ?? '')

// ── Save ──────────────────────────────────────────────────────────────────────
async function handleSave() {
  if (!canSubmit.value) return
  saving.value = true
  successMsg.value = ''
  errorMsg.value = ''
  try {
    await auth.changePassword(form.current, form.password, form.confirmation)
    successMsg.value = 'Kata sandi berhasil diubah.'
    // Reset form
    Object.assign(form, { current: '', password: '', confirmation: '' })
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
