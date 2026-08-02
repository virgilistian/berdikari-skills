# Fase 2 — Kurir GUYUB · per platform

**Minggu 23–35 · Jan–Mar 2027 · tag `v0.3.0`**
Rujukan: PRD §12, §37.3, §5a.6, §23.4, §29, §35 · dok 18 §5, §3.15 · dok 19 §4.
Indeks: [`00-indeks.md`](00-indeks.md)

**Gerbang lulus fase** (PRD §37.3, §37.6):
- **Uji ongkir & serah terima lulus** — termasuk §26.2 #7 (`ongkir_tertunda` tidak memblokir pesanan).
- **3–4 driver aktif** sungguhan, bukan akun uji.
- Uji fase hijau di CI termasuk jalur penolakan RBAC; copy baru dibacakan keras terhadap §17; tag `v0.3.0`.

---

## 1 — Ringkasan per platform

| Platform | Yang lahir di fase ini |
|---|---|
| **API** | Matriks tarif zona + kelas medan, profil & verifikasi driver, dispatch berurutan, pembayaran ongkir dua sisi, pelacakan lokasi di Redis, Pesan Cepat, penilaian & badge |
| **WEB** | Verifikasi driver oleh Ops, halaman anomali penilaian |
| **CUS** | Kartu driver di status pesanan, pelacakan peta, Pesan Cepat, layar penilaian |
| **MER** | "Serahkan ke kurir", Pesan Cepat, peringatan ongkir tertunda, umpan balik privat |
| **DRV** | **Seluruh aplikasi lahir**: masuk + verifikasi 3 langkah, beranda online/offline, tawaran order, order aktif langkah demi langkah, pendapatan, akun & setelan |
| **SHR** | `quick_message_bar`, model `driver`/`trip`/`offer`, widget medan & ongkir |

---

## 2 — Jalur kritis & paralelisasi

```
F2.1 tarif zona → F2.2 driver & verifikasi → F2.3 dispatch → F2.4 aplikasi Driver order aktif
                                                              → F2.5 aliran uang ongkir
                                                              → F2.6 pelacakan
                                                              → F2.7 Pesan Cepat
                                                              → F2.8 penilaian & badge
```

**Kenapa F2.1 lebih dulu**: tanpa matriks tarif, tidak ada angka yang bisa ditawarkan ke driver — dispatch jadi tidak bisa diuji.

**Kenapa aplikasi Driver baru lahir di F2.2, bukan Fase 0**: kerangkanya tidak membuktikan apa pun sebelum ada order yang bisa ditawarkan. `guyub_core`/`guyub_ui` dari F0.4 dipakai apa adanya — **aplikasi ketiga tidak boleh menyalin kode**, ia menumpang paket bersama.

**Paralel aman**: F2.8 (penilaian) tidak menyentuh jalur uang — boleh digeser ke akhir tanpa memblokir apa pun. F2.7 (Pesan Cepat) menyentuh tiga aplikasi sekaligus; jadwalkan setelah layar order aktif Driver stabil supaya tidak mengubah tata letak dua kali.

---

## F2.1 — Zona, matriks tarif, dan kelas medan

**Minggu 23–24** · PRD §35, §6.7, §22.4 · dok 19 F2.1

| Platform | Terlibat | Urutan |
|---|---|---|
| API | ✅ | 1 |
| WEB / CUS / MER / DRV | konsumsi di fitur berikutnya | — |

### API

- `…_create_guyub_fare_matrix_table` `+` — asal-zona × tujuan-zona: tarif + **estimasi menit antar** (dipakai ETA §5l).
- `FareCalculator.php` `+` — tarif **diturunkan** dari parameter `guyub-fares.php` (§35.3), **bukan diketik**; wajib berada di dalam rentang resmi untuk order penumpang.
- `TerrainSurchargeService.php` `+` — tambahan tanjakan Rp 3.000–5.000, **penuh ke driver** (§35.5).
- `GuyubFareMatrixSeeder.php` `+` — dari hasil survei; ditinjau tiap kuartal atau saat bensin bergerak > 10%.
- Uji `FareRangeTest` `+` — tarif penumpang selalu di dalam rentang resmi; minimum pesanan antar desa Rp 40.000.

