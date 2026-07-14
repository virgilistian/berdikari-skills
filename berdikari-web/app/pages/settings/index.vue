<template>
  <div class="p-4 md:p-6 space-y-5">
    <!-- Page Header -->
    <div>
      <p class="text-small text-muted-foreground">{{ today }}</p>
      <h1 class="text-h1 text-foreground mt-0.5">Pengaturan Akun</h1>
    </div>

    <!-- Settings cards grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <!-- Profile -->
      <NuxtLink
        to="/settings/profile"
        class="group bg-surface rounded-xl border border-border shadow-elevation-1 p-5 hover:shadow-elevation-2 hover:border-primary/30 transition-all duration-200"
      >
        <div class="flex items-start gap-4">
          <div class="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
            <UserCircle class="w-5.5 h-5.5 text-primary" :stroke-width="1.75" />
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="text-h3 text-foreground group-hover:text-primary transition-colors">Profil Saya</h2>
            <p class="text-small text-muted-foreground mt-1">Perbarui nama dan alamat email Anda.</p>
            <div class="mt-3 flex items-center gap-1 text-small text-muted-foreground">
              <span class="truncate">{{ auth.user?.name ?? '...' }}</span>
              <span class="text-muted-foreground/50">·</span>
              <span class="truncate">{{ auth.user?.email ?? '' }}</span>
            </div>
          </div>
          <ChevronRight class="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" :stroke-width="1.75" />
        </div>
      </NuxtLink>

      <!-- Change Password -->
      <NuxtLink
        to="/settings/password"
        class="group bg-surface rounded-xl border border-border shadow-elevation-1 p-5 hover:shadow-elevation-2 hover:border-primary/30 transition-all duration-200"
      >
        <div class="flex items-start gap-4">
          <div class="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
            <KeyRound class="w-5.5 h-5.5 text-primary" :stroke-width="1.75" />
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="text-h3 text-foreground group-hover:text-primary transition-colors">Ganti Kata Sandi</h2>
            <p class="text-small text-muted-foreground mt-1">Perbarui kata sandi akun Anda secara berkala untuk keamanan.</p>
          </div>
          <ChevronRight class="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" :stroke-width="1.75" />
        </div>
      </NuxtLink>

      <!-- User Management (if permitted) -->
      <NuxtLink
        v-if="auth.hasPermission('user.manage')"
        to="/users"
        class="group bg-surface rounded-xl border border-border shadow-elevation-1 p-5 hover:shadow-elevation-2 hover:border-primary/30 transition-all duration-200"
      >
        <div class="flex items-start gap-4">
          <div class="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
            <Users class="w-5.5 h-5.5 text-primary" :stroke-width="1.75" />
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="text-h3 text-foreground group-hover:text-primary transition-colors">Manajemen Pengguna</h2>
            <p class="text-small text-muted-foreground mt-1">Tambah, edit, dan hapus pengguna dalam bisnis ini.</p>
          </div>
          <ChevronRight class="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" :stroke-width="1.75" />
        </div>
      </NuxtLink>

      <!-- Role & Permission Management (if permitted) -->
      <NuxtLink
        v-if="auth.hasPermission('role.assign')"
        to="/roles"
        class="group bg-surface rounded-xl border border-border shadow-elevation-1 p-5 hover:shadow-elevation-2 hover:border-primary/30 transition-all duration-200"
      >
        <div class="flex items-start gap-4">
          <div class="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
            <ShieldCheck class="w-5.5 h-5.5 text-primary" :stroke-width="1.75" />
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="text-h3 text-foreground group-hover:text-primary transition-colors">Peran &amp; Akses</h2>
            <p class="text-small text-muted-foreground mt-1">Kelola izin setiap peran dalam bisnis Anda.</p>
          </div>
          <ChevronRight class="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" :stroke-width="1.75" />
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UserCircle, KeyRound, Users, ShieldCheck, ChevronRight } from '@lucide/vue'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  middleware: ['auth'],
  title: 'Pengaturan Akun',
})

useHead({ title: 'Pengaturan Akun — Berdikari' })

const auth = useAuthStore()
const today = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())
</script>
