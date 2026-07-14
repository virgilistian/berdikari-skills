<template>
  <div class="w-full max-w-sm">
    <div class="bg-surface rounded-xl border border-border shadow-elevation-2 overflow-hidden">
      <!-- Card header -->
      <div class="px-6 pt-6 pb-4 border-b border-border">
        <h1 class="text-h1 text-foreground">Masuk ke sistem</h1>
        <p class="text-body text-muted-foreground mt-1">Gunakan akun yang diberikan oleh admin</p>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleLogin" class="px-6 py-5 space-y-4">
        <!-- Error state -->
        <div
          v-if="loginError"
          class="flex items-start gap-2 px-3 py-2.5 bg-destructive/8 border border-destructive/20 rounded-lg"
          role="alert"
        >
          <AlertCircle class="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" :stroke-width="1.75" />
          <p class="text-body text-destructive">{{ loginError }}</p>
        </div>

        <div class="space-y-1.5">
          <label for="email" class="text-h3 text-foreground">Email</label>
          <Input
            id="email"
            v-model="email"
            type="email"
            placeholder="nama@perusahaan.com"
            autocomplete="email"
            required
            :disabled="isLoading"
            class="h-11"
          />
        </div>

        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <label for="password" class="text-h3 text-foreground">Password</label>
            <a href="#" class="text-small text-primary hover:text-primary/80 transition-colors min-h-[44px] flex items-center">Lupa password?</a>
          </div>
          <div class="relative">
            <Input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              required
              :disabled="isLoading"
              class="h-11 pr-11"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors min-h-[44px] w-8 flex items-center justify-center"
              :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
            >
              <Eye v-if="!showPassword" class="w-4 h-4" :stroke-width="1.75" />
              <EyeOff v-else class="w-4 h-4" :stroke-width="1.75" />
            </button>
          </div>
        </div>

        <Button
          type="submit"
          class="w-full"
          size="touch"
          :disabled="isLoading"
        >
          <Loader2 v-if="isLoading" class="w-4 h-4 animate-spin" />
          {{ isLoading ? 'Memverifikasi...' : 'Masuk' }}
        </Button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { AlertCircle, Eye, EyeOff, Loader2 } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'auth', middleware: 'guest' })

const router = useRouter()
const authStore = useAuthStore()
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const isLoading = ref(false)
const loginError = ref('')

const handleLogin = async () => {
  loginError.value = ''
  isLoading.value = true
  try {
    await authStore.login(email.value, password.value)
    router.push('/')
  } catch (error: any) {
    loginError.value =
      error?.data?.message || 'Email atau password salah. Silakan coba lagi.'
  } finally {
    isLoading.value = false
  }
}
</script>
