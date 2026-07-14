<template>
  <!-- Desktop-only top navigation bar. Sits above <main> in default.vue. -->
  <header
    class="sticky top-0 z-20 flex items-center justify-between h-14 px-4 bg-surface border-b border-border shadow-elevation-1"
    role="banner"
    aria-label="Navigasi atas"
  >
    <!-- Left: sidebar toggle + page title -->
    <div class="flex items-center gap-3 min-w-0">
      <button
        @click="emit('toggle-sidebar')"
        class="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        :aria-label="sidebarExpanded ? 'Ciutkan sidebar' : 'Perluas sidebar'"
        type="button"
      >
        <Menu class="w-5 h-5" :stroke-width="1.75" />
      </button>

      <h1
        v-if="pageTitle"
        class="text-h3 text-foreground truncate"
        aria-live="polite"
      >
        {{ pageTitle }}
      </h1>
    </div>

    <!-- Right: actions -->
    <div class="flex items-center gap-1 flex-shrink-0">

      <!-- Theme toggle -->
      <button
        @click="toggleTheme"
        class="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        :aria-label="isDark ? 'Aktifkan tema terang' : 'Aktifkan tema gelap'"
        type="button"
      >
        <Sun v-if="isDark" class="w-4.5 h-4.5" :stroke-width="1.75" />
        <Moon v-else class="w-4.5 h-4.5" :stroke-width="1.75" />
      </button>

      <!-- Notification bell -->
      <div class="relative" ref="notifRef">
        <button
          @click="toggleNotifPanel"
          class="relative w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Notifikasi"
          type="button"
        >
          <Bell class="w-4.5 h-4.5" :stroke-width="1.75" />
          <span
            v-if="notifStore.unreadCount > 0"
            class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive"
            :aria-label="`${notifStore.unreadCount} notifikasi belum dibaca`"
          />
        </button>

        <!-- Notification panel -->
        <Transition
          enter-active-class="transition ease-out duration-150"
          enter-from-class="opacity-0 scale-95 -translate-y-1"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition ease-in duration-100"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 -translate-y-1"
        >
          <div
            v-show="notifPanelOpen"
            class="absolute right-0 top-[calc(100%+6px)] w-80 bg-surface rounded-xl border border-border shadow-elevation-3 origin-top-right z-50 flex flex-col overflow-hidden"
            style="max-height: 420px"
          >
            <div class="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
              <span class="text-small font-semibold text-foreground">Notifikasi</span>
              <button
                v-if="notifStore.unreadCount > 0"
                @click="notifStore.markAllRead()"
                class="text-caption text-primary hover:text-primary/80 transition-colors"
              >
                Tandai semua dibaca
              </button>
            </div>
            <div class="overflow-y-auto flex-1">
              <div v-if="notifStore.loading && notifStore.notifications.length === 0" class="p-4 space-y-2">
                <div v-for="i in 3" :key="i" class="skeleton h-12 rounded-lg" />
              </div>
              <div
                v-else-if="notifStore.notifications.length === 0"
                class="flex flex-col items-center justify-center py-10 px-4 text-center"
              >
                <Bell class="w-8 h-8 text-muted-foreground mb-2" :stroke-width="1.5" />
                <p class="text-small text-muted-foreground">Tidak ada notifikasi</p>
              </div>
              <div v-else class="divide-y divide-border">
                <button
                  v-for="notif in notifStore.notifications"
                  :key="notif.id"
                  @click="handleNotifClick(notif)"
                  class="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors"
                  :class="!notif.is_read ? 'bg-primary/4' : ''"
                >
                  <div class="flex items-start gap-2">
                    <div
                      class="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                      :class="!notif.is_read ? 'bg-primary' : 'bg-transparent'"
                    />
                    <div class="min-w-0">
                      <p class="text-small font-medium text-foreground truncate">{{ notif.title }}</p>
                      <p class="text-caption text-muted-foreground mt-0.5 line-clamp-2">{{ notif.body }}</p>
                      <p class="text-caption text-muted-foreground/60 mt-1">{{ formatNotifTime(notif.created_at) }}</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- User avatar dropdown -->
      <div class="relative ml-1" ref="dropdownRef">
        <!-- Trigger -->
        <button
          @click="toggleDropdown"
          @keydown.esc="closeDropdown"
          :aria-expanded="dropdownOpen"
          aria-haspopup="menu"
          aria-controls="user-menu"
          class="flex items-center gap-2 h-9 px-2 rounded-lg hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          type="button"
        >
          <!-- Avatar circle with initials -->
          <div
            class="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"
            aria-hidden="true"
          >
            <span class="text-caption text-primary font-semibold">{{ userInitials }}</span>
          </div>

          <!-- Name + role (hidden on narrower desktops) -->
          <div class="hidden lg:flex flex-col items-start leading-none">
            <span class="text-small text-foreground font-medium truncate max-w-[120px]">
              {{ authStore.user?.name ?? '...' }}
            </span>
            <span class="text-caption text-muted-foreground mt-0.5">{{ roleLabel }}</span>
          </div>

          <ChevronDown
            class="w-3.5 h-3.5 text-muted-foreground transition-transform duration-150"
            :class="{ 'rotate-180': dropdownOpen }"
            :stroke-width="2"
            aria-hidden="true"
          />
        </button>

        <!-- Dropdown panel -->
        <Transition
          enter-active-class="transition ease-out duration-150"
          enter-from-class="opacity-0 scale-95 -translate-y-1"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition ease-in duration-100"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 -translate-y-1"
        >
          <div
            v-show="dropdownOpen"
            id="user-menu"
            role="menu"
            aria-label="Menu pengguna"
            class="absolute right-0 top-[calc(100%+6px)] w-56 bg-surface rounded-xl border border-border shadow-elevation-3 py-1.5 origin-top-right"
            @keydown.esc="closeDropdown"
          >
            <!-- User info header -->
            <div class="px-3 py-2.5 border-b border-border mb-1">
              <p class="text-small text-foreground font-medium truncate">
                {{ authStore.user?.name ?? '...' }}
              </p>
              <p class="text-caption text-muted-foreground mt-0.5">{{ roleLabel }}</p>
            </div>

            <!-- Menu items -->
            <NuxtLink
              to="/settings/profile"
              role="menuitem"
              class="flex items-center gap-2.5 w-full px-3 py-2 text-body text-foreground hover:bg-muted transition-colors min-h-[40px] rounded-lg mx-auto"
              style="width: calc(100% - 0.5rem); margin-left: 0.25rem;"
              @click="closeDropdown"
            >
              <User class="w-4 h-4 text-muted-foreground flex-shrink-0" :stroke-width="1.75" />
              Profil Saya
            </NuxtLink>

            <NuxtLink
              to="/settings"
              role="menuitem"
              class="flex items-center gap-2.5 w-full px-3 py-2 text-body text-foreground hover:bg-muted transition-colors min-h-[40px] rounded-lg mx-auto"
              style="width: calc(100% - 0.5rem); margin-left: 0.25rem;"
              @click="closeDropdown"
            >
              <Settings class="w-4 h-4 text-muted-foreground flex-shrink-0" :stroke-width="1.75" />
              Pengaturan Akun
            </NuxtLink>

            <NuxtLink
              to="/settings/password"
              role="menuitem"
              class="flex items-center gap-2.5 w-full px-3 py-2 text-body text-foreground hover:bg-muted transition-colors min-h-[40px] rounded-lg mx-auto"
              style="width: calc(100% - 0.5rem); margin-left: 0.25rem;"
              @click="closeDropdown"
            >
              <KeyRound class="w-4 h-4 text-muted-foreground flex-shrink-0" :stroke-width="1.75" />
              Ganti Kata Sandi
            </NuxtLink>

            <NuxtLink
              to="/help"
              role="menuitem"
              class="flex items-center gap-2.5 w-full px-3 py-2 text-body text-foreground hover:bg-muted transition-colors min-h-[40px] rounded-lg mx-auto"
              style="width: calc(100% - 0.5rem); margin-left: 0.25rem;"
              @click="closeDropdown"
            >
              <HelpCircle class="w-4 h-4 text-muted-foreground flex-shrink-0" :stroke-width="1.75" />
              Bantuan
            </NuxtLink>

            <!-- Separator + Logout -->
            <div class="border-t border-border mt-1 pt-1">
              <!-- Normal logout trigger -->
              <template v-if="!logoutConfirming">
                <button
                  @click.stop="startLogoutConfirm"
                  role="menuitem"
                  type="button"
                  class="flex items-center gap-2.5 w-full px-3 py-2 text-body text-destructive hover:bg-destructive/10 transition-colors min-h-[40px] rounded-lg"
                  style="width: calc(100% - 0.5rem); margin-left: 0.25rem;"
                >
                  <LogOut class="w-4 h-4 flex-shrink-0" :stroke-width="1.75" />
                  Keluar
                </button>
              </template>

              <!-- Inline logout confirmation -->
              <template v-else>
                <div class="px-3 py-2">
                  <p class="text-small text-muted-foreground mb-2">Yakin ingin keluar?</p>
                  <div class="flex gap-2">
                    <button
                      @click.stop="confirmLogout"
                      :disabled="logoutLoading"
                      type="button"
                      class="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-small font-medium hover:bg-destructive/90 transition-colors disabled:opacity-60 min-h-[36px]"
                    >
                      <Loader2 v-if="logoutLoading" class="w-3.5 h-3.5 animate-spin" />
                      <span>{{ logoutLoading ? 'Keluar...' : 'Ya, Keluar' }}</span>
                    </button>
                    <button
                      @click.stop="cancelLogout"
                      type="button"
                      class="flex-1 px-3 py-1.5 rounded-lg bg-muted text-foreground text-small font-medium hover:bg-muted/80 transition-colors min-h-[36px]"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import {
  Bell, Sun, Moon, User, Settings, KeyRound, HelpCircle,
  LogOut, ChevronDown, Menu, Loader2,
} from '@lucide/vue'
import { useAuthStore } from '~/stores/auth'
import { useNotificationStore } from '~/stores/notifications'
import { usePageTitle } from '~/composables/usePageTitle'

