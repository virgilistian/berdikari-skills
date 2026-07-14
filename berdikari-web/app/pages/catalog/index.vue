<template>
  <div class="p-4 md:p-6 max-w-5xl mx-auto">
    <!-- Header row -->
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-h1 text-foreground">Katalog Produk</h1>
      <Button v-if="canManage" class="hidden sm:flex" size="default" @click="openCreate">
        <Plus class="w-4 h-4" :stroke-width="1.75" />
        Tambah Produk
      </Button>
    </div>

    <!-- Search + filter bar -->
    <div class="flex gap-2 mb-4">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" :stroke-width="1.75" />
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Cari produk..."
          class="w-full h-10 pl-9 pr-4 bg-surface border border-input rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
          aria-label="Cari produk"
        />
      </div>
    </div>

    <!-- Category tabs -->
    <div class="flex gap-2 overflow-x-auto pb-1 mb-4 -mx-1 px-1 scrollbar-none" role="list" aria-label="Kategori produk">
      <button
        v-for="cat in categoryPills"
        :key="cat"
        @click="activeCategory = cat"
        class="flex-shrink-0 h-8 px-3 rounded-full text-small font-medium transition-colors"
        :class="activeCategory === cat
          ? 'bg-primary text-primary-foreground'
          : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'"
        :aria-pressed="activeCategory === cat"
      >
        {{ cat }}
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="store.loading" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      <div v-for="i in 8" :key="i" class="skeleton rounded-xl aspect-[3/4]" />
    </div>

    <!-- Empty state (no products at all) -->
    <div
      v-else-if="store.products.length === 0"
      class="flex flex-col items-center text-center gap-4 py-16"
    >
      <div class="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
        <Package class="w-7 h-7 text-muted-foreground" :stroke-width="1.5" />
      </div>
      <div>
        <p class="text-h2 text-foreground">Belum ada produk</p>
        <p class="text-body text-muted-foreground mt-1">Tambahkan produk pertama ke katalog Anda</p>
      </div>
      <Button v-if="canManage" @click="openCreate">
        <Plus class="w-4 h-4" :stroke-width="1.75" />
        Tambah Produk
      </Button>
    </div>

    <!-- Empty search state -->
    <div
      v-else-if="filteredProducts.length === 0"
      class="flex flex-col items-center text-center gap-3 py-14"
    >
      <div class="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
        <PackageSearch class="w-6 h-6 text-muted-foreground" :stroke-width="1.5" />
      </div>
      <div>
        <p class="text-h3 text-foreground">Produk tidak ditemukan</p>
        <p class="text-body text-muted-foreground mt-1">Coba kata kunci atau kategori yang berbeda</p>
      </div>
      <button @click="searchQuery = ''; activeCategory = 'Semua'" class="text-body text-primary hover:text-primary/80 min-h-[44px]">
        Hapus filter
      </button>
    </div>

    <!-- Product grid -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      <div
        v-for="product in filteredProducts"
        :key="product.id"
        class="bg-surface rounded-xl border border-border overflow-hidden hover:shadow-elevation-2 hover:border-border/60 transition-all duration-150 group"
        :class="{ 'opacity-60': !product.is_active }"
      >
        <!-- Image area -->
        <div class="aspect-square bg-muted flex items-center justify-center">
          <Package class="w-8 h-8 text-muted-foreground/40" :stroke-width="1.25" />
        </div>
        <!-- Info -->
        <div class="px-3 py-2.5">
          <div class="flex items-center gap-1.5">
            <p class="text-caption text-muted-foreground flex-1 truncate">{{ product.category?.name ?? 'Tanpa kategori' }}</p>
            <span v-if="!product.is_active" class="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">Nonaktif</span>
          </div>
          <p class="text-h3 text-foreground mt-0.5 line-clamp-2 leading-tight">{{ product.name }}</p>
          <div class="flex items-center justify-between mt-2">
            <div class="min-w-0">
              <p class="text-body text-primary font-semibold tabular-nums">{{ formatRupiah(product.price) }}</p>
            </div>
            <button
              v-if="canManage"
              @click="openEdit(product)"
              class="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex-shrink-0"
              :aria-label="`Ubah ${product.name}`"
            >
              <Pencil class="w-4 h-4" :stroke-width="1.75" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile FAB -->
    <div v-if="canManage" class="sm:hidden fixed bottom-20 right-4 z-10">
      <button
        @click="openCreate"
        class="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-elevation-3 flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Tambah produk baru"
      >
        <Plus class="w-6 h-6" :stroke-width="2" />
      </button>
    </div>

    <!-- Product form sheet -->
    <Transition name="overlay">
      <div v-if="showForm" class="fixed inset-0 bg-foreground/40 z-40 backdrop-blur-[2px]" @click="showForm = false" aria-hidden="true" />
    </Transition>
    <Transition name="sheet">
      <div
        v-if="showForm"
        class="fixed bottom-0 left-0 right-0 md:left-auto md:right-6 md:bottom-6 md:w-[26rem] md:rounded-2xl z-50 bg-surface rounded-t-2xl shadow-elevation-3 flex flex-col max-h-[92svh]"
        role="dialog" aria-modal="true"
      >
        <div class="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <h2 class="text-h2 text-foreground">{{ form.id ? 'Ubah Produk' : 'Produk Baru' }}</h2>
          <button @click="showForm = false" class="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted" aria-label="Tutup">
            <X class="w-4 h-4" :stroke-width="1.75" />
          </button>
        </div>

        <div class="p-4 space-y-4 overflow-y-auto">
          <div>
            <label class="text-small text-muted-foreground">Nama produk</label>
            <input v-model="form.name" type="text" class="mt-1 w-full h-11 px-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary" placeholder="mis. Nasi Kucing Teri" />
            <p v-if="formError.name" class="text-caption text-destructive mt-1">{{ formError.name }}</p>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="text-small text-muted-foreground">Kategori</label>
              <button
                v-if="canManage && !showAddCategory"
                type="button"
                @click="showAddCategory = true"
                class="text-caption text-primary hover:text-primary/80 flex items-center gap-1 min-h-[32px]"
              >
                <Plus class="w-3 h-3" :stroke-width="2" />
                Buat baru
              </button>
            </div>
            <select v-model="form.category_id" class="w-full h-11 px-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary">
              <option :value="null">Tanpa kategori</option>
              <option v-for="c in store.categories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
            <div v-if="showAddCategory" class="mt-2 flex gap-2">
              <input
                v-model="newCategoryName"
                type="text"
                maxlength="255"
                placeholder="Nama kategori baru"
                class="flex-1 h-9 px-3 bg-background border border-input rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary"
                @keyup.enter="addCategory"
                @keyup.esc="showAddCategory = false; newCategoryName = ''"
              />
              <button
                type="button"
                :disabled="savingCategory || !newCategoryName.trim()"
                @click="addCategory"
                class="h-9 w-9 flex items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50 flex-shrink-0"
                aria-label="Simpan kategori"
              >
                <Loader2 v-if="savingCategory" class="w-4 h-4 animate-spin" :stroke-width="2" />
                <Check v-else class="w-4 h-4" :stroke-width="2" />
              </button>
              <button
                type="button"
                @click="showAddCategory = false; newCategoryName = ''"
                class="h-9 w-9 flex items-center justify-center rounded-lg border border-input text-muted-foreground hover:bg-muted flex-shrink-0"
                aria-label="Batal"
              >
                <X class="w-4 h-4" :stroke-width="1.75" />
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-3">
            <div>
              <label class="text-small text-muted-foreground">Harga jual</label>
              <p class="text-caption text-muted-foreground/70 mb-1">Harga yang Anda tawarkan ke pembeli</p>
              <input :value="priceDisplay" @input="onPriceInput" type="text" inputmode="numeric" class="w-full h-11 px-3 bg-background border border-input rounded-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary" placeholder="0" />
              <p v-if="formError.price" class="text-caption text-destructive mt-1">{{ formError.price }}</p>
            </div>
            <div>
              <label class="text-small text-muted-foreground">HPP (modal)</label>
              <p class="text-caption text-muted-foreground/70 mb-1">Modal produksi per unit</p>
              <input :value="costDisplay" @input="onCostInput" type="text" inputmode="numeric" class="w-full h-11 px-3 bg-background border border-input rounded-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary" placeholder="0" />
            </div>
            <p v-if="marginHint" class="text-caption text-muted-foreground">Estimasi laba: <span class="text-success font-medium">{{ marginHint }}</span></p>
          </div>

          <label class="flex items-center justify-between py-1">
            <span class="text-body text-foreground">Produk aktif dijual</span>
            <input v-model="form.is_active" type="checkbox" class="w-5 h-5 accent-primary" />
          </label>
        </div>

        <div class="p-4 border-t border-border flex-shrink-0 space-y-2">
          <button
            :disabled="saving"
            @click="submit"
            class="w-full h-12 rounded-lg font-semibold text-base flex items-center justify-center gap-2"
            :class="saving ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary text-primary-foreground hover:bg-primary/90'"
          >
            <Loader2 v-if="saving" class="w-4 h-4 animate-spin" :stroke-width="2" />
            {{ saving ? 'Menyimpan...' : 'Simpan' }}
          </button>
          <button
            v-if="form.id"
            :disabled="saving"
            @click="remove"
            class="w-full h-11 rounded-lg font-medium text-small text-destructive hover:bg-destructive/10 flex items-center justify-center gap-1.5"
          >
            <Trash2 class="w-4 h-4" :stroke-width="1.75" />
            Hapus produk
          </button>
        </div>
        <div style="height: env(safe-area-inset-bottom, 0px)" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'permission'],
  permissions: ['catalog.view'],
})

