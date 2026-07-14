import { useAuthStore } from '~/stores/auth'

/**
 * Route-level permission middleware.
 *
 * Usage in page:
 *   definePageMeta({
 *     middleware: ['auth', 'permission'],
 *     permissions: ['finance.view'],
 *   })
 *
 * The user must hold AT LEAST ONE of the listed permissions.
 * If the list is empty, the route is accessible to any authenticated user.
 * On denial → redirects to /403.
 *
 * NOTE: This is a UX guard only. The API always performs the authoritative check.
 */
export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()
  const required = to.meta.permissions as string[] | undefined

  // No permissions declared → accessible to any authenticated user
  if (!required || required.length === 0) return

  const allowed = required.some(p => auth.hasPermission(p))
  if (!allowed) {
    return navigateTo('/403')
  }
})
