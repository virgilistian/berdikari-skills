# Security Design

## 1. Data Isolation (Tenancy Security)
- **Konsep**: Semua tabel yang memiliki data terkait bisnis harus memiliki relasi `business_id`.
- **Implementasi**: Menggunakan fitur `Global Scopes` di Laravel. Setiap user yang login memiliki scope `business_id`. ORM secara otomatis akan menambahkan klausul `WHERE business_id = ?` di setiap query `select`, `update`, maupun `delete`. Hal ini sepenuhnya mengeliminasi risiko kebocoran data antar tenant.

## 2. Autentikasi API
- Menggunakan **Laravel Sanctum**.
- Sistem PWA berinteraksi menggunakan bearer tokens, yang memungkinkan pengelolaan akses device secara independen (Kasir bisa me-revoke sesi tablet secara remote melalui dashboard web).

## 3. Role-Based Access Control (RBAC)
Pemberlakuan hierarki wewenang:
1. **Owner**: Akses penuh, pendaftaran cabang, melihat seluruh agregasi laporan keuangan.
2. **Cashier**: Akses terbatas pada domain modul `Sales` dan `Inventory` tertentu, di-*bind* hanya untuk satu `branch_id`.
3. **Production**: Akses eksklusif untuk modul `Production` (input dan read rekomendasi).

## 4. Perlindungan Perimeter
- **Rate Limiting**: Throttling ketat terhadap endpoint login (e.g. 5 attempts/minute) untuk mencegah brute-force. 
- **CORS Configuration**: Laravel dikonfigurasi untuk hanya menerima traffic dari URL Cloudflare Pages frontend Berdikari.
