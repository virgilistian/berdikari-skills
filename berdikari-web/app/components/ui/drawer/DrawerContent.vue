<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { DrawerContent, DrawerHandle, DrawerPortal } from "reka-ui"
import { cn } from '@/utils'
import DrawerOverlay from "./DrawerOverlay.vue"

const props = defineProps<{ class?: HTMLAttributes["class"] }>()
</script>

<template>
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerContent
      :class="cn(
        'fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl bg-surface shadow-elevation-3 outline-none',
        'data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom',
        'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom',
        props.class,
      )"
    >
      <DrawerHandle class="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-muted" />
      <slot />
    </DrawerContent>
  </DrawerPortal>
</template>
