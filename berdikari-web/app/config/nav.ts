import type { Component } from 'vue'
import {
  LayoutDashboard, ShoppingCart, Wallet, Package, Boxes, BarChart2, Settings, Users, ShieldCheck, UserCog, CalendarCheck, Clock,
} from '@lucide/vue'

export interface NavItem {
  /** Route path */
  to: string
  /** Lucide Vue icon component */
  icon: Component
  /** Bahasa Indonesia display label */
  label: string
  /**
   * spatie permission names. The nav item is visible if the user holds
   * AT LEAST ONE of these permissions. Empty array = always visible to
   * any authenticated user.
   */
  permissions: string[]
}

/**
 * Static nav registry — permissions drive visibility.
 * When adding a new page, add its entry here — never hardcode nav
 * directly in the layout template.
 *
 * @see §9f of .agents/skills/project/berdikari.md
 */
export const navItems: NavItem[] = [
  {
    to: '/',
    icon: LayoutDashboard,
    label: 'Beranda',
    permissions: [],   // always visible to authenticated users
  },
  {
    to: '/pos',
    icon: ShoppingCart,
    label: 'Kasir',
    permissions: ['pos.view', 'pos.open'],
  },
  {
    to: '/pos/shift',
    icon: Clock,
    label: 'Shift Kasir',
    permissions: ['pos.open', 'pos.close'],
  },
  {
    to: '/finance',
    icon: Wallet,
    label: 'Keuangan',
    permissions: ['finance.view'],
  },
  {
    to: '/catalog',
    icon: Package,
    label: 'Katalog',
    permissions: ['catalog.view'],
  },
  {
    to: '/inventory',
    icon: Boxes,
    label: 'Stok',
    permissions: ['inventory.view'],
  },
  {
    to: '/reports',
    icon: BarChart2,
    label: 'Laporan',
    permissions: ['report.view'],
  },
  {
    to: '/employees',
    icon: Users,
    label: 'Karyawan',
    permissions: ['employee.view'],
  },
  {
    to: '/employees/attendance',
    icon: CalendarCheck,
    label: 'Absensi',
    permissions: ['attendance.create', 'attendance.view'],
  },
  {
    to: '/settings',
    icon: Settings,
    label: 'Pengaturan',
    permissions: ['business.manage', 'user.manage', 'role.assign'],
  },
  {
    to: '/users',
    icon: UserCog,
    label: 'Pengguna',
    permissions: ['user.manage'],
  },
  {
    to: '/roles',
    icon: ShieldCheck,
    label: 'Peran & Akses',
    permissions: ['role.assign'],
  },
]

/**
 * Mobile bottom nav is limited to the 4 highest-frequency destinations:
 * Beranda, Keuangan, Kasir, Stok. Everything else stays reachable through
 * the "Lainnya" sheet rendered by the default layout.
 */
const MOBILE_NAV_ROUTES = ['/', '/finance', '/pos', '/inventory'] as const

export const mobileNavItems: NavItem[] = MOBILE_NAV_ROUTES
  .map(to => navItems.find(item => item.to === to))
  .filter((item): item is NavItem => item !== undefined)

/**
 * Remaining nav items surfaced in the mobile "Lainnya" bottom sheet.
 * Permission-driven visibility applies exactly like the main nav.
 */
export const mobileMoreItems: NavItem[] = navItems.filter(
  item => !MOBILE_NAV_ROUTES.includes(item.to as typeof MOBILE_NAV_ROUTES[number])
)
