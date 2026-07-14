# API Specification

## 1. Standardisasi
- **Format**: JSON (`application/json`)
- **Authentication**: Bearer Token (Sanctum JWT/PAT)
- **Versioning**: Header Accept atau URL-based (`/api/v1/`)
- **Pagination**: Meta pagination standard Laravel API Resource.

## 2. Endpoint Utama (High-Level)

### IAM (Identity)
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`
- `GET /api/v1/auth/me`

### Catalog
- `GET /api/v1/products` (Tergantung branch_id & business_id dari scope user login)
- `POST /api/v1/products`

### Sales (POS)
- `POST /api/v1/orders` (Submit transaksi order)
- `POST /api/v1/shifts/close` (Tutup kasir harian, memicu agregasi stok)

### Inventory & Production (Angkringan)
- `GET /api/v1/inventory` (Cek stok realtime)
- `GET /api/v1/production/recommendations` (Lihat rekomendasi harian)
- `POST /api/v1/production/actual` (Submit hasil produksi harian)

## 3. Standard Response Format
```json
{
  "success": true,
  "data": { 
      "id": "123-abc",
      "name": "Nasi Kucing"
  },
  "message": "Data retrieved successfully"
}
```
Pola respons ini dipertahankan secara seragam melalui Middleware atau Base Controller di modul Core.
