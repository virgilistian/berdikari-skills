<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { DrawerOverlay } from "reka-ui"
import { cn } from '@/utils'

const props = defineProps<{ class?: HTMLAttributes["class"] }>()
</script>

<template>
  <DrawerOverlay
    :class="cn(
      'fixed inset-0 z-50 bg-foreground/40',
      'data-[state=open]:animate-in data-[state=open]:fade-in-0',
      'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
      props.class,
    )"
  />
</template>
