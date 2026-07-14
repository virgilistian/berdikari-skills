<template>
  <div v-if="initializing || shiftStore.loading" class="flex items-center justify-center h-[calc(100vh-7.5rem)]">
    <Loader2 class="w-8 h-8 animate-spin text-primary" />
  </div>

  <!-- POS layout: full-screen on mobile, split on desktop. Always usable, shift or no shift. -->
  <div v-else class="flex md:h-[calc(100vh-3.5rem)] h-[calc(100vh-7.5rem)] bg-background overflow-hidden">

    <!-- Left: Product panel -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Shift reminder (dismissible, not a blocker) -->
      <div
        v-if="showShiftReminder"
        class="px-4 py-2 border-b border-border flex items-center gap-2 flex-shrink-0 bg-warning/10"
        role="status"
      >
        <Clock class="w-4 h-4 text-warning flex-shrink-0" :stroke-width="1.75" />
        <p class="text-small flex-1 min-w-0 text-warning">
          Shift belum dibuka — transaksi tetap bisa diproses.
        </p>
        <button
          @click="showOpenForm = true"
          class="text-small text-warning font-semibold min-h-[36px] px-2 hover:text-warning/80 transition-colors flex-shrink-0"
        >
          Buka Shift
        </button>
        <button
          @click="dismissShiftReminder"
          class="w-8 h-8 flex items-center justify-center rounded-lg text-warning hover:bg-warning/10 transition-colors flex-shrink-0"
          aria-label="Tutup pengingat"
        >
          <X class="w-4 h-4" :stroke-width="1.75" />
        </button>
      </div>

      <!-- Offline / sync status banner -->
      <div
        v-if="cartStore.isOffline || cartStore.queuedCount > 0 || failedOrders.length > 0"
        class="px-4 py-2 border-b border-border flex items-center gap-2 flex-shrink-0"
        :class="cartStore.isOffline ? 'bg-warning/10' : 'bg-primary/5'"
        role="status"
        aria-live="polite"
      >
        <WifiOff v-if="cartStore.isOffline" class="w-4 h-4 text-warning flex-shrink-0" :stroke-width="1.75" />
        <RefreshCw v-else class="w-4 h-4 text-primary flex-shrink-0" :class="cartStore.syncing ? 'animate-spin' : ''" :stroke-width="1.75" />
        <p class="text-small flex-1 min-w-0 truncate" :class="cartStore.isOffline ? 'text-warning' : 'text-foreground'">
          <template v-if="cartStore.isOffline">
            Mode offline — transaksi tetap tersimpan di perangkat
            <template v-if="cartStore.queuedCount > 0"> ({{ cartStore.queuedCount }} menunggu)</template>
          </template>
          <template v-else-if="cartStore.syncing">Menyinkronkan {{ cartStore.queuedCount }} transaksi...</template>
          <template v-else-if="cartStore.queuedCount > 0">{{ cartStore.queuedCount }} transaksi offline menunggu sinkronisasi</template>
          <template v-else>{{ failedOrders.length }} transaksi ditolak server</template>
        </p>
        <button
          v-if="!cartStore.isOffline && cartStore.queuedCount > 0 && !cartStore.syncing"
          @click="cartStore.syncPendingOrders()"
          class="text-small text-primary font-medium min-h-[36px] px-2 hover:text-primary/80 transition-colors flex-shrink-0"
        >
          Sinkronkan
        </button>
        <button
          v-if="failedOrders.length > 0"
          @click="discardFailed"
          class="text-small text-destructive font-medium min-h-[36px] px-2 hover:text-destructive/80 transition-colors flex-shrink-0"
        >
          Hapus yang ditolak
        </button>
      </div>

      <!-- Search + filter bar -->
      <div class="px-4 py-3 border-b border-border bg-surface space-y-2.5 flex-shrink-0">
        <div class="flex items-center gap-3">
          <div class="relative flex-1">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" :stroke-width="1.75" />
            <input
              v-model="searchQuery"
              type="search"
              placeholder="Cari menu..."
              class="w-full h-10 pl-9 pr-4 bg-background border border-input rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
              aria-label="Cari produk"
            />
          </div>
          <button
            @click="shiftStore.hasActiveShift ? navigateTo('/pos/shift') : (showOpenForm = true)"
            class="relative flex-shrink-0 w-10 h-10 flex items-center justify-center bg-background border border-input rounded-lg text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            :aria-label="shiftStore.hasActiveShift ? 'Shift aktif — lihat ringkasan shift' : 'Shift belum dibuka — buka shift'"
            :title="shiftStore.hasActiveShift ? 'Shift aktif' : 'Shift belum dibuka'"
          >
            <Clock class="w-4 h-4" :stroke-width="1.75" />
            <span
              class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              :class="shiftStore.hasActiveShift ? 'bg-success animate-pulse' : 'bg-warning'"
              aria-hidden="true"
            />
          </button>
          <button
            @click="showPlateScan = true"
            :disabled="cartStore.isOffline"
            class="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-background border border-input rounded-lg text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:pointer-events-none"
            :aria-label="cartStore.isOffline ? 'Pindai piring tidak tersedia saat offline' : 'Pindai piring'"
            :title="cartStore.isOffline ? 'Tidak tersedia saat offline' : 'Pindai piring'"
          >
            <ScanLine class="w-4 h-4" :stroke-width="1.75" />
          </button>
          <NuxtLink
            to="/pos/orders"
            class="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-background border border-input rounded-lg text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            aria-label="Daftar pesanan"
            title="Daftar pesanan"
          >
            <ReceiptText class="w-4 h-4" :stroke-width="1.75" />
          </NuxtLink>
        </div>

        <!-- Category pills -->
        <div class="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none -mx-1 px-1" role="list" aria-label="Filter kategori">
          <button
            v-for="cat in categories"
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
      </div>

      <!-- Product grid -->
      <main class="flex-1 overflow-y-auto p-4">
        <!-- Loading skeleton -->
        <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <div v-for="i in 8" :key="i" class="skeleton rounded-xl aspect-[3/4]" />
        </div>

        <!-- Empty state -->
        <div
          v-else-if="filteredProducts.length === 0"
          class="flex flex-col items-center justify-center py-16 gap-3 text-center"
        >
          <div class="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <PackageSearch class="w-6 h-6 text-muted-foreground" :stroke-width="1.5" />
          </div>
          <div>
            <p class="text-h3 text-foreground">{{ products.length === 0 ? 'Belum ada produk' : 'Produk tidak ditemukan' }}</p>
            <p class="text-body text-muted-foreground mt-1">
              {{ products.length === 0 ? 'Tambahkan produk di menu Katalog' : 'Coba kata kunci yang berbeda' }}
            </p>
          </div>
          <button v-if="products.length > 0" @click="searchQuery = ''" class="text-body text-primary hover:text-primary/80 min-h-[44px]">Hapus pencarian</button>
        </div>

        <!-- Product grid -->
        <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <button
            v-for="product in filteredProducts"
            :key="product.id"
            @click="cartStore.addToCart(product)"
            class="group flex flex-col bg-surface rounded-xl border border-border overflow-hidden hover:border-primary hover:shadow-elevation-2 transition-all duration-150 active:scale-[0.97] text-left"
            :aria-label="`Tambah ${product.name} ke pesanan`"
          >
            <!-- Product image placeholder -->
            <div class="aspect-square bg-muted flex items-center justify-center">
              <UtensilsCrossed class="w-8 h-8 text-muted-foreground/40" :stroke-width="1.25" />
            </div>
            <!-- Info -->
            <div class="px-3 py-2.5 flex flex-col gap-0.5">
              <p class="text-h3 text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">{{ product.name }}</p>
              <p class="text-body text-primary font-semibold mt-1 tabular-nums">{{ formatRupiah(product.price) }}</p>
            </div>
          </button>
        </div>
      </main>
    </div>

    <!-- Right: Cart panel (desktop only) -->
    <aside class="hidden md:flex w-80 lg:w-96 flex-col border-l border-border bg-surface">
      <CartPanel
        :cart-store="cartStore"
        :is-submitting="cartStore.submitting"
        :checkout-status="checkoutStatus"
        :last-order="cartStore.lastOrder"
        @pay="showPayment = true"
        @paylater="payLater"
        @hold="holdOrder"
        @cancel="cancelCart"
        @reset="resetFlow"
      />
    </aside>

    <!-- Mobile: Floating cart button -->
    <div class="md:hidden fixed bottom-20 right-4 z-20" v-if="cartStore.totalItems > 0">
      <button
        @click="showMobileCart = true"
        class="flex items-center gap-2 bg-primary text-primary-foreground pl-4 pr-5 h-12 rounded-full shadow-elevation-3 font-medium text-body active:scale-95 transition-transform"
        aria-label="Buka pesanan"
      >
        <ShoppingCart class="w-4 h-4" :stroke-width="1.75" />
        <span>Pesanan</span>
        <span class="bg-primary-foreground/20 text-primary-foreground text-xs px-1.5 py-0.5 rounded-full tabular-nums min-w-[1.25rem] text-center">{{ cartStore.totalItems }}</span>
      </button>
    </div>

    <!-- Mobile: Cart bottom sheet overlay -->
    <Transition name="overlay">
      <div
        v-if="showMobileCart"
        class="md:hidden fixed inset-0 bg-foreground/40 z-30 backdrop-blur-[2px]"
        @click="showMobileCart = false"
        aria-hidden="true"
      />
    </Transition>

    <!-- Plate scan (camera / upload) -->
    <PlateScanSheet v-model:open="showPlateScan" @add="addScannedItems" />

    <!-- Mobile: Cart bottom sheet -->
    <Transition name="sheet">
      <div
        v-if="showMobileCart"
        class="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface rounded-t-2xl shadow-elevation-3 flex flex-col max-h-[85svh]"
        role="dialog"
        aria-modal="true"
        aria-label="Pesanan"
      >
        <!-- Sheet handle -->
        <div class="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div class="w-10 h-1 rounded-full bg-border" />
        </div>
        <div class="flex items-center justify-between px-4 pb-3 flex-shrink-0 border-b border-border">
          <h2 class="text-h2 text-foreground">Pesanan</h2>
          <button
            @click="showMobileCart = false"
            class="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Tutup"
          >
            <X class="w-4 h-4" :stroke-width="1.75" />
          </button>
        </div>
        <div class="flex-1 overflow-y-auto">
          <CartPanel
            :cart-store="cartStore"
            :is-submitting="cartStore.submitting"
            :checkout-status="checkoutStatus"
            :last-order="cartStore.lastOrder"
            @pay="showPayment = true"
            @paylater="payLater"
            @hold="holdOrder"
            @cancel="cancelCart"
            @reset="resetFlow(); showMobileCart = false"
          />
        </div>
        <!-- Mobile safe area padding -->
        <div style="height: env(safe-area-inset-bottom, 0px)" />
      </div>
    </Transition>

    <!-- Payment bottom sheet -->
    <Transition name="overlay">
      <div v-if="showPayment" class="fixed inset-0 bg-foreground/40 z-40 backdrop-blur-[2px]" @click="showPayment = false" aria-hidden="true" />
    </Transition>
    <Transition name="sheet">
      <div
        v-if="showPayment"
        class="fixed bottom-0 left-0 right-0 md:left-auto md:right-6 md:bottom-6 md:w-96 md:rounded-2xl z-50 bg-surface rounded-t-2xl shadow-elevation-3 flex flex-col"
        role="dialog" aria-modal="true" aria-label="Pembayaran"
      >
        <div class="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 class="text-h2 text-foreground">Pembayaran</h2>
          <button @click="showPayment = false" class="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted" aria-label="Tutup">
            <X class="w-4 h-4" :stroke-width="1.75" />
          </button>
        </div>
        <div class="p-4 space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-body text-muted-foreground">Total Tagihan</span>
            <span class="text-h1 text-primary tabular-nums">{{ formatRupiah(cartStore.totalAmount) }}</span>
          </div>

          <div>
            <label class="text-small text-muted-foreground">Uang Diterima</label>
            <input
              :value="cashDisplay" @input="onCashInput"
              type="text" inputmode="numeric"
              class="mt-1 w-full h-12 px-3 bg-background border border-input rounded-lg text-h2 tabular-nums focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary"
              placeholder="0"
            />
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              v-for="amt in quickAmounts"
              :key="amt"
              @click="cashTendered = amt"
              class="px-3 h-9 rounded-full bg-secondary text-secondary-foreground text-small font-medium hover:bg-secondary/70"
            >{{ formatRupiah(amt) }}</button>
            <button
              @click="cashTendered = cartStore.totalAmount"
              class="px-3 h-9 rounded-full bg-primary/10 text-primary text-small font-medium"
            >Uang Pas</button>
          </div>

          <div class="flex items-center justify-between" v-if="cashTendered">
            <span class="text-body text-muted-foreground">Kembalian</span>
            <span class="text-h2 tabular-nums" :class="changeDue >= 0 ? 'text-success' : 'text-destructive'">
              {{ formatRupiah(Math.max(0, changeDue)) }}
            </span>
          </div>

          <button
            :disabled="cartStore.submitting || !cashTendered || changeDue < 0"
            @click="confirmPayment"
            class="w-full h-12 rounded-lg font-semibold text-base flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
            :class="(cartStore.submitting || !cashTendered || changeDue < 0) ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary text-primary-foreground hover:bg-primary/90'"
          >
            <Loader2 v-if="cartStore.submitting" class="w-4 h-4 animate-spin" :stroke-width="2" />
            {{ cartStore.submitting ? 'Memproses...' : 'Konfirmasi Pembayaran' }}
          </button>
        </div>
        <div style="height: env(safe-area-inset-bottom, 0px)" />
      </div>
    </Transition>

    <!-- Open shift drawer (reachable from the reminder banner / header status chip, not a gate) -->
    <DrawerRoot v-model:open="showOpenForm">
      <DrawerContent aria-label="Buka shift">
        <DrawerHeader>
          <DrawerTitle>Buka Shift Kasir</DrawerTitle>
        </DrawerHeader>
        <div class="flex-1 overflow-y-auto px-5 pb-4 space-y-4 text-left">
          <p class="text-small text-muted-foreground">
            Masukkan jumlah uang kas awal yang tersedia di laci kasir.
          </p>
          <div>
            <label for="opening-cash" class="text-small text-muted-foreground block mb-1">
              Kas Awal <span class="text-destructive">*</span>
            </label>
            <Input
              id="opening-cash"
              v-model.number="openForm.opening_cash"
              type="number"
              inputmode="numeric"
              min="0"
              step="1000"
              class="h-11"
              placeholder="0"
            />
          </div>
          <p v-if="shiftStore.error" class="text-small text-destructive" role="alert">{{ shiftStore.error }}</p>
        </div>
        <DrawerFooter>
          <div class="flex w-full gap-2">
            <button type="button" :class="cn(buttonVariants({ variant: 'outline' }), 'flex-1')" @click="showOpenForm = false">
              Batal
            </button>
            <button
              type="button"
              :class="cn(buttonVariants(), 'flex-1')"
              :disabled="shiftStore.loading"
              @click="doOpenShift"
            >
              <Loader2 v-if="shiftStore.loading" class="w-4 h-4 animate-spin mr-1" />
              Buka Shift
            </button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </DrawerRoot>
  </div>
