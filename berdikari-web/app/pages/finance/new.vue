<template>
  <div>
  <div class="p-4 md:p-6 max-w-lg mx-auto pb-28 md:pb-6 space-y-6">

    <!-- Back + title -->
    <div class="flex items-center gap-2 -ml-1 pt-1">
      <button
        @click="router.back()"
        class="w-10 h-10 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors flex-shrink-0"
        aria-label="Kembali"
      >
        <ArrowLeft class="w-5 h-5" :stroke-width="1.75" />
      </button>
      <h1 class="text-h1 text-foreground">
        {{ formMode === 'expense' ? 'Catat Pengeluaran' : 'Catat Pemasukan' }}
      </h1>
    </div>

    <!-- Tab switcher -->
    <div class="bg-muted p-1 rounded-xl flex" role="tablist" aria-label="Jenis transaksi">
      <button
        role="tab"
        :aria-selected="formMode === 'expense'"
        @click="switchTab('expense')"
        class="flex-1 h-10 rounded-lg text-body font-semibold transition-all active:scale-[0.97]"
        :class="formMode === 'expense'
          ? 'bg-destructive text-destructive-foreground shadow-elevation-1'
          : 'text-muted-foreground hover:text-foreground'"
      >
        Pengeluaran
      </button>
      <button
        role="tab"
        :aria-selected="formMode === 'income'"
        @click="switchTab('income')"
        class="flex-1 h-10 rounded-lg text-body font-semibold transition-all active:scale-[0.97]"
        :class="formMode === 'income'
          ? 'bg-success text-success-foreground shadow-elevation-1'
          : 'text-muted-foreground hover:text-foreground'"
      >
        Pemasukan
      </button>
    </div>

    <!-- Amount input -->
    <div class="bg-surface rounded-xl border border-border p-5 space-y-3 shadow-elevation-1">
      <label for="amount-input" class="text-small text-muted-foreground block">
        {{ formMode === 'expense' ? 'Berapa yang dikeluarkan?' : 'Berapa pemasukannya?' }}
      </label>
      <div class="flex items-baseline gap-2">
        <span class="text-h2 text-muted-foreground font-semibold select-none">Rp</span>
        <input
          id="amount-input"
          ref="amountInput"
          :value="displayAmount"
          type="text"
          inputmode="numeric"
          pattern="[0-9]*"
          placeholder="0"
          autocomplete="off"
          class="flex-1 min-w-0 bg-transparent text-display text-foreground font-bold outline-none placeholder:text-foreground/20 tabular-nums caret-primary"
          :aria-label="formMode === 'expense' ? 'Jumlah pengeluaran dalam rupiah' : 'Jumlah pemasukan dalam rupiah'"
          @input="onAmountInput"
        />
      </div>
      <div class="h-px bg-border" />
      <!-- Quick amount chips -->
      <div class="flex gap-2 flex-wrap pt-0.5">
        <button
          v-for="quick in quickAmounts"
          :key="quick"
          @click="addQuickAmount(quick)"
          class="h-8 px-3 rounded-full text-small font-medium bg-secondary text-secondary-foreground hover:bg-secondary/70 active:scale-95 transition-all"
          :aria-label="`Tambah Rp ${quick.toLocaleString('id-ID')}`"
        >
          {{ formatQuickAmount(quick) }}
        </button>
      </div>
    </div>

    <!-- ── EXPENSE FORM ── -->
    <template v-if="formMode === 'expense'">

      <!-- Business selector -->
      <div v-if="financeStore.businesses.length > 0" class="space-y-3">
        <div>
          <h2 class="text-h3 text-foreground">Dari bisnis mana?</h2>
          <p class="text-small text-muted-foreground mt-0.5">Pilih bisnis terkait</p>
        </div>
        <div class="flex gap-2 flex-wrap" role="group" aria-label="Pilih bisnis">
          <button
            v-for="biz in financeStore.businesses"
            :key="biz.id"
            @click="selectedBusinessId = biz.id"
            class="h-11 px-4 rounded-lg text-body font-medium transition-all border active:scale-[0.97]"
            :class="selectedBusinessId === biz.id
              ? 'bg-primary text-primary-foreground border-primary shadow-elevation-1'
              : 'bg-surface text-foreground border-border hover:border-primary/40 hover:bg-accent'"
            :aria-pressed="selectedBusinessId === biz.id"
          >
            {{ biz.name }}
          </button>
        </div>
      </div>

      <!-- Category selection -->
      <div class="space-y-3">
        <div>
          <h2 class="text-h3 text-foreground">Digunakan untuk apa?</h2>
          <p class="text-small text-muted-foreground mt-0.5">Pilih satu kategori</p>
        </div>
        <div class="grid grid-cols-2 gap-2" role="group" aria-label="Kategori pengeluaran">
          <button
            v-for="cat in EXPENSE_CATEGORIES"
            :key="cat"
            @click="expenseForm.category = cat"
            class="h-11 px-3 rounded-lg text-body font-medium text-left transition-all border active:scale-[0.97]"
            :class="expenseForm.category === cat
              ? 'bg-primary text-primary-foreground border-primary shadow-elevation-1'
              : 'bg-surface text-foreground border-border hover:border-primary/40 hover:bg-accent'"
            :aria-pressed="expenseForm.category === cat"
          >
            {{ cat }}
          </button>
        </div>
      </div>

      <!-- Notes -->
      <div class="space-y-2">
        <h2 class="text-h3 text-foreground">
          Catatan
          <span class="text-body text-muted-foreground font-normal ml-1">(opsional)</span>
        </h2>
        <textarea
          v-model="expenseForm.notes"
          placeholder="Misal: beli cabai dan bawang di pasar..."
          rows="3"
          class="w-full bg-surface border border-input rounded-lg px-3 py-2.5 text-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors resize-none"
          aria-label="Catatan pengeluaran"
        />
      </div>

    </template>

    <!-- ── INCOME FORM ── -->
    <template v-else>

      <!-- Business selector -->
      <div v-if="financeStore.businesses.length > 0" class="space-y-3">
        <div>
          <h2 class="text-h3 text-foreground">Dari bisnis mana?</h2>
          <p class="text-small text-muted-foreground mt-0.5">Pilih bisnis terkait</p>
        </div>
        <div class="flex gap-2 flex-wrap" role="group" aria-label="Pilih bisnis">
          <button
            v-for="biz in financeStore.businesses"
            :key="biz.id"
            @click="selectedBusinessId = biz.id"
            class="h-11 px-4 rounded-lg text-body font-medium transition-all border active:scale-[0.97]"
            :class="selectedBusinessId === biz.id
              ? 'bg-success text-success-foreground border-success shadow-elevation-1'
              : 'bg-surface text-foreground border-border hover:border-success/40 hover:bg-accent'"
            :aria-pressed="selectedBusinessId === biz.id"
          >
            {{ biz.name }}
          </button>
        </div>
      </div>

      <!-- Category selection -->
      <div class="space-y-3">
        <div>
          <h2 class="text-h3 text-foreground">Dari mana pemasukan ini?</h2>
          <p class="text-small text-muted-foreground mt-0.5">Pilih satu kategori</p>
        </div>
        <div class="grid grid-cols-2 gap-2" role="group" aria-label="Kategori pemasukan">
          <button
            v-for="cat in INCOME_CATEGORIES"
            :key="cat"
            @click="incomeForm.category = cat"
            class="h-11 px-3 rounded-lg text-body font-medium text-left transition-all border active:scale-[0.97]"
            :class="incomeForm.category === cat
              ? 'bg-success text-success-foreground border-success shadow-elevation-1'
              : 'bg-surface text-foreground border-border hover:border-success/40 hover:bg-accent'"
            :aria-pressed="incomeForm.category === cat"
          >
            {{ cat }}
          </button>
        </div>
      </div>

      <!-- Notes -->
      <div class="space-y-2">
        <h2 class="text-h3 text-foreground">
          Catatan
          <span class="text-body text-muted-foreground font-normal ml-1">(opsional)</span>
        </h2>
        <textarea
          v-model="incomeForm.notes"
          placeholder="Misal: pembayaran dari pelanggan setia..."
          rows="3"
          class="w-full bg-surface border border-input rounded-lg px-3 py-2.5 text-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-success transition-colors resize-none"
          aria-label="Catatan pemasukan"
        />
      </div>

    </template>

    <!-- Desktop save button -->
    <div class="hidden md:block">
      <p v-if="saveError" class="text-small text-destructive mb-2">{{ saveError }}</p>
      <button
        @click="save"
        :disabled="!isFormValid || saving"
        class="w-full h-12 rounded-lg font-medium text-body transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
        :class="isFormValid
          ? (formMode === 'expense'
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80'
              : 'bg-success text-success-foreground hover:bg-success/90 active:bg-success/80')
          : 'bg-muted text-muted-foreground cursor-not-allowed'"
      >
        <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
        <template v-else>
          <Check class="w-4 h-4" :stroke-width="2.5" />
          {{ formMode === 'expense' ? 'Simpan Pengeluaran' : 'Simpan Pemasukan' }}
        </template>
      </button>
    </div>

  </div>

  <!-- Mobile fixed save bar -->
  <div
    class="md:hidden fixed bottom-16 left-0 right-0 z-20 bg-surface border-t border-border px-4 pt-3"
    style="padding-bottom: max(0.75rem, env(safe-area-inset-bottom, 0.75rem))"
  >
    <!-- Preview row -->
    <div
      v-if="isFormValid"
      class="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2 mb-2.5"
    >
      <p class="text-small text-muted-foreground truncate mr-3">
        {{ formMode === 'expense' ? expenseForm.category : incomeForm.category }}
      </p>
      <p
        class="text-body font-semibold tabular-nums flex-shrink-0"
        :class="formMode === 'expense' ? 'text-destructive' : 'text-success'"
      >
        {{ formMode === 'expense' ? '−' : '+' }}Rp {{ numericAmount.toLocaleString('id-ID') }}
      </p>
    </div>
    <button
      @click="save"
      :disabled="!isFormValid || saving"
      class="w-full h-12 rounded-lg font-medium text-body transition-all flex items-center justify-center gap-2"
      :class="isFormValid
        ? (formMode === 'expense'
            ? 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 active:scale-[0.98]'
            : 'bg-success text-success-foreground hover:bg-success/90 active:bg-success/80 active:scale-[0.98]')
        : 'bg-muted text-muted-foreground cursor-not-allowed'"
    >
      <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
      <template v-else>
        <Check class="w-4 h-4" :stroke-width="2.5" />
        {{ formMode === 'expense' ? 'Simpan Pengeluaran' : 'Simpan Pemasukan' }}
      </template>
    </button>
  </div>

  <!-- Success overlay -->
  <Transition name="fade">
    <div
      v-if="saved"
      class="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-5 text-center px-8"
      role="dialog"
      aria-modal="true"
      :aria-label="savedMode === 'expense' ? 'Pengeluaran berhasil disimpan' : 'Pemasukan berhasil disimpan'"
    >
      <div
        class="w-16 h-16 rounded-full flex items-center justify-center"
        :class="savedMode === 'expense' ? 'bg-primary/10' : 'bg-success/10'"
      >
        <CheckCircle2
          class="w-8 h-8"
          :class="savedMode === 'expense' ? 'text-primary' : 'text-success'"
          :stroke-width="1.75"
        />
      </div>
      <div>
        <p class="text-h1 text-foreground">
          {{ savedMode === 'expense' ? 'Pengeluaran Tersimpan!' : 'Pemasukan Tersimpan!' }}
        </p>
        <p class="text-body text-muted-foreground mt-1.5 tabular-nums">
          <span
            class="font-semibold"
            :class="savedMode === 'expense' ? 'text-destructive' : 'text-success'"
          >
            {{ savedMode === 'expense' ? '−' : '+' }}Rp {{ savedAmount.toLocaleString('id-ID') }}
          </span>
          {{ savedMode === 'expense' ? 'dari' : 'ke' }} {{ savedSource }}
        </p>
      </div>
      <div class="flex flex-col gap-2 w-full max-w-xs">
        <button
          @click="recordAnother"
          class="h-12 rounded-lg font-medium text-body active:scale-[0.98] transition-all"
          :class="savedMode === 'expense'
            ? 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80'
            : 'bg-success text-success-foreground hover:bg-success/90 active:bg-success/80'"
        >
          Catat Lagi
        </button>
        <button
          @click="router.push('/finance')"
          class="h-12 text-body text-muted-foreground hover:text-foreground transition-colors"
        >
          Kembali ke Keuangan
        </button>
      </div>
    </div>
  </Transition>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'permission'],
  permissions: ['finance.create'],
})

