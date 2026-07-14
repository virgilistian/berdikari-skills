import { useAuthStore } from '~/stores/auth'

/**
 * Guest middleware: redirects already-authenticated users away from public-only pages.
 * Use via definePageMeta({ middleware: 'guest' }) on the login page.
 */
export default defineNuxtRouteMiddleware(() => {
  const authStore = useAuthStore()

  if (authStore.isAuthenticated) {
    return navigateTo('/')
  }
})
