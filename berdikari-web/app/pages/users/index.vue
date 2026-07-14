<template>
  <div class="p-4 md:p-6 space-y-5">
    <!-- Page Header -->
    <div class="flex items-start justify-between gap-4">
      <div>
        <p class="text-small text-muted-foreground">{{ today }}</p>
        <h1 class="text-h1 text-foreground mt-0.5">Manajemen Pengguna</h1>
      </div>
      <Button
        v-if="auth.hasPermission('user.manage')"
        id="btn-tambah-pengguna"
        size="touch"
        @click="openCreate"
      >
        <UserPlus class="w-4 h-4 mr-2" :stroke-width="1.75" />
        Tambah Pengguna
      </Button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <Loader2 class="w-6 h-6 animate-spin text-muted-foreground" />
    </div>

    <!-- Error state -->
    <div
      v-else-if="fetchError"
      class="flex flex-col items-center justify-center py-20 gap-3 text-center"
    >
      <AlertCircle class="w-10 h-10 text-destructive" :stroke-width="1.5" />
      <p class="text-body text-muted-foreground">{{ fetchError }}</p>
      <Button variant="outline" size="sm" @click="fetchUsers">Coba Lagi</Button>
    </div>

    <!-- User table -->
    <div v-else class="bg-surface rounded-xl border border-border shadow-elevation-1 overflow-hidden">
      <!-- Empty state -->
      <div
        v-if="users.length === 0"
        class="flex flex-col items-center justify-center py-16 gap-3 text-center"
      >
        <Users class="w-10 h-10 text-muted-foreground" :stroke-width="1.5" />
        <p class="text-body text-muted-foreground">Belum ada pengguna dalam bisnis ini.</p>
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-border bg-muted/30">
              <th class="text-left px-4 py-3 text-small font-medium text-muted-foreground">Nama</th>
              <th class="text-left px-4 py-3 text-small font-medium text-muted-foreground hidden md:table-cell">Email</th>
              <th class="text-left px-4 py-3 text-small font-medium text-muted-foreground">Peran</th>
              <th class="text-left px-4 py-3 text-small font-medium text-muted-foreground hidden lg:table-cell">Bergabung</th>
              <th v-if="auth.hasPermission('user.manage')" class="text-right px-4 py-3 text-small font-medium text-muted-foreground">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="user in users"
              :key="user.id"
              class="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
            >
              <!-- Name + email (mobile) -->
              <td class="px-4 py-3">
                <div>
                  <p class="text-body text-foreground font-medium">{{ user.name }}</p>
                  <p class="text-caption text-muted-foreground md:hidden mt-0.5">{{ user.email }}</p>
                </div>
              </td>
              <!-- Email (desktop) -->
              <td class="px-4 py-3 text-body text-foreground hidden md:table-cell">{{ user.email }}</td>
              <!-- Roles -->
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="role in user.roles"
                    :key="role"
                    class="inline-flex items-center px-2 py-0.5 rounded-md text-caption font-medium"
                    :class="roleBadgeClass(role)"
                  >
                    {{ roleLabel(role) }}
                  </span>
                  <span v-if="user.roles.length === 0" class="text-caption text-muted-foreground">—</span>
                </div>
              </td>
              <!-- Created at -->
              <td class="px-4 py-3 text-small text-muted-foreground hidden lg:table-cell">
                {{ formatDate(user.created_at) }}
              </td>
              <!-- Actions -->
              <td v-if="auth.hasPermission('user.manage')" class="px-4 py-3">
                <div class="flex items-center justify-end gap-1">
                  <button
                    @click="openEdit(user)"
                    class="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    :aria-label="`Edit ${user.name}`"
                  >
                    <Pencil class="w-4 h-4" :stroke-width="1.75" />
                  </button>
                  <button
                    @click="confirmDelete(user)"
                    :disabled="user.id === auth.user?.id"
                    class="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    :aria-label="`Hapus ${user.name}`"
                  >
                    <Trash2 class="w-4 h-4" :stroke-width="1.75" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── Create / Edit Modal ──────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="modalOpen"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          @click.self="closeModal"
        >
          <div
            class="w-full max-w-md bg-surface rounded-xl border border-border shadow-elevation-3"
            role="dialog"
            :aria-label="editingUser ? 'Edit Pengguna' : 'Tambah Pengguna'"
          >
            <!-- Modal header -->
            <div class="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 class="text-h3 text-foreground">{{ editingUser ? 'Edit Pengguna' : 'Tambah Pengguna' }}</h2>
              <button
                @click="closeModal"
                class="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Tutup"
              >
                <X class="w-4 h-4" :stroke-width="1.75" />
              </button>
            </div>

            <!-- Modal form -->
            <form @submit.prevent="submitForm" class="px-5 py-4 space-y-4">
              <!-- Error alert -->
              <div
                v-if="formError"
                class="flex items-start gap-2 px-3 py-2.5 bg-destructive/8 border border-destructive/20 rounded-lg"
                role="alert"
              >
                <AlertCircle class="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" :stroke-width="1.75" />
                <p class="text-body text-destructive">{{ formError }}</p>
              </div>

              <!-- Name -->
              <div class="space-y-1.5">
                <label for="form-name" class="text-h3 text-foreground">Nama</label>
                <Input id="form-name" v-model="form.name" type="text" placeholder="Nama lengkap" required :disabled="submitting" class="h-11" />
              </div>

              <!-- Email -->
              <div class="space-y-1.5">
                <label for="form-email" class="text-h3 text-foreground">Email</label>
                <Input id="form-email" v-model="form.email" type="email" placeholder="nama@perusahaan.com" required :disabled="submitting" class="h-11" />
              </div>

              <!-- Password (required for create, optional for edit) -->
              <div class="space-y-1.5">
                <label for="form-password" class="text-h3 text-foreground">
                  Kata Sandi{{ editingUser ? ' (kosongkan jika tidak diubah)' : '' }}
                </label>
                <Input
                  id="form-password"
                  v-model="form.password"
                  type="password"
                  placeholder="Minimal 8 karakter"
                  :required="!editingUser"
                  :disabled="submitting"
                  class="h-11"
                />
              </div>

              <!-- Role -->
              <div class="space-y-1.5">
                <label for="form-role" class="text-h3 text-foreground">Peran</label>
                <select
                  id="form-role"
                  v-model="form.role"
                  required
                  :disabled="submitting"
                  class="w-full h-11 rounded-lg border border-input bg-background px-3 text-body text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="" disabled>Pilih peran...</option>
                  <option v-for="r in availableRoles" :key="r.value" :value="r.value">{{ r.label }}</option>
                </select>
              </div>

              <!-- Actions -->
              <div class="flex gap-3 pt-1">
                <Button type="button" variant="outline" class="flex-1" @click="closeModal" :disabled="submitting">
                  Batal
                </Button>
                <Button type="submit" class="flex-1" :disabled="submitting">
                  <Loader2 v-if="submitting" class="w-4 h-4 mr-2 animate-spin" />
                  {{ submitting ? 'Menyimpan...' : (editingUser ? 'Simpan Perubahan' : 'Buat Pengguna') }}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </Transition>

      <!-- ── Delete Confirmation Modal ──────────────────────────────────── -->
      <Transition
        enter-active-class="transition duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="deleteTarget"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          @click.self="deleteTarget = null"
        >
          <div class="w-full max-w-sm bg-surface rounded-xl border border-border shadow-elevation-3 p-5 space-y-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <Trash2 class="w-5 h-5 text-destructive" :stroke-width="1.75" />
              </div>
              <div>
                <h2 class="text-h3 text-foreground">Hapus Pengguna?</h2>
                <p class="text-body text-muted-foreground mt-0.5">{{ deleteTarget?.name }} akan dihapus dari sistem.</p>
              </div>
            </div>
            <div class="flex gap-3">
              <Button variant="outline" class="flex-1" @click="deleteTarget = null" :disabled="deleting">Batal</Button>
              <Button variant="destructive" class="flex-1" @click="executeDelete" :disabled="deleting">
                <Loader2 v-if="deleting" class="w-4 h-4 mr-2 animate-spin" />
                {{ deleting ? 'Menghapus...' : 'Ya, Hapus' }}
              </Button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Loader2, AlertCircle, Users, UserPlus, Pencil, Trash2, X } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  middleware: ['auth', 'permission'],
  permissions: ['user.manage'],
  title: 'Manajemen Pengguna',
})