import { ref, computed, onMounted, reactive, toRef, type Ref } from 'vue'
import { Plus, Search, Package, PackageSearch, Pencil, X, Loader2, Trash2, Check } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { useCatalogStore, type CatalogProduct, type ProductForm } from '~/stores/catalog'
import { useAuthStore } from '~/stores/auth'
import { formatRupiah } from '~/utils'

const store = useCatalogStore()
const auth = useAuthStore()
const canManage = computed(() => auth.hasAnyPermission(['catalog.create', 'catalog.update']))

const searchQuery = ref('')
const activeCategory = ref('Semua')
const showForm = ref(false)
const saving = ref(false)
const showAddCategory = ref(false)
const newCategoryName = ref('')
const savingCategory = ref(false)

const emptyForm = (): ProductForm => ({
  name: '', category_id: null, price: null, cost_price: null, is_active: true,
})
const form = reactive<ProductForm>(emptyForm())
const { display: priceDisplay, onInput: onPriceInput } = useRupiahInput(toRef(form, 'price') as Ref<number | null>)
const { display: costDisplay, onInput: onCostInput } = useRupiahInput(toRef(form, 'cost_price') as Ref<number | null>)
const formError = reactive<{ name?: string; price?: string }>({})

const categoryPills = computed(() => ['Semua', ...store.categories.map(c => c.name)])