</template>

<!-- CartPanel sub-component defined inline -->
<script lang="ts">
import { defineComponent, h, ref as vRef } from 'vue'
import { Minus, Plus, CheckCircle2, AlertCircle, Clock, CloudOff, Save, User } from '@lucide/vue'

function receiptRow(label: string, value: string, valueClass = 'text-foreground') {
  return h('div', { class: 'flex items-center justify-between' }, [
    h('span', { class: 'text-muted-foreground' }, label),
    h('span', { class: `tabular-nums font-medium ${valueClass}` }, value),
  ])
}

export const CartPanel = defineComponent({
  name: 'CartPanel',
  props: {
    cartStore: { type: Object, required: true },
    isSubmitting: { type: Boolean, default: false },
    checkoutStatus: { type: String, default: 'idle' },
    lastOrder: { type: Object, default: null },
  },
  emits: ['pay', 'paylater', 'hold', 'cancel', 'reset'],
  setup(props, { emit }) {
    const confirmCancel = vRef(false)
    return () => {
      const { cartStore, isSubmitting, checkoutStatus, lastOrder } = props

      // Receipt / success state
      if (checkoutStatus === 'success' && lastOrder) {
        const paid = lastOrder.payment_status === 'paid'
        const held = lastOrder.status === 'open'
        const queued = !!cartStore.lastOrderQueued
        return h('div', { class: 'flex flex-col items-center justify-center h-full gap-4 p-8 text-center' }, [
          h('div', { class: `w-14 h-14 rounded-full flex items-center justify-center ${queued ? 'bg-warning/10' : (paid ? 'bg-success/10' : 'bg-warning/10')}` },
            h(queued ? CloudOff : (paid ? CheckCircle2 : Clock), { class: queued ? 'w-7 h-7 text-warning' : (paid ? 'w-7 h-7 text-success' : 'w-7 h-7 text-warning'), strokeWidth: 1.75 })
          ),
          h('div', {}, [
            h('p', { class: 'text-h2 text-foreground' }, queued ? 'Tersimpan Offline' : (held ? 'Pesanan Tersimpan' : (paid ? 'Pembayaran Berhasil' : 'Pesanan Belum Lunas'))),
            h('p', { class: 'text-small text-muted-foreground mt-1' },
              queued ? 'Akan disinkronkan otomatis saat koneksi kembali' : `No. ${lastOrder.order_no ?? '-'}`),
          ]),
          h('div', { class: 'w-full max-w-[16rem] space-y-1 text-body' }, [
            receiptRow('Total', formatRupiah(lastOrder.total_amount)),
            receiptRow('Dibayar', formatRupiah(lastOrder.paid_amount)),
            lastOrder.balance_due > 0 ? receiptRow('Sisa (Piutang)', formatRupiah(lastOrder.balance_due), 'text-warning') : null,
            Number(lastOrder.change_amount) > 0 ? receiptRow('Kembalian', formatRupiah(lastOrder.change_amount), 'text-success') : null,
          ]),
          h('button', {
            class: 'text-body text-primary font-medium min-h-[44px] hover:text-primary/80 transition-colors',
            onClick: () => emit('reset'),
          }, 'Transaksi baru'),
        ])
      }

      // Error state
      if (checkoutStatus === 'error') {
        return h('div', { class: 'flex flex-col items-center justify-center h-full gap-4 p-8 text-center' }, [
          h('div', { class: 'w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center' },
            h(AlertCircle, { class: 'w-7 h-7 text-destructive', strokeWidth: 1.75 })
          ),
          h('div', {}, [
            h('p', { class: 'text-h2 text-foreground' }, 'Transaksi Gagal'),
            h('p', { class: 'text-body text-muted-foreground mt-1' }, 'Periksa koneksi dan coba lagi'),
          ]),
          h('button', {
            class: 'text-body text-primary font-medium min-h-[44px] hover:text-primary/80 transition-colors',
            onClick: () => emit('reset'),
          }, 'Coba lagi'),
        ])
      }

      return h('div', { class: 'flex flex-col h-full' }, [
        // Empty state
        cartStore.items.length === 0
          ? h('div', { class: 'flex-1 flex flex-col items-center justify-center gap-3 text-center px-6' }, [
              h('div', { class: 'w-12 h-12 rounded-full bg-muted flex items-center justify-center' },
                h(CheckCircle2, { class: 'w-6 h-6 text-muted-foreground', strokeWidth: 1.5 })
              ),
              h('p', { class: 'text-h3 text-foreground' }, 'Pesanan kosong'),
              h('p', { class: 'text-body text-muted-foreground' }, 'Pilih menu dari daftar produk'),
            ])
          : h('div', { class: 'flex-1 overflow-y-auto p-4 space-y-2' },
              cartStore.items.map((item: any) =>
                h('div', {
                  key: item.product_id,
                  class: 'flex items-center gap-3 bg-muted/40 rounded-lg px-3 py-2.5',
                }, [
                  h('div', { class: 'flex-1 min-w-0' }, [
                    h('p', { class: 'text-h3 text-foreground truncate' }, item.name),
                    h('p', { class: 'text-small text-muted-foreground tabular-nums' }, formatRupiah(item.unit_price)),
                  ]),
                  h('div', { class: 'flex items-center gap-1 flex-shrink-0' }, [
                    h('button', {
                      class: 'w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors',
                      'aria-label': `Kurangi ${item.name}`,
                      onClick: () => cartStore.decreaseQuantity(item.product_id),
                    }, h(Minus, { class: 'w-3.5 h-3.5', strokeWidth: 2 })),
                    h('span', { class: 'w-6 text-center text-body font-semibold tabular-nums' }, item.quantity),
                    h('button', {
                      class: 'w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors',
                      'aria-label': `Tambah ${item.name}`,
                      onClick: () => cartStore.increaseQuantity(item.product_id),
                    }, h(Plus, { class: 'w-3.5 h-3.5', strokeWidth: 2 })),
                  ]),
                ])
              )
            ),

        // Footer
        h('div', { class: 'p-4 border-t border-border flex-shrink-0 space-y-3 bg-surface' }, [
          // Customer name / table number
          h('div', { class: 'relative' }, [
            h(User, { class: 'absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none', strokeWidth: 1.75 }),
            h('input', {
              type: 'text',
              value: cartStore.customerName,
              placeholder: 'Nama / No. Meja (opsional)',
              class: 'w-full h-9 pl-8 pr-3 bg-background border border-input rounded-lg text-small text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors',
              onInput: (e: Event) => { cartStore.customerName = (e.target as HTMLInputElement).value },
            }),
          ]),
          h('div', { class: 'flex items-center justify-between' }, [
            h('span', { class: 'text-h3 text-muted-foreground' }, 'Total'),
            h('span', { class: 'text-display text-primary tabular-nums' }, formatRupiah(cartStore.totalAmount)),
          ]),
          h('button', {
            class: `w-full h-12 rounded-lg font-semibold text-base flex items-center justify-center gap-2 transition-colors active:scale-[0.98] ${
              cartStore.items.length === 0 || isSubmitting
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`,
            disabled: cartStore.items.length === 0 || isSubmitting,
            onClick: () => emit('pay'),
          }, 'Bayar Sekarang'),
          h('div', { class: 'grid grid-cols-2 gap-2' }, [
            h('button', {
              class: 'h-11 rounded-lg font-medium text-small flex items-center justify-center gap-1.5 border border-border text-foreground hover:bg-muted disabled:opacity-50',
              disabled: cartStore.items.length === 0 || isSubmitting,
              onClick: () => emit('paylater'),
            }, [h(Clock, { class: 'w-4 h-4', strokeWidth: 1.75 }), 'Bayar Nanti']),
            h('button', {
              class: 'h-11 rounded-lg font-medium text-small flex items-center justify-center gap-1.5 border border-border text-foreground hover:bg-muted disabled:opacity-50',
              disabled: cartStore.items.length === 0 || isSubmitting,
              onClick: () => emit('hold'),
            }, [h(Save, { class: 'w-4 h-4', strokeWidth: 1.75 }), 'Simpan']),
          ]),
          cartStore.items.length > 0
            ? (confirmCancel.value
              ? h('div', { class: 'flex items-center justify-between gap-2 pt-1' }, [
                  h('span', { class: 'text-small text-muted-foreground' }, 'Yakin batalkan pesanan ini?'),
                  h('div', { class: 'flex gap-2' }, [
                    h('button', {
                      class: 'text-small font-medium text-destructive hover:text-destructive/80 transition-colors min-h-[36px] px-2',
                      onClick: () => { confirmCancel.value = false; emit('cancel') },
                    }, 'Ya, batalkan'),
                    h('button', {
                      class: 'text-small text-muted-foreground hover:text-foreground transition-colors min-h-[36px] px-2',
                      onClick: () => { confirmCancel.value = false },
                    }, 'Tidak'),
                  ]),
                ])
              : h('button', {
                  class: 'w-full text-small text-muted-foreground hover:text-destructive transition-colors min-h-[36px]',
                  onClick: () => { confirmCancel.value = true },
                }, 'Batalkan Pesanan')
            )
            : null,
        ]),
      ])
    }
  }
})
</script>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'permission'],
  permissions: ['pos.view', 'pos.open'],
})

