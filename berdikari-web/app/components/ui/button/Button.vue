<script setup lang="ts">
import type { Component, HTMLAttributes } from "vue"
import type { ButtonVariants } from "."
import { Primitive } from "reka-ui"
import { cn } from '@/utils'
import { buttonVariants } from "."

const props = withDefaults(
  defineProps<{
    as?: string | Component
    asChild?: boolean
    variant?: ButtonVariants["variant"]
    size?: ButtonVariants["size"]
    class?: HTMLAttributes["class"]
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
  }>(),
  {
    as: "button",
    type: "button",
    asChild: false,
  }
)
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :type="as === 'button' ? props.type : undefined"
    :disabled="props.disabled"
    :class="cn(buttonVariants({ variant, size }), props.class)"
  >
    <slot />
  </Primitive>
</template>
