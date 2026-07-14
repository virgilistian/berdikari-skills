<template>
  <nav class="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none" aria-label="Bagian karyawan">
    <NuxtLink
      v-for="tab in visibleTabs"
      :key="tab.to"
      :to="tab.to"
      class="flex-shrink-0 h-9 px-4 rounded-full text-small font-medium transition-colors flex items-center"
      :class="tab.key === current
        ? 'bg-primary text-primary-foreground'
        : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'"
      :aria-current="tab.key === current ? 'page' : undefined"
    >
      {{ tab.label }}
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '~/stores/auth'

const props = defineProps<{
  current: 'employees' | 'attendance' | 'leave'
}>()

const auth = useAuthStore()

const tabs = [
  { key: 'employees', label: 'Karyawan', to: '/employees', permissions: ['employee.view'] },
  { key: 'attendance', label: 'Absensi', to: '/employees/attendance', permissions: ['attendance.create', 'attendance.view'] },
  { key: 'leave', label: 'Cuti & Izin', to: '/employees/leave', permissions: ['leave.create', 'leave.view', 'leave.approve'] },
] as const

const visibleTabs = computed(() =>
  tabs.filter(tab => tab.permissions.some(p => auth.hasPermission(p)))
)
</script>
