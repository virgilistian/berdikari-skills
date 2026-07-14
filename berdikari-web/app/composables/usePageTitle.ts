/**
 * usePageTitle
 * Maps the current route path to an Indonesian display title for the TopNav header.
 * Additive only — does not modify any existing page or store.
 */
export function usePageTitle() {
  const route = useRoute()

  const titleMap: Record<string, string> = {
    '/':              'Beranda',
    '/pos':           'Kasir',
    '/finance':       'Keuangan',
    '/finance/new':   'Tambah Transaksi',
    '/catalog':       'Katalog Produk',
    '/inventory':     'Stok',
    '/inventory/new': 'Stok Harian Baru',
    '/reports':       'Laporan',
    '/settings':      'Pengaturan',
  }

  const pageTitle = computed<string>(() => {
    // Prefer explicit meta.title set on the route
    if (route.meta?.title) return String(route.meta.title)
    // Fall back to static map
    return titleMap[route.path] ?? ''
  })

  return { pageTitle }
}