// ── Props & Emits ────────────────────────────────────────────────────────────
const props = defineProps<{
  sidebarExpanded: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle-sidebar'): void
}>()

// ── Stores & composables ─────────────────────────────────────────────────────
const authStore = useAuthStore()
const notifStore = useNotificationStore()
const { pageTitle } = usePageTitle()

// ── Theme toggle ─────────────────────────────────────────────────────────────
// useLocalStorage persists preference; the watcher drives the html class directly.
// This avoids useColorMode SSR hydration issues in Nuxt 4.
const themePreference = useLocalStorage<'light' | 'dark'>('berdikari-theme', 'light')
const isDark = computed(() => themePreference.value === 'dark')

watch(
  isDark,
  (dark) => {
    if (import.meta.client) {
      document.documentElement.classList.toggle('dark', dark)
    }
  },
  { immediate: true },
)

function toggleTheme() {
  themePreference.value = isDark.value ? 'light' : 'dark'
}

// ── Notification panel ────────────────────────────────────────────────────────
const notifPanelOpen = ref(false)
const notifRef = ref<HTMLElement | null>(null)

function toggleNotifPanel() {
  notifPanelOpen.value = !notifPanelOpen.value
  if (notifPanelOpen.value) {
    notifStore.fetchNotifications()
  }
}