**Selesai bila** — mengubah `harga_bensin` di config menggeser seluruh matriks tanpa satu pun angka diketik ulang.

---

## F2.2 — Driver: profil, verifikasi dokumen, kendaraan (aplikasi Driver lahir)

**Minggu 24–26** · PRD §22.10 · dok 18 §5.1 · dok 19 F2.2

| Platform | Terlibat | Urutan |
|---|---|---|
| API | ✅ | 1 |
| DRV | ✅ berat — **aplikasi ketiga lahir** | 2 |
| WEB | ✅ | 2 (paralel) |

### API

- `…_add_verification_to_guyub_drivers_table` `~` — status verifikasi, `can_carry_passenger`, status online.
- `…_create_guyub_driver_vehicles_table` `+` — plat, foto STNK, nama & HP pemilik, masa berlaku, `is_borrowed`, izin pemilik; **maks 2 aktif**.
- `DriverVerificationService.php` `+` — **SIM C wajib mutlak**; STNK boleh atas nama orang lain; STNK kedaluwarsa → **disetujui dengan peringatan + tenggat 60 hari**, bukan ditolak.
- `DriverProfileController.php` `+` — unggah dokumen (presigned, jalur yang sama dengan F1.3), pilih kendaraan hari ini, jenis order.

### DRV — `apps/guyub_driver` `+`

- Kerangka + `go_router` + bottom nav **Beranda · Order · Pendapatan · Akun**; memakai `guyub_core`/`guyub_ui` apa adanya.
- Masuk: HP + PIN, **pengikatan perangkat wajib** (§36.5) — lebih ketat dari Customer.
- `lib/ui/features/verification/**` `+` — tiga langkah pendek:
  1. **Diri** — foto KTP, foto diri, **foto SIM C** (wajib mutlak).
  2. **Kendaraan** — foto STNK + motor dengan plat terlihat; *"Motornya punya sendiri?"* → bila tidak: nama & HP pemilik + centang izin. Maks 2 kendaraan.
  3. **Jenis order** — *antar makanan & barang saja* atau *termasuk antar orang* (butuh helm SNI kedua).
- Status: menunggu · disetujui · ditolak (dengan alasan **dan cara memperbaikinya**) · **perlu dilengkapi** (mis. helm penumpang belum ada → tetap bisa jalan sebagai kurir).
- Copy: *"Motornya punya sendiri atau pinjam? Dua-duanya boleh, kok."*

### WEB

- `web/app/pages/guyub/drivers.vue` `+` — verifikasi Ops + **catatan telepon ke pemilik kendaraan** (satu kali saat verifikasi).

**Selesai bila** — SIM C **tidak bisa dilewati** dengan alasan apa pun; STNK atas nama orang lain lolos dengan catatan; tidak ada permintaan SKCK, surat sehat, uji kendaraan, atau deposit di layar mana pun.

---

## F2.3 — Dispatch

**Minggu 26–28** · PRD §5a.6, §7.5.2, temuan #28 · dok 19 F2.3

| Platform | Terlibat | Urutan |
|---|---|---|
| API | ✅ berat | 1 |
| DRV | ✅ (layar tawaran di F2.4) | 2 |
| MER | ✅ ringan | 2 |

### API

