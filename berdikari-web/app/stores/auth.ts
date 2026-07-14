import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string           // legacy string column — kept for backward compat
  business_id: string | null
  roles: string[]        // spatie roles e.g. ['business-owner']
  permissions: string[]  // spatie permissions e.g. ['finance.view', 'pos.open']
}

export const useAuthStore = defineStore('auth', () => {
  const config = useRuntimeConfig()

  /**
   * Resolve the correct API base for the current execution context.
   * During SSR the Nuxt server must reach the API via the internal service
   * name (apiBaseServer); in the browser it uses the public host-reachable base.
   */
  const apiBase = (): string =>
    import.meta.server
      ? ((config.apiBaseServer as string) || config.public.apiBase)
      : config.public.apiBase

  // useCookie is SSR-safe and persists across page reloads
  const token = useCookie<string | null>('berdikari_token', {
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax',
    default: () => null,
  })

  const user = ref<AuthUser | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  // ── Permission helpers ──────────────────────────────────────────────────────

  /** Returns true if the current user has the exact permission string. */
  const hasPermission = (permission: string): boolean =>
    user.value?.permissions?.includes(permission) ?? false

  /** Returns true if the current user has at least one of the given permissions. */
  const hasAnyPermission = (permissions: string[]): boolean =>
    permissions.some(p => hasPermission(p))

  /** Returns true if the current user holds the given role name. */
  const hasRole = (role: string): boolean =>
    user.value?.roles?.includes(role) ?? false

  // ── API helpers ─────────────────────────────────────────────────────────────

  function getHeaders() {
    return token.value ? { Authorization: `Bearer ${token.value}` } : {}
  }

  async function login(email: string, password: string): Promise<void> {
    const response = await $fetch<{
      success: boolean
      data: { token: string; user: AuthUser }
      message: string
    }>(`${apiBase()}/v1/auth/login`, {
      method: 'POST',
      body: { email, password },
    })

    token.value = response.data.token
    user.value = response.data.user
  }

  async function logout(): Promise<void> {
    if (token.value) {
      try {
        await $fetch(`${apiBase()}/v1/auth/logout`, {
          method: 'POST',
          headers: getHeaders(),
          timeout: 5000,
        })
      } catch {}
    }
    token.value = null
    user.value = null
    // Synchronously remove the cookie from document.cookie so it is absent
    // from the next HTTP request even if the useCookie watcher hasn't flushed.
    if (import.meta.client) {
      document.cookie = 'berdikari_token=; Max-Age=0; Path=/'
    }
  }

  async function updateProfile(name: string, email: string): Promise<void> {
    const response = await $fetch<{ success: boolean; data: AuthUser; message: string }>(
      `${apiBase()}/v1/auth/profile`,
      {
        method: 'PUT',
        headers: getHeaders(),
        body: { name, email },
      },
    )
    user.value = response.data
  }

  async function changePassword(currentPassword: string, password: string, passwordConfirmation: string): Promise<void> {
    await $fetch(
      `${apiBase()}/v1/auth/password`,
      {
        method: 'PUT',
        headers: getHeaders(),
        body: {
          current_password: currentPassword,
          password,
          password_confirmation: passwordConfirmation,
        },
      },
    )
  }

  async function fetchUser(): Promise<void> {
    if (!token.value) return
    try {
      const response = await $fetch<{ success: boolean; data: AuthUser }>(
        `${apiBase()}/v1/auth/me`,
        { headers: getHeaders() },
      )
      user.value = response.data
    } catch {
      token.value = null
      user.value = null
    }
  }

  return {
    token,
    user,
    isAuthenticated,
    // Permission helpers
    hasPermission,
    hasAnyPermission,
    hasRole,
    // API actions
    login,
    logout,
    fetchUser,
    updateProfile,
    changePassword,
    getHeaders,
  }
})
