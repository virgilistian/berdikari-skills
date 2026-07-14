<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from '@/utils'

const props = defineProps<{ class?: HTMLAttributes["class"] }>()
</script>

<template>
  <div :class="cn('flex shrink-0 items-center justify-between gap-3 px-5 pb-2 pt-3', props.class)">
    <slot />
  </div>
</template>