- `…_create_guyub_dispatch_offers_table` `+` — tawaran + hasil (terima/tolak/timeout) untuk audit & metrik.
- `…_create_guyub_trips_table` `+` — **jahitan batching** (§33.3): v1 selalu 1 pesanan per perjalanan.
- `DispatchOrderJob.php` `+` — tawaran **berurutan**, 30 detik per driver, **maks 5 putaran**; gagal → merchant boleh "antar sendiri".
- `DriverPoolService.php` `+` — driver online terdekat; **kurir merchant tidak pernah masuk kolam ini** (temuan #28); order menanjak **hanya** ke driver yang mengaktifkan setelannya.
- `DriverOfferController.php` `+` — `GET offers`, `POST offers/{id}/accept`.
- `config/guyub-errors.php` `~` — `GYB-DLV-302` (tidak ada driver setelah 5 putaran).

### MER

- Penanganan `GYB-DLV-302` di detail pesanan: tawarkan **"antar sendiri"** atau ganti mode pemenuhan — bukan layar gagal buntu.

**Selesai bila** — kurir merchant **tidak pernah** menerima tawaran GUYUB; menolak order jalan sulit tidak menurunkan rasio penerimaan.

---

## F2.4 — Aplikasi Driver: order aktif langkah demi langkah

**Minggu 28–31** · PRD §6.4, temuan #5 · dok 18 §5.2–5.4 · dok 19 F2.4

| Platform | Terlibat | Urutan |
|---|---|---|
| API | ✅ | 1 |
| DRV | ✅ berat | 2 |
| CUS | ✅ (kartu driver) | 3 |

### API

- `DriverOrderController.php` `+` — `pickup`, `courier-fee-received`, `deliver`, `complete`.
- `DriverOrderResource.php` `+` — alamat & nomor HP customer **hanya selama penugasan aktif**, hilang setelah selesai (temuan #5).
- `ContactRevealAuditor.php` `+` — **setiap pembukaan nomor dicatat audit** (§29.3, temuan #34).

### DRV

- `lib/ui/features/home/home_page.dart` `+` — **sakelar Online/Offline besar**; pemilih kendaraan hari ini bila terdaftar 2 motor; ringkasan hari ini; peringatan dokumen/pajak STNK yang akan kedaluwarsa + sisa tenggat. **Online tanpa order aktif tidak mengirim lokasi.**
- `lib/ui/features/offer/offer_card_page.dart` `+` — kartu penuh layar + suara + **hitung mundur 30 detik** + penanda medan (Datar · Menanjak · Jalan sulit) + **ongkir yang diterima** dirinci ("Rp 8.000 + tanjakan Rp 3.000") + Terima / **Lewati**.
- `lib/ui/features/active_order/active_order_page.dart` `+` — **satu tombol besar per tahap**: Sampai di warung → **Ongkir diterima** → Pesanan diambil → Sampai di tujuan → Selesai.
- `lib/ui/features/active_order/otp_sheet.dart` `+` — **OTP 4 digit** dari customer, atau foto bila customer tidak ada.
- `lib/data/local/active_order_store.dart` `+` — detail order tersimpan lokal; perubahan status **diantre** saat offline (memakai `Idempotency-Key` yang sama).
- `lib/data/services/{foreground_service,location_batcher}.dart` `+` — lokasi **hanya saat order aktif**, batch 15 detik.
- `lib/ui/features/account/settings_page.dart` `+` — setelan **"Terima order tanjakan"**, suara tawaran (volume & nada), Masukan & saran (F1.10), bantuan, privasi, keluar.

### CUS

- `lib/ui/features/order_status/driver_card.dart` `+` — nama, foto, plat, **tombol Telepon** (bukan teks yang bisa disalin), hanya selama penugasan aktif.

**Selesai bila** — nomor & alamat customer **hilang** dari layar driver setelah order selesai; setiap penekanan tombol Telepon tercatat audit; perubahan status offline terkirim otomatis tanpa duplikasi.

---

## F2.5 — Aliran uang ongkir: tunai di tempat + `ongkir_tertunda`

**Minggu 31–32** · PRD §23.4, temuan #30 · dok 18 §4.10, §5.6 · dok 19 F2.5

> **Driver selalu dibayar untuk perjalanan yang sudah ditempuh.** Ini yang menjaga kepercayaan driver.

| Platform | Terlibat | Urutan |
|---|---|---|
| API | ✅ | 1 |
| DRV | ✅ | 2 |
| MER | ✅ | 2 |

### API

- `…_create_guyub_courier_settlements_table` `+` — rekap mingguan per warung: ongkir tertunda, penggantian subsidi, komisi.
- `CourierPayoutService.php` `+` — konfirmasi dua sisi; `courier_paid_at` kosong = `ongkir_tertunda`; **pesanan tidak pernah diblokir** karena ini.
- `DriverEarningsController.php` `+` — `GET /guyub/driver/earnings` harian & mingguan, rincian **per order**.
- `config/guyub-errors.php` `~` — `GYB-DLV-601` (selesai tapi `courier_paid_at` kosong — kelas 6xx, **selalu peringatan, tidak pernah pemblokir**).
- Uji `CourierFeePendingTest` `+` — §26.2 #7: pesanan tetap jalan, tapi muncul di rekap.

### DRV

- `lib/ui/features/earnings/earnings_page.dart` `+` — hari ini & minggu ini: jumlah order, total ongkir diterima, **rincian per order**, catatan `ongkir_tertunda` yang belum dibayar warung, penggantian subsidi.

### MER

- `lib/ui/features/finance/pending_courier_fee_card.dart` `+` — peringatan ongkir tertunda di beranda merchant, tidak bisa diabaikan diam-diam.

**Selesai bila** — driver yang lupa menekan "Ongkir diterima" **tetap** bisa menyelesaikan order, dan angkanya muncul di rekap kedua belah pihak.

---

## F2.6 — Pelacakan & polling adaptif

**Minggu 32–33** · PRD §7.4, §11 · dok 19 F2.6

| Platform | Terlibat | Urutan |
|---|---|---|
| API | ✅ | 1 |
| CUS | ✅ | 2 |
| DRV | sudah dikirim dari F2.4 `location_batcher` | — |

### API

- `DriverLocationController.php` `+` — `POST /guyub/driver/location` (batch); simpan di **Redis TTL 2 jam, bukan Postgres**.
- `OrderTrackController.php` `+` — `GET /guyub/orders/{id}/track`.

### CUS

- `lib/data/services/adaptive_poller.dart` `+` — **5 dtk (diantar) → 20 dtk (menunggu) → mati (tidak ada order)**. Ini pengendali biaya, bukan detail teknis (§7.4).
- `lib/ui/features/tracking/tracking_page.dart` `+` — MapLibre + tile OSM, **hanya di layar ini**.

**Selesai bila** — tidak ada satu pun permintaan pelacakan saat customer tidak punya order aktif; peta tidak dimuat di layar lain mana pun.

---

## F2.7 — Pesan Cepat

**Minggu 33–34** · PRD §29.2, temuan #33 · dok 18 §3.15 · dok 19 F2.7

> Bukan chat. **Tanpa kotak teks bebas.**

| Platform | Terlibat | Urutan |
|---|---|---|
| API | ✅ | 1 |
| SHR | ✅ | 2 |
| CUS / MER / DRV | ✅ | 3 (bertiga) |

### API

- `…_create_guyub_quick_messages_table` `+` — pesan sebagai **event pada pesanan**.
- `config/guyub-quick-messages.php` `+` — daftar pesan siap pakai per peran (§29.2) **sebagai data**.
- `QuickMessageController.php` `+` — maks **10 pesan per pihak per pesanan**, hanya selama aktif, tertutup 1 jam setelah selesai.

### SHR

- `guyub_ui/src/widgets/quick_message_bar.dart` `+` — posisi tetap, ikon besar, **urutan tidak pernah berubah** — driver menekannya tanpa membaca, sambil di atas motor yang sedang berhenti.

### CUS · MER · DRV

- `lib/ui/features/*/quick_message_section.dart` `+` (ketiganya) — terpasang di layar status pesanan / order aktif, berikut riwayat pesan pesanan ini dan tombol Telepon.
- Offline: pesan **diantre dan terkirim otomatis**; **tidak ada tanda "dibaca"** (menghindari harapan yang tidak bisa dijamin).

**Selesai bila** — tidak ada satu pun kotak teks bebas di jalur ini; urutan tombol identik di tiga aplikasi; nomor telepon hanya ada di balik tombol.

---

## F2.8 — Penilaian produk, merchant, driver + badge

**Minggu 34–35** · PRD §5i, temuan #18 · dok 18 §3.9 · dok 19 F2.8

| Platform | Terlibat | Urutan |
|---|---|---|
| API | ✅ | 1 |
| CUS | ✅ | 2 |
| MER | ✅ ringan | 2 |
| WEB | ✅ ringan | 2 |

### API

- Migrasi `+`: `…_create_guyub_item_reviews_table` (**unik `order_item_id`**; `sentiment`, `reasons[]`, `editable_until`), `…_create_guyub_ratings_table` (merchant & driver, satu per order per pihak), `…_create_guyub_product_stats_table` (`likes`, `dislikes`, `sold_30d`, `badge`, `recomputed_at`).
- `ReviewIntegrityService.php` `+` — hanya dari order **`selesai` milik sendiri**, maks 7 hari, bisa diubah 24 jam; order terkait merchant dikecualikan.
- `RecomputeProductStatsJob.php` `+` — tiap **15 menit** → tulis ke `catalog_public_items`. **Discovery tidak pernah menghitung agregat saat request.**
- `ReviewController.php` `+` — `POST /guyub/orders/{id}/reviews` (semua item + merchant + driver sekaligus).

### CUS

- `lib/ui/features/review/review_page.dart` `+` — tiap item 👍/👎 + alasan preset, **tanpa komentar bebas**, bisa dilewati. Aktifkan tombol "Beri penilaian" di layar selesai (yang disembunyikan sejak F1.12).

### MER

- `lib/ui/features/insights/private_feedback_card.dart` `+` — *"3 orang bilang porsinya sedikit minggu ini"* — **privat, merchant tidak bisa menghapus**.

### WEB

- `web/app/pages/guyub/anomali-penilaian.vue` `+` — lonjakan penilaian dari satu nomor → tampil ke Ops.

**Selesai bila** — **tidak ada peringkat "terburuk" di mana pun**; badge tidak dipengaruhi paket; penilaian publik selalu anonim.

---

## 8 — Kalender mingguan Fase 2

| Minggu | API | WEB | CUS | MER | DRV | SHR |
|---|---|---|---|---|---|---|
| 23–24 | F2.1 tarif & medan | — | — | — | — | — |
| 24–26 | F2.2 verifikasi driver | F2.2 verifikasi Ops | — | — | **F2.2 aplikasi lahir** | model driver |
| 26–28 | F2.3 dispatch | — | — | F2.3 fallback antar sendiri | F2.3 kontrak tawaran | — |
| 28–31 | F2.4 endpoint order driver | — | F2.4 kartu driver | — | **F2.4 order aktif** | — |
| 31–32 | F2.5 ongkir & settlement | — | — | F2.5 kartu ongkir tertunda | F2.5 pendapatan | — |
| 32–33 | F2.6 lokasi & track | — | F2.6 pelacakan & poller | — | — | — |
| 33–34 | F2.7 pesan cepat | — | F2.7 | F2.7 | F2.7 | F2.7 `quick_message_bar` |
| 34–35 | F2.8 penilaian & stats | F2.8 anomali | F2.8 layar penilaian | F2.8 umpan balik privat | — | — |

---

## 9 — Catatan & asumsi fase ini

1. **Tidak ada penanda ⊕ di fase ini** — dok 18 §9 Fase 2 (kartu driver, Pesan Cepat, penilaian di Customer; serahkan ke kurir & Pesan Cepat di Merchant; seluruh aplikasi Driver) seluruhnya tercakup F2.4/F2.7/F2.8. *"+5 menit"* di Merchant sudah selesai di F1.6.
2. **Akun `guyub-merchant-courier` menyala di F2.4.** Sejak fase ini kurir merchant boleh memakai aplikasi Driver dengan **lensa keempat** (F1.7) — bukan kolam dispatch GUYUB. Merchant yang kurirnya tidak memakai aplikasi tetap bisa menandai sendiri lewat aplikasi Merchant.
3. **Aplikasi Driver menumpang `guyub_core`/`guyub_ui`.** Bila muncul dorongan menyalin widget dari aplikasi lain, itu tanda widget-nya harus naik ke `guyub_ui` — bukan disalin.
4. **Lokasi hanya saat order aktif** (§11) adalah keputusan privasi sekaligus biaya. Jangan "sementara" mengaktifkannya saat online untuk mempermudah debugging dispatch.
5. **F2.8 adalah kandidat pemotongan pertama** kalau fase tertinggal — ia tidak menyentuh jalur uang. Yang **tidak boleh** dipotong: F2.5 (aliran ongkir) dan uji §26.2 #7.