const filteredProducts = computed(() => {
  let list = activeCategory.value === 'Semua'
    ? store.products
    : store.products.filter(p => p.category?.name === activeCategory.value)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(p => p.name.toLowerCase().includes(q))
  }
  return list
})

const marginHint = computed(() => {
  const sell = form.price ?? 0
  const cost = form.cost_price ?? 0
  if (!sell || !cost) return ''
  return formatRupiah(sell - cost)
})

function openCreate() {
  Object.assign(form, emptyForm())
  formError.name = undefined; formError.price = undefined
  showAddCategory.value = false; newCategoryName.value = ''
  showForm.value = true
}

function openEdit(p: CatalogProduct) {
  Object.assign(form, {
    id: p.id,
    name: p.name,
    category_id: p.category_id,
    price: Number(p.price),
    cost_price: Number(p.cost_price),
    is_active: p.is_active,
  })
  formError.name = undefined; formError.price = undefined
  showAddCategory.value = false; newCategoryName.value = ''
  showForm.value = true
}

async function addCategory() {
  const name = newCategoryName.value.trim()
  if (!name) return
  savingCategory.value = true
  try {
    const cat = await store.createCategory(name)
    form.category_id = cat.id
    showAddCategory.value = false
    newCategoryName.value = ''
  } finally {
    savingCategory.value = false
  }
}

async function submit() {
  formError.name = form.name.trim() ? undefined : 'Nama wajib diisi.'
  formError.price = (form.price ?? -1) >= 0 && form.price !== null ? undefined : 'Harga jual wajib diisi.'
  if (formError.name || formError.price) return
  saving.value = true
  try {
    await store.saveProduct({ ...form })
    showForm.value = false
  } finally {
    saving.value = false
  }
}

async function remove() {
  if (!form.id) return
  saving.value = true
  try {
    await store.deleteProduct(form.id)
    showForm.value = false
  } finally {
    saving.value = false
  }
}

onMounted(store.fetchProducts)
</script>
