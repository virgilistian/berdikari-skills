# Fase 3 — Jasa (ojek & kurir) + Titip Beli · per platform

**Minggu 36–43 · Apr–Mei 2027 · tag `v0.4.0`**
Rujukan: PRD §12, §37.3, §22.4, §24, §33.3 · dok 18 §3.10–3.12, §5.5 · dok 19 §5.
Indeks: [`00-indeks.md`](00-indeks.md)

**Gerbang lulus fase** (PRD §37.3):
- **Plafon talangan teruji** — perkiraan di atas plafon ditolak sebelum ditawarkan; selisih > 20% dikonfirmasi customer.
- **"Sorot 7 hari" terjual manual ≥ 3×.** Kalau tidak laku manual, **Fase 5 dipotong** — bukan ditunda.
- Tarif penumpang terbukti berada di dalam rentang resmi (§22.4).

---

## 1 — Ringkasan per platform

| Platform | Yang lahir di fase ini |
|---|---|
| **API** | `order_type` `ojek`/`kurir` di mesin status yang sama, Direktori Travel (baca saja), Titip Beli + plafon talangan, batching 2 pesanan, penulisan sorot manual ke proyeksi publik |
| **WEB** | Halaman Ops "Sorot 7 hari" — **pendapatan pertama, tanpa sistem billing** |
| **CUS** | Layar ojek/kurir, Direktori Travel, Titip Beli + pembaruan struk |
| **MER** | — (tidak tersentuh; ini vertikal di luar warung) |
| **DRV** | Titip Beli (tugas belanja + foto struk), tawaran sekalian/batching |
| **SHR** | `sponsored_label` diperketat, model `shopping_order` |

> **Fase pertama tanpa pekerjaan Merchant sama sekali.** Manfaatkan: ini jendela terbaik untuk membayar utang teknis aplikasi Merchant dari Fase 1–2 bila ada, tanpa menabrak jadwal.

---

## 2 — Jalur kritis & paralelisasi

```
F3.1 ojek & kurir → F3.2 direktori travel (kecil, boleh paralel)
                  → F3.3 TITIP BELI (fitur terbesar fase ini)
                  → F3.4 batching
                  → F3.5 sorot manual (jalur bisnis, bukan jalur kode)
```

- **F3.1 murah** karena memakai mesin status yang sama — langkah yang tidak relevan **dilewati**, bukan digandakan.
- **F3.3 mahal** karena menyentuh uang orang lain (talangan driver). Ia layak 4 minggu.
- **F3.5 hampir bukan pekerjaan kode** — satu halaman Ops + satu penulis ke proyeksi. Nilainya ada di **percobaan penjualannya**, dan itu jalur bisnis yang harus dimulai sejak minggu 36, bukan minggu 42.

---

## F3.1 — Order ojek penumpang & kurir

**Minggu 36–37** · PRD §22.4, §5b · dok 18 §3.10 · dok 19 F3.1

| Platform | Terlibat | Urutan |
|---|---|---|
| API | ✅ | 1 |
| CUS | ✅ | 2 |
| DRV | memakai layar order aktif F2.4 apa adanya | — |

### API

- `…_add_service_types_to_guyub_orders` `~` — `order_type` `ojek`/`kurir` memakai **mesin status yang sama**; langkah tak relevan dilewati.
- `ServiceOrderPricing.php` `+` — tarif dari matriks zona (F2.1); potongan aplikasi **di bawah batas resmi** (§22.4).
- `OrderRefGenerator.php` `~` — prefiks `OJK`.

### CUS

- `lib/ui/features/ride/ride_order_page.dart` `+` — titik jemput & tujuan **dari daftar tempat**; jenis (antar orang / antar barang); catatan; **tarif tetap tampil sebelum memesan**; cara bayar tunai ke driver.

**Selesai bila** — tarif penumpang **selalu** di dalam rentang resmi; tidak ada layar driver baru yang dibuat untuk vertikal ini.

---

## F3.2 — Direktori Travel

**Minggu 37** · PRD §22.4 · dok 18 §3.12 · dok 19 F3.2

> **Tanpa pemesanan, tanpa tarif, tanpa komisi.** Batas ini adalah keputusan hukum, bukan lingkup.

| Platform | Terlibat |
|---|---|
| API | ✅ ringan |
| CUS | ✅ ringan |

- API: `…_create_guyub_travel_providers_table` `+` (penyedia **berizin**: nama, trayek, jam, nomor telepon) + `TravelDirectoryController.php` `+` (**baca saja**).
- CUS: `lib/ui/features/travel/travel_directory_page.dart` `+` — daftar + **tombol telepon**.

**Selesai bila** — tidak ada satu pun tombol "pesan" atau angka tarif di layar ini.

---

## F3.3 — Titip Beli

**Minggu 38–41** · PRD §24, temuan #31 & #32 · dok 18 §3.11, §5.5 · dok 19 F3.3

| Platform | Terlibat | Urutan |
|---|---|---|
| API | ✅ berat | 1 |
| CUS | ✅ | 2 |
| DRV | ✅ | 2 |

### API

- `…_create_guyub_shopping_orders_table` `+` — daftar belanja (teks ≤ 500 karakter), perkiraan, nilai struk, foto struk, jasa titip.
- `…_create_guyub_driver_limits_table` `+` — **plafon talangan** + riwayat perubahan; dinaikkan **Ops secara manual**, default Rp 50.000, maks Rp 200.000.
- `ShoppingOrderService.php` `+` — perkiraan di atas plafon **ditolak sebelum ditawarkan**; **satu order titip aktif per driver**; selisih > 20% **wajib dikonfirmasi customer** sebelum dibayar.
- `ShoppingOrderController.php` `+` — `POST /guyub/shopping-orders`, `POST /guyub/driver/shopping/{id}/receipt`, `POST .../adjust`.
- `config/guyub-forbidden-items.php` `+` — daftar barang yang tidak bisa dititipkan (§24.4).
- `config/guyub-errors.php` `~` — `GYB-DLV-301` (plafon terlampaui).

