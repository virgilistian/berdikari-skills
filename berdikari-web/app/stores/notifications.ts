import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface AppNotification {
  id: string
  business_id: string
  user_id: string | null
  role_target: string | null
  type: string
  title: string
  body: string
  meta: Record<string, any> | null
  is_read: boolean
  read_at: string | null
  created_at: string
}

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref<AppNotification[]>([])
  const unreadCount = ref(0)
  const loading = ref(false)
  let pollingTimer: ReturnType<typeof setInterval> | null = null

  const unread = computed(() => notifications.value.filter(n => !n.is_read))

  async function fetchNotifications(limit = 50) {
    const api = useApi()
    loading.value = true
    try {
      const res = await api<{ data: AppNotification[]; unread_count: number }>(
        '/v1/notifications',
        { query: { limit } }
      )
      notifications.value = res.data
      unreadCount.value = res.unread_count
    } catch {
      // graceful fallback — don't break UI if notifications fail
    } finally {
      loading.value = false
    }
  }

  async function fetchUnreadCount() {
    const api = useApi()
    try {
      const res = await api<{ unread_count: number }>('/v1/notifications/unread-count')
      unreadCount.value = res.unread_count
    } catch {
      // silent failure
    }
  }

  async function markRead(id: string) {
    const api = useApi()
    try {
      await api(`/v1/notifications/${id}/read`, { method: 'POST' })
      const n = notifications.value.find(n => n.id === id)
      if (n) {
        n.is_read = true
        n.read_at = new Date().toISOString()
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
    } catch {
      // silent failure
    }
  }

  async function markAllRead() {
    const api = useApi()
    try {
      await api('/v1/notifications/mark-all-read', { method: 'POST' })
      notifications.value.forEach(n => {
        n.is_read = true
        n.read_at = new Date().toISOString()
      })
      unreadCount.value = 0
    } catch {
      // silent failure
    }
  }

  /** Start polling for unread count (every 30s). Call once on app mount. */
  function startPolling(intervalMs = 30_000) {
    stopPolling()
    fetchUnreadCount()
    pollingTimer = setInterval(fetchUnreadCount, intervalMs)
  }

  function stopPolling() {
    if (pollingTimer !== null) {
      clearInterval(pollingTimer)
      pollingTimer = null
    }
  }

  function $reset() {
    notifications.value = []
    unreadCount.value = 0
    loading.value = false
    stopPolling()
  }

  return {
    notifications,
    unreadCount,
    loading,
    unread,
    fetchNotifications,
    fetchUnreadCount,
    markRead,
    markAllRead,
    startPolling,
    stopPolling,
    $reset,
  }
})
