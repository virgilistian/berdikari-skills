<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { AlertCircle, Camera, ImageUp, Loader2, Minus, Plus, RefreshCw, ScanLine } from '@lucide/vue'
import { buttonVariants } from '@/components/ui/button'
import {
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerRoot,
  DrawerTitle,
} from '@/components/ui/drawer'
import { cn } from '@/utils'

interface ScannedProduct {
  id: string
  name: string
  price: number
}

interface MatchedItem {
  detected_name: string
  quantity: number
  confidence: 'high' | 'medium' | 'low'
  product: ScannedProduct
  selected: boolean
}

interface UnmatchedItem {
  detected_name: string
  quantity: number
}

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  (e: 'add', items: { product: ScannedProduct, quantity: number }[]): void
}>()

const step = ref<'pick' | 'camera' | 'preview' | 'scanning' | 'result' | 'error'>('pick')
const previewUrl = ref('')
const errorMessage = ref('')
const isDemoResult = ref(false)
const matched = ref<MatchedItem[]>([])
const unmatched = ref<UnmatchedItem[]>([])

let imageFile: File | null = null
let cameraStream: MediaStream | null = null
const videoRef = ref<HTMLVideoElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

const confidenceLabel = { high: 'tinggi', medium: 'sedang', low: 'rendah' } as const

const selectedItems = computed(() =>
  matched.value.filter(item => item.selected),
)

watch(open, (isOpen) => {
  if (!isOpen) reset()
})

onBeforeUnmount(stopCamera)

function reset() {
  stopCamera()
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  step.value = 'pick'
  previewUrl.value = ''
  errorMessage.value = ''
  isDemoResult.value = false
  matched.value = []
  unmatched.value = []
  imageFile = null
}

function stopCamera() {
  cameraStream?.getTracks().forEach(track => track.stop())
  cameraStream = null
}

async function startCamera() {
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    })
    step.value = 'camera'
    // The <video> renders after the step switch
    requestAnimationFrame(() => {
      if (videoRef.value) videoRef.value.srcObject = cameraStream
    })
  }
  catch {
    // No camera / permission denied — fall back to the file picker
    fileInputRef.value?.click()
  }
}

function capturePhoto() {
  const video = videoRef.value
  if (!video) return
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  canvas.getContext('2d')?.drawImage(video, 0, 0)
  canvas.toBlob((blob) => {
    if (!blob) return
    stopCamera()
    setImage(new File([blob], 'plate.jpg', { type: 'image/jpeg' }))
  }, 'image/jpeg', 0.9)
}

function onFilePicked(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) setImage(file)
  ;(event.target as HTMLInputElement).value = ''
}

function setImage(file: File) {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  imageFile = file
  previewUrl.value = URL.createObjectURL(file)
  step.value = 'preview'
}

/**
 * Downscale the photo before upload (max 1280px, JPEG). Smaller uploads are
 * dramatically faster on mobile data and give the AI a consistent input
 * size, which improves detection reliability.
 */
async function optimizeImage(file: File): Promise<File> {
  const MAX_DIMENSION = 1280
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
    if (scale >= 1 && file.type === 'image/jpeg') return file

    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()

    const blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, 'image/jpeg', 0.85))
    return blob ? new File([blob], 'plate.jpg', { type: 'image/jpeg' }) : file
  }
  catch {
    // Optimization is best-effort — fall back to the original photo.
    return file
  }
}

async function scan() {
  if (!imageFile) return
  if (import.meta.client && !navigator.onLine) {
    errorMessage.value = 'Pindai piring membutuhkan koneksi internet. Tambahkan item secara manual saat offline.'
    step.value = 'error'
    return
  }
  step.value = 'scanning'
  const body = new FormData()
  body.append('image', await optimizeImage(imageFile))

  const api = useApi()
  try {
    const result = await api<{ items: Omit<MatchedItem, 'selected'>[], unmatched: UnmatchedItem[], demo?: boolean }>(
      '/v1/sales/scan-plate',
      { method: 'POST', body },
    )
    isDemoResult.value = !!result.demo
    showResult(result.items, result.unmatched)
  }
  catch {
    if (import.meta.dev) {
      // Demo result in dev (API not yet reachable from frontend) — same
      // convention as the simulated checkout on the POS page.
      isDemoResult.value = true
      showResult([
        { detected_name: 'Sate ayam', quantity: 3, confidence: 'high', product: { id: 'p5', name: 'Sate Ayam', price: 3000 } },
        { detected_name: 'Nasi bungkus kecil', quantity: 1, confidence: 'medium', product: { id: 'p1', name: 'Nasi Kucing Teri', price: 3000 } },
      ], [{ detected_name: 'Kerupuk', quantity: 1 }])
    }
    else {
      errorMessage.value = 'Pemindaian gagal. Periksa koneksi dan coba lagi.'
      step.value = 'error'
    }
  }
}

