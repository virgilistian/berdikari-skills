import { ref, watch, type Ref } from 'vue'

/**
 * Bridges a Ref<number|null> to a thousand-separated id-ID display string
 * for price input fields. Mirrors the pattern established in finance/new.vue.
 *
 * Template usage:
 *   <input type="text" inputmode="numeric" :value="display" @input="onInput" placeholder="0" />
 *
 * Programmatic model changes (e.g. from openEdit / reset) are synced via watch.
 */
export function useRupiahInput(model: Ref<number | null>) {
  const display = ref(
    model.value != null ? model.value.toLocaleString('id-ID') : ''
  )

  watch(model, (val) => {
    display.value = val != null ? val.toLocaleString('id-ID') : ''
  })

  function onInput(e: Event) {
    const digits = (e.target as HTMLInputElement).value.replace(/[^0-9]/g, '')
    const num = digits ? parseInt(digits, 10) : null
    model.value = num
    const formatted = num != null ? num.toLocaleString('id-ID') : ''
    display.value = formatted
    ;(e.target as HTMLInputElement).value = formatted
  }

  return { display, onInput }
}
