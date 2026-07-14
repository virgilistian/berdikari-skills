import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface CatalogCategory {
  id: string
  name: string
  products_count?: number
}

export interface CatalogProduct {
  id: string
  category_id: string | null
  name: string
  sku: string | null
  price: number | string
  purchase_price: number | string
  cost_price: number | string
  is_active: boolean
  description: string | null
  image_url: string | null
  category?: CatalogCategory | null
}

export interface ProductForm {
  id?: string
  name: string
  category_id: string | null
  price: number | null
  cost_price: number | null
  sku?: string | null
  is_active: boolean
}

export const useCatalogStore = defineStore('catalog', () => {
  const products = ref<CatalogProduct[]>([])
  const categories = ref<CatalogCategory[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchProducts() {
    loading.value = true
    error.value = null
    try {
      const api = useApi()
      const [prod, cat] = await Promise.all([
        api<{ data: CatalogProduct[] }>('/v1/catalog/products'),
        api<{ data: CatalogCategory[] }>('/v1/catalog/categories'),
      ])
      products.value = prod.data
      categories.value = cat.data
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal memuat produk.'
      products.value = []
    } finally {
      loading.value = false
    }
  }

  async function saveProduct(form: ProductForm): Promise<CatalogProduct> {
    const api = useApi()
    const body = {
      name: form.name,
      category_id: form.category_id,
      price: form.price ?? 0,
      cost_price: form.cost_price ?? 0,
      sku: form.sku ?? null,
      is_active: form.is_active,
    }
    const res = form.id
      ? await api<{ data: CatalogProduct }>(`/v1/catalog/products/${form.id}`, { method: 'PUT', body })
      : await api<{ data: CatalogProduct }>('/v1/catalog/products', { method: 'POST', body })
    await fetchProducts()
    return res.data
  }

  async function deleteProduct(id: string) {
    const api = useApi()
    await api(`/v1/catalog/products/${id}`, { method: 'DELETE' })
    await fetchProducts()
  }

  async function createCategory(name: string): Promise<CatalogCategory> {
    const api = useApi()
    const res = await api<{ data: CatalogCategory }>('/v1/catalog/categories', {
      method: 'POST',
      body: { name },
    })
    categories.value.push(res.data)
    return res.data
  }

  return {
    products, categories, loading, error,
    fetchProducts, saveProduct, deleteProduct, createCategory,
  }
})