function handleNotifClick(notif: { id: string; is_read: boolean }) {
  if (!notif.is_read) notifStore.markRead(notif.id)
}

function formatNotifTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Baru saja'
  if (diffMin < 60) return `${diffMin} menit lalu`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH} jam lalu`
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

// ── Notification placeholder — kept for backward compat ──────────────────────
// Wired to store's count now
const unreadCount = computed(() => notifStore.unreadCount)

// ── User display helpers ──────────────────────────────────────────────────────
const roleLabels: Record<string, string> = {
  owner:      'Pemilik',
  cashier:    'Kasir',
  production: 'Produksi',
}

const roleLabel = computed(() => {
  const role = authStore.user?.role
  return role ? (roleLabels[role] ?? role) : ''
})

const userInitials = computed(() => {
  const name = authStore.user?.name ?? ''
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
})

// ── Dropdown state ────────────────────────────────────────────────────────────
const dropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value
  // Reset logout confirmation when re-opening
  if (!dropdownOpen.value) resetLogoutState()
}

function closeDropdown() {
  dropdownOpen.value = false
  resetLogoutState()
}

// Close on outside click
onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
})

function handleOutsideClick(event: MouseEvent) {
  // Use composedPath() instead of contains() so that nodes detached from the
  // DOM mid-event (e.g. removed by a v-if re-render triggered in the same
  // click handler) are still correctly identified as being inside the dropdown.
  const path = event.composedPath()
  if (dropdownRef.value && !path.includes(dropdownRef.value)) {
    closeDropdown()
  }
  if (notifRef.value && !path.includes(notifRef.value)) {
    notifPanelOpen.value = false
  }
}

// ── Logout (two-step confirmation) ────────────────────────────────────────────
const logoutConfirming = ref(false)
const logoutLoading = ref(false)

function startLogoutConfirm() {
  logoutConfirming.value = true
}

function cancelLogout() {
  logoutConfirming.value = false
}

async function confirmLogout() {
  logoutLoading.value = true
  try {
    await authStore.logout()
    window.location.replace('/login')
  } finally {
    logoutLoading.value = false
    closeDropdown()
  }
}

function resetLogoutState() {
  logoutConfirming.value = false
  logoutLoading.value = false
}
</script>
