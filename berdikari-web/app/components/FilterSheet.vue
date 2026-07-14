<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ChevronDown } from '@lucide/vue'
import { buttonVariants } from '@/components/ui/button'
import {
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerRoot,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { RadioGroupItem, RadioGroupRoot } from '@/components/ui/radio-group'
import { cn } from '@/utils'

interface FilterOption {
  value: string
  label: string
  subtitle?: string
}

const props = defineProps<{
  title: string
  triggerLabel: string
  options: FilterOption[]
  modelValue: string
  defaultValue: string
}>()

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

const open = ref(false)
const staged = ref(props.modelValue)

watch(open, (isOpen) => {
  if (isOpen) staged.value = props.modelValue
})

const isActive = computed(() => props.modelValue !== props.defaultValue)
const triggerText = computed(() =>
  isActive.value
    ? props.options.find(o => o.value === props.modelValue)?.label ?? props.triggerLabel
    : props.triggerLabel,
)

function clear() {
  staged.value = props.defaultValue
}

function confirm() {
  emit('update:modelValue', staged.value)
  open.value = false
}
</script>

<template>
  <DrawerRoot v-model:open="open">
    <DrawerTrigger as-child>
      <button
        type="button"
        class="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border pl-4 pr-3 text-small font-medium transition-colors"
        :class="isActive
          ? 'border-accent bg-accent text-accent-foreground'
          : 'border-border bg-transparent text-muted-foreground hover:border-foreground/40'"
      >
        {{ triggerText }}
        <ChevronDown class="h-3.5 w-3.5 transition-transform" :class="open ? 'rotate-180' : ''" :stroke-width="2" />
      </button>
    </DrawerTrigger>

    <DrawerContent>
      <DrawerHeader>
        <DrawerTitle>{{ title }}</DrawerTitle>
        <button type="button" :class="cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-full')" @click="clear">
          Hapus
        </button>
      </DrawerHeader>

      <div class="flex-1 overflow-y-auto">
        <RadioGroupRoot v-model="staged">
          <label
            v-for="opt in options"
            :key="opt.value"
            class="flex cursor-pointer items-center justify-between gap-3 border-b border-border px-5 py-4 transition-colors last:border-0 active:bg-muted/40"
          >
            <span class="min-w-0">
              <span class="block text-body font-medium text-foreground">{{ opt.label }}</span>
              <span v-if="opt.subtitle" class="mt-0.5 block text-small text-muted-foreground">{{ opt.subtitle }}</span>
            </span>
            <RadioGroupItem :value="opt.value" />
          </label>
        </RadioGroupRoot>
        <slot name="extra" :staged="staged" />
      </div>

      <DrawerFooter>
        <button type="button" :class="cn(buttonVariants(), 'w-full')" @click="confirm">
          Terapkan Filter
        </button>
      </DrawerFooter>
    </DrawerContent>
  </DrawerRoot>
</template>