### CUS

- `lib/ui/features/shopping/{shopping_order_page,receipt_update_page}.dart` `+` — pilih toko dari daftar tempat (**hanya nama, tanpa logo/menu/harga** — temuan #32); daftar belanja; perkiraan; titik antar; rincian perkiraan belanja + ongkir + jasa titip; daftar barang terlarang.
- Layar lanjutan: "Driver sedang belanja" → **foto struk & nilai sebenarnya muncul** → total diperbarui **dengan penjelasan**.

### DRV

- `lib/ui/features/shopping/{shopping_task_page,receipt_capture_page}.dart` `+` — daftar belanja, toko tujuan, **plafon tersisa**; setelah belanja: nilai struk + **foto struk (wajib)**; tombol *"Barang tidak ada / harga beda"* → telepon customer.
- Driver **bebas menolak barang terlarang tanpa penalti**.

**Selesai bila** — order titip dengan perkiraan di atas plafon **tidak pernah sampai ke layar tawaran**; struk wajib ada sebelum order bisa diselesaikan; selisih > 20% memblokir sampai customer menjawab.

---

## F3.4 — Tawaran sekalian / batching

**Minggu 41–42** · PRD §33.3 · dok 18 §5.3 · dok 19 F3.4

Jahitannya (`guyub_trips`) sudah dipasang di F2.3 — fase ini tinggal menyalakannya.

| Platform | Terlibat |
|---|---|
| API | ✅ |
| DRV | ✅ |

- API `BatchOfferService.php` `+` — maks **2 pesanan per perjalanan**, **tanpa order penumpang**, ongkir keduanya **diterima penuh**.
- DRV `lib/ui/features/offer/batch_offer_sheet.dart` `+` — *"Ada satu lagi dari warung yang sama. Mau sekalian?"* + hitung mundur singkat + **Lewati tanpa penalti**.

**Selesai bila** — tidak ada perjalanan dengan 3 pesanan; melewatkan tawaran sekalian **tidak** menurunkan rasio penerimaan.

---

## F3.5 — "Sorot 7 hari" dijual manual

**Minggu 42–43** · PRD §12 (Fase 3), §5j · dok 19 F3.5

> Pendapatan pertama **tanpa sistem billing**. Kalau tidak laku manual, membangun sistem langganan tidak akan mengubah apa pun — dan Fase 5 dipotong.

| Platform | Terlibat |
|---|---|
| WEB | ✅ |
| API | ✅ ringan |
| SHR | ✅ ringan |

- WEB `web/app/pages/guyub/sorot.vue` `+` — Ops menaruh satu merchant di kartu "Pilihan Hari Ini" dan **mencatat pembayarannya**.
- API `OpsHighlightController.php` `+` — tulis langsung ke proyeksi publik dengan `is_sponsored = true`.
- SHR `guyub_ui/src/widgets/sponsored_label.dart` `~` — **label "Bersponsor" wajib**, maks 20% hasil, **warung tutup tidak pernah masuk**.

**Selesai bila** — tiga penjualan manual tercatat, dan setiap slot yang tayang **berlabel Bersponsor tanpa kecuali**.

---

## 8 — Kalender mingguan Fase 3

| Minggu | API | WEB | CUS | DRV | Jalur bisnis |
|---|---|---|---|---|---|
| 36–37 | F3.1 ojek & kurir | — | F3.1 layar pesan ojek | — | **mulai menjajakan Sorot 7 hari** |
| 37 | F3.2 direktori | — | F3.2 direktori | — | idem |
| 38–39 | F3.3 plafon & order | — | F3.3 layar titip beli | F3.3 tugas belanja | idem |
| 40–41 | F3.3 struk & penyesuaian | — | F3.3 pembaruan struk | F3.3 foto struk | idem |
| 41–42 | F3.4 batching | — | — | F3.4 tawaran sekalian | idem |
| 42–43 | F3.5 penulis sorot | F3.5 halaman Ops | — | — | **tutup ≥ 3 penjualan** |

---

## 9 — Catatan & asumsi fase ini

1. **Tidak ada penanda ⊕** — dok 18 §9 Fase 3 (ojek, titip beli, direktori travel di Customer; titip beli di Driver) tercakup penuh.
2. **Aplikasi Merchant tidak tersentuh sepanjang 8 minggu.** Ini disengaja, bukan kelalaian: Titip Beli justru ada untuk toko yang **tidak bisa bermitra** (§24.5).
3. **F3.5 adalah eksperimen bisnis yang disamarkan sebagai fitur.** Angka keberhasilannya (≥ 3 penjualan manual) adalah **gerbang menuju Fase 5**, jadi mulai menjajakannya sejak minggu 36 — jangan menunggu halaman Ops-nya jadi.
4. **Titip Beli boleh digeser** kalau fase tertinggal (§37.7). Yang tidak boleh: batas hukum §22.4 pada tarif ojek dan larangan pemesanan di Direktori Travel.
5. **Plafon talangan dinaikkan manual oleh Ops.** Jangan membuat aturan otomatis di fase ini — belum ada cukup riwayat untuk mengkalibrasinya, dan salah kalibrasi berarti uang driver.
