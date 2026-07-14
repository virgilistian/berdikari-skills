import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'

export interface StockRow {
  product_id: string
  product_name: string
  quantity: number
  min_stock: number
  purchase_price: number
  selling_price: number
  stock_value: number
  retail_value: number
  is_low: boolean
}

export interface StockSummary {
  total_products: number
  total_quantity: number
  stock_value: number
  retail_value: number
  low_stock_count: number
  out_of_stock_count: number
}

export interface StockMovement {
  id: string
  type: 'in' | 'out' | 'adjustment'
  quantity: number
  unit_cost: string
  balance_after: number | null
  reason: string | null
  created_at: string
}

export const useInventoryStore = defineStore('inventory', () => {
  const rows = ref<StockRow[]>([])
  const summary = ref<StockSummary | null>(null)
  const movements = ref<StockMovement[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  function bid(): string | null {
    return useAuthStore().user?.business_id ?? null
  }

  async function fetchStock() {
    loading.value = true
    error.value = null
    try {
      const api = useApi()
      const [list, sum] = await Promise.all([
        api<{ data: StockRow[] }>('/v1/inventory', { query: { business_id: bid() } }),
        api<{ data: StockSummary }>('/v1/inventory/summary', { query: { business_id: bid() } }),
      ])
      rows.value = list.data
      summary.value = sum.data
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal memuat stok.'
      rows.value = []
      summary.value = null
    } finally {
      loading.value = false
    }
  }

  async function receive(productId: string, quantity: number, unitCost?: number, reason?: string) {
    const api = useApi()
    await api('/v1/inventory/receive', {
      method: 'POST',
      body: { business_id: bid(), product_id: productId, quantity, unit_cost: unitCost, reason },
    })
    await fetchStock()
  }

  async function adjust(productId: string, quantity: number, reason?: string) {
    const api = useApi()
    await api('/v1/inventory/adjust', {
      method: 'POST',
      body: { business_id: bid(), product_id: productId, quantity, reason },
    })
    await fetchStock()
  }

  async function setMinStock(productId: string, minStock: number) {
    const api = useApi()
    await api(`/v1/inventory/${productId}/min-stock`, {
      method: 'PUT',
      body: { business_id: bid(), min_stock: minStock },
    })
    await fetchStock()
  }

  async function fetchMovements(productId: string) {
    const api = useApi()
    const res = await api<{ data: StockMovement[] }>(`/v1/inventory/${productId}/movements`, {
      query: { business_id: bid() },
    })
    movements.value = res.data
  }

  return {
    rows, summary, movements, loading, error,
    fetchStock, receive, adjust, setMinStock, fetchMovements,
  }
})
