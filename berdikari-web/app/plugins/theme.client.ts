/**
 * theme.client.ts — restores the user's theme preference on page load.
 * Runs client-side only (before Vue mounts) to avoid flash of wrong theme.
 * Reads the same localStorage key used by TopNav.vue's useLocalStorage call.
 */
export default defineNuxtPlugin(() => {
  const stored = localStorage.getItem('berdikari-theme')
  if (stored === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
})
