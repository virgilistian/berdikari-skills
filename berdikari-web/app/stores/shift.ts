import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from '~/stores/auth'

export interface CashierShift {
  id: string
  business_id: string
  user_id: string
  status: 'open' | 'closed'
  opening_cash: number
  closing_cash: number | null
  expected_cash: number | null
  cash_difference: number | null
  transaction_count: number
  total_sales: number
  payment_breakdown: Record<string, number> | null
  closing_note: string | null
  opened_at: string
  closed_at: string | null
  cashier?: { id: string; name: string }
}

export const useShiftStore = defineStore('shift', () => {
  const activeShift = ref<CashierShift | null>(null)
  const shifts = ref<CashierShift[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const hasActiveShift = computed(() => activeShift.value !== null && activeShift.value.status === 'open')

  async function fetchActive() {
    const api = useApi()
    loading.value = true
    error.value = null
    try {
      const res = await api<{ data: CashierShift | null }>('/v1/sales/shifts/active')
      activeShift.value = res.data
    } catch {
      activeShift.value = null
    } finally {
      loading.value = false
    }
  }

  async function fetchShifts(filters: { status?: string; date?: string } = {}) {
    const api = useApi()
    loading.value = true
    try {
      const res = await api<{ data: CashierShift[] }>('/v1/sales/shifts', { query: filters })
      shifts.value = res.data
    } finally {
      loading.value = false
    }
  }

  async function openShift(openingCash: number): Promise<CashierShift> {
    const api = useApi()
    loading.value = true
    error.value = null
    try {
      const res = await api<{ data: CashierShift }>('/v1/sales/shifts/open', {
        method: 'POST',
        body: { opening_cash: openingCash },
      })
      activeShift.value = res.data
      return res.data
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal membuka shift.'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function closeShift(id: string, data: { closing_cash: number; closing_note?: string }): Promise<CashierShift> {
    const api = useApi()
    loading.value = true
    error.value = null
    try {
      const res = await api<{ data: CashierShift }>(`/v1/sales/shifts/${id}/close`, {
        method: 'POST',
        body: data,
      })
      activeShift.value = null
      shifts.value = [res.data, ...shifts.value.filter(s => s.id !== id)]
      return res.data
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal menutup shift.'
      throw e
    } finally {
      loading.value = false
    }
  }

  function $reset() {
    activeShift.value = null
    shifts.value = []
    loading.value = false
    error.value = null
  }

  return {
    activeShift,
    shifts,
    loading,
    error,
    hasActiveShift,
    fetchActive,
    fetchShifts,
    openShift,
    closeShift,
    $reset,
  }
})
