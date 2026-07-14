<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { RadioGroupIndicator, RadioGroupItem } from "reka-ui"
import { cn } from '@/utils'

const props = defineProps<{
  value: string
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <RadioGroupItem
    :value="value"
    :class="cn(
      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-border transition-colors data-[state=checked]:border-primary',
      props.class,
    )"
  >
    <RadioGroupIndicator class="flex items-center justify-center">
      <span class="h-2.5 w-2.5 rounded-full bg-primary" />
    </RadioGroupIndicator>
  </RadioGroupItem>
</template>
