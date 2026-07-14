<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { DrawerTitle } from "reka-ui"
import { cn } from '@/utils'

const props = defineProps<{ class?: HTMLAttributes["class"] }>()
</script>

<template>
  <DrawerTitle :class="cn('text-h2 text-foreground', props.class)">
    <slot />
  </DrawerTitle>
</template>