import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Check, CheckCircle2, Loader2 } from '@lucide/vue'
import { useFinanceStore, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '~/stores/finance'
import { useAuthStore } from '~/stores/auth'

const router = useRouter()
const financeStore = useFinanceStore()
const authStore = useAuthStore()

onMounted(() => {
  financeStore.fetchBusinesses().then(() => {
    // Default to the user's own business
    if (!selectedBusinessId.value && authStore.user?.business_id) {
      selectedBusinessId.value = authStore.user.business_id
    }
  })
})

const selectedBusinessId = ref<string | null>(authStore.user?.business_id ?? null)

const amountInput = ref<HTMLInputElement | null>(null)
const rawAmount = ref('')
const displayAmount = ref('')
const saving = ref(false)
const saved = ref(false)
const savedAmount = ref(0)
const savedSource = ref('')
const savedMode = ref<'expense' | 'income'>('expense')
const saveError = ref<string | null>(null)

const formMode = ref<'expense' | 'income'>('expense')

const expenseForm = ref({ category: '', notes: '' })
const incomeForm = ref({ category: '', notes: '' })

const quickAmounts = [10_000, 25_000, 50_000, 100_000, 250_000, 500_000]

const numericAmount = computed(() => {
  const cleaned = rawAmount.value.replace(/[^0-9]/g, '')
  return cleaned ? parseInt(cleaned, 10) : 0
})

const isFormValid = computed(() => {
  if (numericAmount.value <= 0) return false
  return formMode.value === 'expense'
    ? expenseForm.value.category !== ''
    : incomeForm.value.category !== ''
})

function switchTab(tab: 'expense' | 'income') {
  if (formMode.value === tab) return
  formMode.value = tab
  rawAmount.value = ''
  displayAmount.value = ''
  expenseForm.value = { category: '', notes: '' }
  incomeForm.value = { category: '', notes: '' }
  saved.value = false
  setTimeout(() => amountInput.value?.focus(), 50)
}

function onAmountInput(e: Event) {
  const digits = (e.target as HTMLInputElement).value.replace(/[^0-9]/g, '')
  rawAmount.value = digits
  displayAmount.value = digits ? parseInt(digits, 10).toLocaleString('id-ID') : ''
}

function addQuickAmount(amount: number) {
  const newVal = numericAmount.value + amount
  rawAmount.value = String(newVal)
  displayAmount.value = newVal.toLocaleString('id-ID')
}

function formatQuickAmount(amount: number): string {
  if (amount >= 1000000) return `+${amount / 1000000}jt`
  return `+${amount / 1000}rb`
}

async function save() {
  if (!isFormValid.value || saving.value) return
  saving.value = true
  try {
    const isExpense = formMode.value === 'expense'
    const category = isExpense ? expenseForm.value.category : incomeForm.value.category
    const note = (isExpense ? expenseForm.value.notes : incomeForm.value.notes).trim()

    await financeStore.createEntry({
      type: isExpense ? 'expense' : 'income',
      amount: numericAmount.value,
      category,
      note: note || undefined,
      business_id: selectedBusinessId.value ?? undefined,
    })

    savedAmount.value = numericAmount.value
    savedMode.value = formMode.value
    savedSource.value = category
    saved.value = true
  } catch (e: any) {
    saveError.value = e?.data?.message ?? 'Gagal menyimpan transaksi.'
  } finally {
    saving.value = false
  }
}

function recordAnother() {
  rawAmount.value = ''
  displayAmount.value = ''
  expenseForm.value = { category: '', notes: '' }
  incomeForm.value = { category: '', notes: '' }
  saveError.value = null
  saved.value = false
  amountInput.value?.focus()
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
