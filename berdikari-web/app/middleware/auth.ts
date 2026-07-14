import { useAuthStore } from '~/stores/auth'

/**
 * Route guard: redirects unauthenticated users to /login.
 * Token is stored in a cookie (SSR-safe via useCookie in auth store).
 */
export default defineNuxtRouteMiddleware(async (to) => {

  const authStore = useAuthStore()

  if (!authStore.isAuthenticated) {
    // Guests landing on the app root see the public landing page;
    // deep links to protected pages still go straight to login.
    return navigateTo(to.path === '/' ? '/welcome' : '/login')
  }

  // Hydrate the user object when missing — on the server (SSR / refresh /
  // deep-link) as well as the client. This must complete before the
  // `permission` middleware evaluates, otherwise permission-gated pages would
  // wrongly redirect to /403 on a hard load because the user isn't loaded yet.
  if (!authStore.user) {
    await authStore.fetchUser()
    if (!authStore.isAuthenticated) {
      return navigateTo('/login')
    }
  }
})
