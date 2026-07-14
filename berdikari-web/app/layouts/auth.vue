<template>
  <div class="min-h-screen bg-background flex flex-col items-center justify-center p-4" style="padding-top: max(env(safe-area-inset-top, 1rem), 1rem)">
    <!-- Brand mark above card -->
    <div class="flex items-center gap-2.5 mb-8">
      <div class="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-elevation-1">
        <span class="text-primary-foreground font-bold text-base leading-none">B</span>
      </div>
      <span class="font-semibold text-foreground text-h2 tracking-tight">Berdikari ERP</span>
    </div>
    <slot />
    <p class="mt-8 text-caption text-muted-foreground text-center">
      &copy; {{ new Date().getFullYear() }} Berdikari Group
    </p>
  </div>
</template>
