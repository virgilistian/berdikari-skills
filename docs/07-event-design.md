# Event Driven Design

Berdikari ERP didesain dengan konsep decoupled melalui Event-Driven Patterns. Interaksi kompleks antar modul dipisahkan menjadi asinkronus menggunakan Event & Listener.

## Daftar Event Bisnis Utama

### 1. `SaleOrderCompleted`
- **Publisher**: Modul `Sales`
- **Payload**: `order_id`, `branch_id`, `items[]`
- **Subscribers**:
  - `Inventory`: Memproses pemotongan stok barang.
  - `Finance`: Mencatat pemasukan di arus kas harian.
  - `CRM` (Future): Menambah poin reward ke profil pelanggan.

### 2. `ShiftClosed` (Tutup Kasir)
- **Publisher**: Modul `Sales`
- **Payload**: `branch_id`, `shift_date`, `total_revenue`
- **Subscribers**:
  - `Production`: Memulai Worker Job untuk menghitung *Daily Production Recommendation*.
  - `Reporting`: Memulai agregasi ringkasan laporan harian.

### 3. `ProductionRecommended`
- **Publisher**: Modul `Production`
- **Payload**: `branch_id`, `date`, `recommendations[]`
- **Subscribers**:
  - `Notification`: Meneruskan push notification atau alert ke device aplikasi Tim Produksi untuk persiapan hari esok.

### 4. `ActualProductionLogged`
- **Publisher**: Modul `Production`
- **Payload**: `branch_id`, `products[]`
- **Subscribers**:
  - `Inventory`: Memproses penambahan stok awal hari ke gudang/cabang terkait.