import { ref, computed, onMounted } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { Search, ShoppingCart, PackageSearch, UtensilsCrossed, X, ScanLine, Loader2, ReceiptText, RefreshCw, WifiOff, Clock } from '@lucide/vue'
import { useCartStore } from '~/stores/cart'
import { useShiftStore } from '~/stores/shift'
import { formatRupiah, cn } from '~/utils'
import { buttonVariants } from '~/components/ui/button'
import PlateScanSheet from '~/components/PlateScanSheet.vue'

const cartStore = useCartStore()
const shiftStore = useShiftStore()
const api = useApi()

const showOpenForm = ref(false)
const openForm = ref({ opening_cash: 0 })

async function doOpenShift() {
  try {
    await shiftStore.openShift(openForm.value.opening_cash ?? 0)
    showOpenForm.value = false
    openForm.value = { opening_cash: 0 }
  } catch { /* error handled by store */ }
}

/** Shift reminder: dismissible for the rest of the day, resurfaces next day if still no shift. */
const shiftReminderDismissedDate = useLocalStorage('berdikari_shift_reminder_dismissed', '')
const showShiftReminder = computed(() =>
  !shiftStore.hasActiveShift && shiftReminderDismissedDate.value !== new Date().toDateString()
)
function dismissShiftReminder() {
  shiftReminderDismissedDate.value = new Date().toDateString()
}

