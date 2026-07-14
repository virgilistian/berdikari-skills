<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { useVModel } from "@vueuse/core"
import { RadioGroupRoot } from "reka-ui"
import { cn } from '@/utils'

const props = defineProps<{
  modelValue?: string
  class?: HTMLAttributes["class"]
}>()
const emits = defineEmits<{ (e: "update:modelValue", payload: string): void }>()
const modelValue = useVModel(props, "modelValue", emits, { passive: true })
</script>

<template>
  <RadioGroupRoot v-model="modelValue" :class="cn('flex flex-col', props.class)">
    <slot />
  </RadioGroupRoot>
</template>
