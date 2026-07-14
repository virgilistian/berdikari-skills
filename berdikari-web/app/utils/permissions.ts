/**
 * Canonical list of all Berdikari permissions.
 * This mirrors PermissionSeeder::PERMISSIONS on the backend.
 * Use this in the frontend to drive the permission-editing UI — never hardcode permission strings elsewhere.
 */
export const PermissionSeeder: string[] = [
  // POS / Kasir
  'pos.view',
  'pos.open',
  'pos.close',

  // Finance / Keuangan
  'finance.view',
  'finance.create',
  'finance.update',
  'finance.delete',
  'finance.export',

  // Inventory / Stok
  'inventory.view',
  'inventory.create',
  'inventory.update',
  'inventory.approve',

  // Catalog / Produk
  'catalog.view',
  'catalog.create',
  'catalog.update',
  'catalog.delete',

  // Reports / Laporan
  'report.view',
  'report.export',

  // Employee / Karyawan
  'employee.view',
  'employee.create',
  'employee.update',

  // Attendance / Absensi
  'attendance.view',
  'attendance.create',

  // Leave / Cuti & Izin
  'leave.view',
  'leave.create',
  'leave.approve',

  // Notifications / Notifikasi
  'notification.view',

  // Roles & Users
  'role.assign',
  'user.manage',

  // Business settings
  'business.manage',
]
