import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'

export interface OrderItem {
  id: string
  product_id: string
  quantity: number
  unit_price: string
  subtotal: string
}

export interface OrderPayment {
  id: string
  amount: string
  method: string
  paid_at: string
}

export interface Order {
  id: string
  order_no: string | null
  status: 'open' | 'completed' | 'cancelled' | 'refunded'
  payment_status: 'unpaid' | 'partial' | 'paid' | 'refunded'
  total_amount: string
  paid_amount: string
  change_amount: string
  balance_due: number
  customer_name: string | null
  note: string | null
  created_at: string
  items: OrderItem[]
  payments: OrderPayment[]
}

export const useOrdersStore = defineStore('orders', () => {
  const orders = ref<Order[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  function bid(): string | null {
    return useAuthStore().user?.business_id ?? null
  }

  async function fetchOrders(filters: { status?: string; payment_status?: string; date?: string } = {}) {
    loading.value = true
    error.value = null
    try {
      const api = useApi()
      const res = await api<{ data: Order[] }>('/v1/sales/orders', {
        query: { business_id: bid(), ...filters },
      })
      orders.value = res.data
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal memuat pesanan.'
      orders.value = []
    } finally {
      loading.value = false
    }
  }

  async function complete(id: string, amount?: number, method = 'cash') {
    const api = useApi()
    const payments = amount && amount > 0 ? [{ amount, method }] : []
    await api(`/v1/sales/orders/${id}/complete`, { method: 'POST', body: { payments } })
    await fetchOrders()
  }

  async function pay(id: string, amount: number, method = 'cash') {
    const api = useApi()
    await api(`/v1/sales/orders/${id}/payments`, { method: 'POST', body: { amount, method } })
    await fetchOrders()
  }

  async function cancel(id: string) {
    const api = useApi()
    await api(`/v1/sales/orders/${id}/cancel`, { method: 'POST' })
    await fetchOrders()
  }

  async function refund(id: string) {
    const api = useApi()
    await api(`/v1/sales/orders/${id}/refund`, { method: 'POST' })
    await fetchOrders()
  }

  return { orders, loading, error, fetchOrders, complete, pay, cancel, refund }
})