useHead({ title: 'Manajemen Pengguna — Berdikari' })

const config = useRuntimeConfig()
const auth = useAuthStore()

// ── Date helpers ─────────────────────────────────────────────────────────────
const today = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))
}

// ── Role helpers ──────────────────────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  'super-admin':    'Super Admin',
  'business-owner': 'Pemilik',
  'manager':        'Manajer',
  'supervisor':     'Supervisor',
  'cashier':        'Kasir',
  'kitchen-staff':  'Staf Dapur',
  'inventory-staff':'Staf Inventori',
  'finance':        'Keuangan',
  'employee':       'Karyawan',
  'viewer':         'Peninjau',
}

const availableRoles = Object.entries(ROLE_LABELS)
  .filter(([v]) => v !== 'super-admin')
  .map(([value, label]) => ({ value, label }))

function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role
}

function roleBadgeClass(role: string): string {
  const map: Record<string, string> = {
    'business-owner': 'bg-primary/10 text-primary',
    'manager':        'bg-accent/80 text-accent-foreground',
    'supervisor':     'bg-accent/60 text-accent-foreground',
    'cashier':        'bg-muted text-foreground',
    'finance':        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'inventory-staff':'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    'kitchen-staff':  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    'employee':       'bg-muted text-muted-foreground',
    'viewer':         'bg-muted text-muted-foreground',
    'super-admin':    'bg-destructive/10 text-destructive',
  }
  return map[role] ?? 'bg-muted text-foreground'
}

