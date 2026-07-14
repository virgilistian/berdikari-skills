<template>
  <div class="p-4 md:p-6 space-y-5">
    <!-- Page Header -->
    <div>
      <p class="text-small text-muted-foreground">{{ today }}</p>
      <h1 class="text-h1 text-foreground mt-0.5">Peran &amp; Akses</h1>
    </div>

    <!-- Info banner -->
    <div class="flex items-start gap-3 px-4 py-3 bg-accent/30 border border-accent/50 rounded-xl">
      <Info class="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" :stroke-width="1.75" />
      <p class="text-small text-muted-foreground">
        Kelola izin setiap peran dalam bisnis ini. Klik ikon pensil untuk mengubah izin suatu peran. Peran <strong>super-admin</strong> tidak dapat diubah.
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <Loader2 class="w-6 h-6 animate-spin text-muted-foreground" />
    </div>

    <!-- Error -->
    <div v-else-if="fetchError" class="flex flex-col items-center justify-center py-20 gap-3 text-center">
      <AlertCircle class="w-10 h-10 text-destructive" :stroke-width="1.5" />
      <p class="text-body text-muted-foreground">{{ fetchError }}</p>
      <Button variant="outline" size="sm" @click="fetchRoles">Coba Lagi</Button>
    </div>

    <!-- Role cards -->
    <div v-else class="space-y-3">
      <div
        v-for="role in roles"
        :key="role.id"
        class="bg-surface rounded-xl border border-border shadow-elevation-1 overflow-hidden"
      >
        <!-- Role header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
          <div class="flex items-center gap-2.5">
            <ShieldCheck class="w-4.5 h-4.5 text-primary" :stroke-width="1.75" />
            <span class="text-h3 text-foreground">{{ ROLE_LABELS[role.name] ?? role.name }}</span>
            <span class="text-caption text-muted-foreground font-mono">({{ role.name }})</span>
          </div>
          <button
            v-if="role.name !== 'super-admin' && auth.hasPermission('role.assign')"
            @click="openEdit(role)"
            class="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            :aria-label="`Edit izin ${role.name}`"
          >
            <Pencil class="w-4 h-4" :stroke-width="1.75" />
          </button>
        </div>

        <!-- Permission chips -->
        <div class="px-4 py-3">
          <div v-if="role.permissions.length > 0" class="flex flex-wrap gap-1.5">
            <span
              v-for="perm in role.permissions"
              :key="perm"
              class="inline-flex items-center px-2 py-0.5 rounded-md text-caption font-medium bg-primary/8 text-primary border border-primary/20"
            >
              {{ perm }}
            </span>
          </div>
          <p v-else class="text-small text-muted-foreground italic">Tidak ada izin yang ditetapkan.</p>
        </div>
      </div>
    </div>

    <!-- ── Edit Permissions Modal ─────────────────────────────────────────── -->
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
          v-if="editingRole"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          @click.self="closeModal"
        >
          <div
            class="w-full max-w-lg bg-surface rounded-xl border border-border shadow-elevation-3 max-h-[90vh] flex flex-col"
            role="dialog"
            aria-label="Edit Izin Peran"
          >
            <!-- Modal header -->
            <div class="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
              <div>
                <h2 class="text-h3 text-foreground">Edit Izin</h2>
                <p class="text-small text-muted-foreground mt-0.5">{{ ROLE_LABELS[editingRole.name] ?? editingRole.name }}</p>
              </div>
              <button
                @click="closeModal"
                class="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                aria-label="Tutup"
              >
                <X class="w-4 h-4" :stroke-width="1.75" />
              </button>
            </div>

            <!-- Permission checkboxes grouped by resource -->
            <div class="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div
                v-for="(actions, resource) in groupedPermissions"
                :key="resource"
                class="space-y-2"
              >
                <p class="text-small font-semibold text-foreground uppercase tracking-wide">{{ resource }}</p>
                <div class="grid grid-cols-2 gap-1.5">
                  <label
                    v-for="perm in actions"
                    :key="perm"
                    class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      :value="perm"
                      v-model="selectedPermissions"
                      class="w-4 h-4 rounded border-input accent-primary cursor-pointer"
                    />
                    <span class="text-small text-foreground">{{ perm.split('.')[1] }}</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="px-5 py-4 border-t border-border flex gap-3 flex-shrink-0">
              <Button variant="outline" class="flex-1" @click="closeModal" :disabled="saving">Batal</Button>
              <Button class="flex-1" @click="savePermissions" :disabled="saving">
                <Loader2 v-if="saving" class="w-4 h-4 mr-2 animate-spin" />
                {{ saving ? 'Menyimpan...' : 'Simpan Izin' }}
              </Button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Loader2, AlertCircle, ShieldCheck, Pencil, X, Info } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '~/stores/auth'
import { PermissionSeeder } from '~/utils/permissions'

definePageMeta({
  middleware: ['auth', 'permission'],
  permissions: ['role.assign'],
  title: 'Peran & Akses',
})

useHead({ title: 'Peran & Akses — Berdikari' })

const config = useRuntimeConfig()
const auth = useAuthStore()

const today = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())

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

// ── API types ─────────────────────────────────────────────────────────────────
interface ApiRole {
  id: number
  name: string
  permissions: string[]
}

const roles = ref<ApiRole[]>([])
const loading = ref(false)
const fetchError = ref('')

async function fetchRoles() {
  loading.value = true
  fetchError.value = ''
  try {
    const res = await $fetch<{ success: boolean; data: ApiRole[] }>(
      `${config.public.apiBase}/v1/roles`,
      { headers: auth.getHeaders() },
    )
    roles.value = res.data
  } catch (e: any) {
    fetchError.value = e?.data?.message ?? 'Gagal memuat daftar peran.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchRoles)

// ── Group all known permissions by resource ───────────────────────────────────
const groupedPermissions = computed<Record<string, string[]>>(() => {
  return PermissionSeeder.reduce((acc, perm) => {
    const [resource] = perm.split('.')
    if (!acc[resource]) acc[resource] = []
    acc[resource].push(perm)
    return acc
  }, {} as Record<string, string[]>)
})

// ── Edit modal ────────────────────────────────────────────────────────────────
const editingRole = ref<ApiRole | null>(null)
const selectedPermissions = ref<string[]>([])
const saving = ref(false)

function openEdit(role: ApiRole) {
  editingRole.value = role
  selectedPermissions.value = [...role.permissions]
}

function closeModal() {
  editingRole.value = null
  selectedPermissions.value = []
}

async function savePermissions() {
  if (!editingRole.value) return
  saving.value = true
  try {
    const res = await $fetch<{ success: boolean; data: ApiRole }>(
      `${config.public.apiBase}/v1/roles/${editingRole.value.id}/permissions`,
      {
        method: 'PUT',
        headers: auth.getHeaders(),
        body: { permissions: selectedPermissions.value },
      },
    )
    // Update local state
    const idx = roles.value.findIndex(r => r.id === editingRole.value!.id)
    if (idx !== -1) roles.value[idx] = res.data
    closeModal()
  } catch (e: any) {
    alert(e?.data?.message ?? 'Gagal menyimpan izin.')
  } finally {
    saving.value = false
  }
}
</script>
