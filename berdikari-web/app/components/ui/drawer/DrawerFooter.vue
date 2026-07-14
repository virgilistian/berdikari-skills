<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from '@/utils'

const props = defineProps<{ class?: HTMLAttributes["class"] }>()
</script>

<template>
  <div :class="cn('sticky bottom-0 shrink-0 border-t border-border bg-surface p-4 pb-safe', props.class)">
    <slot />
  </div>
</template>