// ── API types ─────────────────────────────────────────────────────────────────
interface ApiUser {
  id: string
  name: string
  email: string
  role: string
  business_id: string
  roles: string[]
  permissions: string[]
  created_at: string | null
}

// ── Data fetching ─────────────────────────────────────────────────────────────
const users = ref<ApiUser[]>([])
const loading = ref(false)
const fetchError = ref('')

async function fetchUsers() {
  loading.value = true
  fetchError.value = ''
  try {
    const res = await $fetch<{ success: boolean; data: ApiUser[] }>(
      `${config.public.apiBase}/v1/users`,
      { headers: auth.getHeaders() },
    )
    users.value = res.data
  } catch (e: any) {
    fetchError.value = e?.data?.message ?? 'Gagal memuat daftar pengguna.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchUsers)

// ── Create / Edit modal ───────────────────────────────────────────────────────
const modalOpen = ref(false)
const editingUser = ref<ApiUser | null>(null)
const submitting = ref(false)
const formError = ref('')

const form = reactive({ name: '', email: '', password: '', role: '' })

function openCreate() {
  editingUser.value = null
  Object.assign(form, { name: '', email: '', password: '', role: '' })
  formError.value = ''
  modalOpen.value = true
}

function openEdit(user: ApiUser) {
  editingUser.value = user
  Object.assign(form, {
    name: user.name,
    email: user.email,
    password: '',
    role: user.roles[0] ?? '',
  })
  formError.value = ''
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
}

async function submitForm() {
  submitting.value = true
  formError.value = ''
  try {
    const body: Record<string, string> = {
      name: form.name,
      email: form.email,
      role: form.role,
    }
    if (form.password) body.password = form.password

    if (editingUser.value) {
      await $fetch(`${config.public.apiBase}/v1/users/${editingUser.value.id}`, {
        method: 'PUT',
        headers: auth.getHeaders(),
        body,
      })
    } else {
      await $fetch(`${config.public.apiBase}/v1/users`, {
        method: 'POST',
        headers: auth.getHeaders(),
        body,
      })
    }
    closeModal()
    await fetchUsers()
  } catch (e: any) {
    const msgs = e?.data?.errors
    if (msgs) {
      formError.value = Object.values(msgs).flat().join(' ')
    } else {
      formError.value = e?.data?.message ?? 'Terjadi kesalahan. Coba lagi.'
    }
  } finally {
    submitting.value = false
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────
const deleteTarget = ref<ApiUser | null>(null)
const deleting = ref(false)

function confirmDelete(user: ApiUser) {
  deleteTarget.value = user
}

async function executeDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await $fetch(`${config.public.apiBase}/v1/users/${deleteTarget.value.id}`, {
      method: 'DELETE',
      headers: auth.getHeaders(),
    })
    deleteTarget.value = null
    await fetchUsers()
  } catch (e: any) {
    // Show error briefly then clear target
    alert(e?.data?.message ?? 'Gagal menghapus pengguna.')
  } finally {
    deleting.value = false
  }
}
</script>