interface ApiProduct { id: string; name: string; price: number; category?: { name?: string } | null }

const products = ref<ApiProduct[]>([])
const loading = ref(true)
const showMobileCart = ref(false)
const showPlateScan = ref(false)
const showPayment = ref(false)
const checkoutStatus = ref<'idle' | 'success' | 'error'>('idle')
const searchQuery = ref('')
const activeCategory = ref('Semua')
const cashTendered = ref<number | null>(null)
const { display: cashDisplay, onInput: onCashInput } = useRupiahInput(cashTendered)

const categories = computed(() => {
  const names = products.value.map(p => p.category?.name).filter(Boolean) as string[]
  return ['Semua', ...Array.from(new Set(names))]
})

const filteredProducts = computed(() => {
  let list = activeCategory.value === 'Semua'
    ? products.value
    : products.value.filter(p => p.category?.name === activeCategory.value)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(p => p.name.toLowerCase().includes(q))
  }
  return list
})

const changeDue = computed(() => (cashTendered.value ?? 0) - cartStore.totalAmount)

const failedOrders = computed(() => cartStore.pendingOrders.filter(o => o.status === 'failed'))

function discardFailed() {
  for (const order of failedOrders.value) cartStore.discardPendingOrder(order.client_uuid)
}

const quickAmounts = computed(() => {
  const total = cartStore.totalAmount
  const bases = [5000, 10000, 20000, 50000, 100000]
  return bases.filter(b => b >= total).slice(0, 4)
})