const CONFIDENCE_ORDER = { high: 0, medium: 1, low: 2 } as const

function showResult(items: Omit<MatchedItem, 'selected'>[], unmatchedItems: UnmatchedItem[]) {
  // Most reliable matches first; low-confidence guesses start unchecked so
  // the kasir confirms them deliberately instead of removing them.
  matched.value = [...items]
    .sort((a, b) => CONFIDENCE_ORDER[a.confidence] - CONFIDENCE_ORDER[b.confidence])
    .map(item => ({ ...item, selected: item.confidence !== 'low' }))
  unmatched.value = unmatchedItems
  step.value = 'result'
}

function changeQuantity(item: MatchedItem, delta: number) {
  item.quantity = Math.max(1, item.quantity + delta)
}

function addToOrder() {
  emit('add', selectedItems.value.map(({ product, quantity }) => ({ product, quantity })))
  open.value = false
}
</script>

<template>
  <DrawerRoot v-model:open="open">
    <DrawerContent>
      <DrawerHeader>
        <DrawerTitle>Pindai Piring</DrawerTitle>
      </DrawerHeader>

      <input
        ref="fileInputRef"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        class="hidden"
        @change="onFilePicked"
      >

      <div class="flex-1 overflow-y-auto px-5 pb-4">
        <!-- Pick source -->
        <div v-if="step === 'pick'" class="space-y-3 py-2">
          <p class="text-body text-muted-foreground">
            Foto piring makanan untuk menambahkan item ke pesanan secara otomatis.
          </p>
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-xl border border-border bg-surface px-4 py-4 text-left transition-colors hover:border-primary active:bg-muted/40"
            @click="startCamera"
          >
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Camera class="h-5 w-5 text-primary" :stroke-width="1.75" />
            </span>
            <span>
              <span class="block text-h3 text-foreground">Ambil Foto</span>
              <span class="block text-small text-muted-foreground">Gunakan kamera perangkat</span>
            </span>
          </button>
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-xl border border-border bg-surface px-4 py-4 text-left transition-colors hover:border-primary active:bg-muted/40"
            @click="fileInputRef?.click()"
          >
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <ImageUp class="h-5 w-5 text-primary" :stroke-width="1.75" />
            </span>
            <span>
              <span class="block text-h3 text-foreground">Unggah Gambar</span>
              <span class="block text-small text-muted-foreground">Pilih foto dari galeri</span>
            </span>
          </button>
          <p class="text-small text-muted-foreground">
            Tips: foto dari atas dengan cahaya cukup dan seluruh piring terlihat agar deteksi lebih akurat.
          </p>
        </div>

        <!-- Live camera -->
        <div v-else-if="step === 'camera'" class="space-y-3 py-2">
          <video
            ref="videoRef"
            autoplay
            playsinline
            muted
            class="aspect-[4/3] w-full rounded-xl bg-foreground/90 object-cover"
          />
          <div class="flex gap-2">
            <button
              type="button"
              :class="cn(buttonVariants({ variant: 'outline' }), 'flex-1')"
              @click="stopCamera(); step = 'pick'"
            >
              Batal
            </button>
            <button type="button" :class="cn(buttonVariants(), 'flex-1 gap-2')" @click="capturePhoto">
              <Camera class="h-4 w-4" :stroke-width="1.75" />
              Ambil
            </button>
          </div>
        </div>

        <!-- Preview -->
        <div v-else-if="step === 'preview'" class="space-y-3 py-2">
          <img :src="previewUrl" alt="Pratinjau piring" class="aspect-[4/3] w-full rounded-xl object-cover">
          <div class="flex gap-2">
            <button type="button" :class="cn(buttonVariants({ variant: 'outline' }), 'flex-1')" @click="reset">
              Ganti Foto
            </button>
            <button type="button" :class="cn(buttonVariants(), 'flex-1 gap-2')" @click="scan">
              <ScanLine class="h-4 w-4" :stroke-width="1.75" />
              Pindai
            </button>
          </div>
        </div>

        <!-- Scanning -->
        <div v-else-if="step === 'scanning'" class="flex flex-col items-center justify-center gap-3 py-14 text-center">
          <Loader2 class="h-7 w-7 animate-spin text-primary" :stroke-width="1.75" />
          <p class="text-body text-muted-foreground">
            Mengenali makanan di piring...
          </p>
        </div>

        <!-- Error -->
        <div v-else-if="step === 'error'" class="flex flex-col items-center justify-center gap-4 py-10 text-center">
          <div class="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle class="h-7 w-7 text-destructive" :stroke-width="1.75" />
          </div>
          <div>
            <p class="text-h2 text-foreground">Pemindaian Gagal</p>
            <p class="mt-1 text-body text-muted-foreground">{{ errorMessage }}</p>
          </div>
          <button type="button" :class="cn(buttonVariants({ variant: 'outline' }), 'gap-2')" @click="step = 'preview'">
            <RefreshCw class="h-4 w-4" :stroke-width="1.75" />
            Coba Lagi
          </button>
        </div>

        <!-- Result -->
        <div v-else-if="step === 'result'" class="space-y-3 py-2">
          <p v-if="isDemoResult" class="text-small text-muted-foreground">
            Hasil demo (API tidak terhubung)
          </p>

          <div v-if="matched.length === 0" class="py-8 text-center">
            <p class="text-h3 text-foreground">Tidak ada menu yang cocok</p>
            <p class="mt-1 text-body text-muted-foreground">Coba foto ulang atau tambahkan item secara manual</p>
          </div>

          <label
            v-for="item in matched"
            :key="item.product.id"
            class="flex cursor-pointer items-center gap-3 rounded-lg bg-muted/40 px-3 py-2.5"
          >
            <input
              v-model="item.selected"
              type="checkbox"
              class="h-4 w-4 shrink-0 accent-primary"
              :aria-label="`Pilih ${item.product.name}`"
            >
            <span class="min-w-0 flex-1">
              <span class="block truncate text-h3 text-foreground">{{ item.product.name }}</span>
              <span class="block text-small text-muted-foreground tabular-nums">
                Rp {{ item.product.price.toLocaleString('id-ID') }} · terdeteksi: {{ item.detected_name }} · keyakinan {{ confidenceLabel[item.confidence] }}
              </span>
            </span>
            <span class="flex shrink-0 items-center gap-1">
              <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                :aria-label="`Kurangi ${item.product.name}`"
                @click.prevent="changeQuantity(item, -1)"
              >
                <Minus class="h-3.5 w-3.5" :stroke-width="2" />
              </button>
              <span class="w-6 text-center text-body font-semibold tabular-nums">{{ item.quantity }}</span>
              <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                :aria-label="`Tambah ${item.product.name}`"
                @click.prevent="changeQuantity(item, 1)"
              >
                <Plus class="h-3.5 w-3.5" :stroke-width="2" />
              </button>
            </span>
          </label>

          <div v-if="unmatched.length > 0" class="rounded-lg border border-border px-3 py-2.5">
            <p class="text-small font-medium text-muted-foreground">Terdeteksi tapi tidak ada di menu:</p>
            <p class="mt-0.5 text-small text-muted-foreground">
              {{ unmatched.map(u => `${u.detected_name} (${u.quantity})`).join(', ') }}
            </p>
          </div>
        </div>
      </div>

      <DrawerFooter v-if="step === 'result'">
        <div class="flex w-full gap-2">
          <button type="button" :class="cn(buttonVariants({ variant: 'outline' }), 'flex-1')" @click="reset">
            Pindai Ulang
          </button>
          <button
            type="button"
            :class="cn(buttonVariants(), 'flex-1')"
            :disabled="selectedItems.length === 0"
            @click="addToOrder"
          >
            Tambah ke Pesanan ({{ selectedItems.reduce((total, item) => total + item.quantity, 0) }})
          </button>
        </div>
      </DrawerFooter>
    </DrawerContent>
  </DrawerRoot>
</template>
