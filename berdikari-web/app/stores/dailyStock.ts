import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from '~/stores/auth'

export interface DailyStockItem {
  id: string
  product_id: string
  product_name: string
  price: number | null
  image_url: string | null
  opening_qty: number
  adjustment_qty: number
  sold_qty: number
  closing_qty: number | null
  status: 'open' | 'closed'
  current_stock?: number | null
  remaining_qty?: number
}

export interface ProductForStock {
  id: string
  name: string
  price: number | null
  image_url: string | null
  current_stock: number
  min_stock: number
}

export const useDailyStockStore = defineStore('dailyStock', () => {
  const stocks = ref<DailyStockItem[]>([])
  const products = ref<ProductForStock[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const today: string = new Date().toISOString().split('T')[0]!

  const hasStocks = computed(() => stocks.value.length > 0)
  const isOpen = computed(() => stocks.value.some(s => s.status === 'open'))
  const isClosed = computed(() => stocks.value.length > 0 && stocks.value.every(s => s.status === 'closed'))

  function businessId(): string | null {
    return useAuthStore().user?.business_id ?? null
  }

  async function fetchToday() {
    loading.value = true
    error.value = null
    try {
      const api = useApi()
      const res = await api<{ data: DailyStockItem[] }>(
        `/v1/inventory/daily-stock/${today}`,
        { query: { business_id: businessId() } }
      )
      stocks.value = res.data
    } catch {
      stocks.value = []
    } finally {
      loading.value = false
    }
  }

  async function fetchProducts() {
    loading.value = true
    try {
      const api = useApi()
      const res = await api<{ data: ProductForStock[] }>('/v1/inventory/daily-stock/products', {
        query: { business_id: businessId() },
      })
      products.value = res.data
    } catch {
      products.value = []
    } finally {
      loading.value = false
    }
  }

  async function openDay(items: { product_id: string; product_name: string; opening_qty: number }[]) {
    loading.value = true
    error.value = null
    try {
      const api = useApi()
      const res = await api<{ data: DailyStockItem[] }>('/v1/inventory/daily-stock/open', {
        method: 'POST',
        body: { business_id: businessId(), date: today, items },
      })
      stocks.value = res.data
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal membuka stok.'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function adjustStock(productId: string, adjustmentQty: number, note?: string) {
    const api = useApi()
    error.value = null
    try {
      const res = await api<{ data: DailyStockItem }>('/v1/inventory/daily-stock/adjust', {
        method: 'POST',
        body: {
          business_id: businessId(),
          date: today,
          product_id: productId,
          adjustment_qty: adjustmentQty,
          adjustment_note: note,
        },
      })
      const idx = stocks.value.findIndex(s => s.product_id === productId)
      if (idx !== -1) stocks.value[idx] = res.data
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal menyesuaikan stok.'
      throw e
    }
  }

  async function closeDay() {
    loading.value = true
    error.value = null
    try {
      const api = useApi()
      const res = await api<{ data: DailyStockItem[] }>('/v1/inventory/daily-stock/close', {
        method: 'POST',
        body: { business_id: businessId(), date: today },
      })
      stocks.value = res.data
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal menutup hari.'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    stocks, products, loading, error, today,
    hasStocks, isOpen, isClosed,
    fetchToday, fetchProducts, openDay, adjustStock, closeDay,
  }
})
