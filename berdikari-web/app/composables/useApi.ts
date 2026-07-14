/**
 * Authenticated API client.
 *
 * Wraps `$fetch` with the correct base URL for the current execution context
 * (internal service URL during SSR, public host URL in the browser) and
 * automatically attaches the Sanctum bearer token from the auth cookie.
 *
 * Usage:
 *   const api = useApi()
 *   const { data } = await api<{ data: Product[] }>('/v1/catalog/products')
 */
export function useApi() {
  const config = useRuntimeConfig()
  const token = useCookie<string | null>('berdikari_token')

  const baseURL = (
    import.meta.server
      ? ((config.apiBaseServer as string) || (config.public.apiBase as string))
      : (config.public.apiBase as string)
  )

  return $fetch.create({
    baseURL,
    onRequest({ options }) {
      if (token.value) {
        options.headers = new Headers(options.headers)
        options.headers.set('Authorization', `Bearer ${token.value}`)
        options.headers.set('Accept', 'application/json')
      }
    },
  })
}