async function loadProducts() {
  loading.value = true
  try {
    const res = await api<{ data: ApiProduct[] }>('/v1/catalog/products', { query: { active_only: 1 } })
    products.value = res.data
  } catch {
    products.value = []
  } finally {
    loading.value = false
  }
}

const initializing = ref(true)

onMounted(async () => {
  await Promise.all([
    loadProducts(),
    shiftStore.fetchActive()
  ])
  initializing.value = false
})

const addScannedItems = (items: { product: { id: string, name: string, price: number }, quantity: number }[]) => {
  for (const { product, quantity } of items) {
    for (let i = 0; i < quantity; i++) cartStore.addToCart(product)
  }
}

async function confirmPayment() {
  try {
    await cartStore.submitOrder({ action: 'complete', payment: cashTendered.value ?? 0, method: 'cash' })
    showPayment.value = false
    checkoutStatus.value = 'success'
  } catch {
    checkoutStatus.value = 'error'
  }
}

function cancelCart() {
  cartStore.clearCart()
}

async function payLater() {
  try {
    await cartStore.submitOrder({ action: 'complete' })
    checkoutStatus.value = 'success'
  } catch {
    checkoutStatus.value = 'error'
  }
}

async function holdOrder() {
  try {
    await cartStore.submitOrder({ action: 'hold' })
    checkoutStatus.value = 'success'
  } catch {
    checkoutStatus.value = 'error'
  }
}

function resetFlow() {
  checkoutStatus.value = 'idle'
  cashTendered.value = null
  cartStore.lastOrder = null
}
</script>
