# Fase 5 — Uang, Premium & Ops · per platform

**Minggu 54–62 · Ags–Okt 2027 · tag `v0.6.0`**
Rujukan: PRD §12, §37.3, §5e, §5j, §23.2, §23.4, §30.5, §30.6, temuan #19 & #20 · dok 18 §4.12 · dok 19 §7.
Indeks: [`00-indeks.md`](00-indeks.md)

**Gerbang lulus fase** (PRD §37.3):
- **Komisi pertama benar-benar tertagih** — bukan sekadar terhitung di layar.
- **≥ 10 merchant premium** berbayar.
- Konsol Ops bisa menangani komplain, penyalahgunaan, dan laporan **tanpa membuka database**.

> **Prasyarat dari Fase 3**: kalau "Sorot 7 hari" **tidak** terjual manual ≥ 3×, potong fase ini — bangun hanya F5.1 (komisi) dan F5.4 (Ops), tunda F5.2–F5.3. Membangun sistem langganan untuk sesuatu yang belum terbukti dibayar orang adalah cara termahal untuk belajar hal yang sama.

---

## 1 — Ringkasan per platform

| Platform | Yang lahir di fase ini |
|---|---|
| **API** | Komisi & penagihan mingguan lewat modul `Finance` yang **sudah ada**, langganan + `PlanService`, slot bersponsor berkuota DB, statistik iklan agregat, broadcast tanpa membocorkan nomor |
| **WEB** | **Konsol Ops lengkap**: komplain, laporan §30.6, langganan, penyalahgunaan |
| **CUS** | — (menerima broadcast lewat FCM; tidak ada layar baru) |
| **MER** | Rekap keuangan diperkaya, halaman Premium (paket, tagihan, "Saya sudah transfer"), slot bersponsor & statistik iklan, broadcast |
| **DRV** | — |
| **SHR** | — |

> **Fase paling berat untuk WEB sejak Fase 1.** Beban Ops yang selama ini ditunda dibayar di sini.

---

## 2 — Jalur kritis & paralelisasi

```
F5.1 komisi & penagihan → F5.2 langganan & PlanService → F5.3 sponsor/iklan/broadcast
                                                        → F5.4 Konsol Ops lengkap
```

- **F5.2 memakai ulang alur uang §5h** (F1.3) — **tidak ada kode baru untuk uangnya**, hanya `unique_amount` berprefiks `TAG` dan verifikator yang berbeda (**Ops**, bukan merchant).
- **F5.4 boleh berjalan paralel sejak minggu 56** — halaman Ops tidak bergantung pada `PlanService`.
- **Gateway + split settlement hanya bila sudah ada badan usaha** (§12). Kalau belum: tetap QRIS merchant, dan itu bukan kekurangan — itu keputusan hukum (§22.3).

---

## F5.1 — Komisi & penagihan mingguan

**Minggu 54–56** · PRD §5e, §23.2, §23.4, §30.5 · dok 18 §4.10 · dok 19 F5.1

| Platform | Terlibat | Urutan |
|---|---|---|
| API | ✅ berat | 1 |
| MER | ✅ | 2 |

### API

- `…_create_guyub_commissions_table` `+` — komisi per order + status penagihan mingguan.
- `CommissionService.php` `+` — dihitung server; **biaya platform pemesanan terpisah dari biaya layanan antar** (§23.2). Keduanya tidak boleh tercampur di satu angka.
- `BuildWeeklySettlementJob.php` `+` — rekap mingguan: komisi + **ongkir tertunda** (F2.5) + penggantian subsidi.
- `SettlementController.php` `+` — `GET /guyub/settlements/summary`.
- `api/Modules/Finance/**` `~` — catat komisi lewat modul `Finance` yang **sudah ada**, bukan modul baru (DNA §2.4).
- Rekening **khusus komisi** dari F0.9 dipakai di sini — **tidak pernah** jadi tujuan pembayaran pesanan (temuan #17).

### MER

- `lib/ui/features/finance/recap_page.dart` `~` — ongkir tertunda, penggantian subsidi, **komisi terutang**; angka dari server, tanpa perhitungan di klien.

**Selesai bila** — satu warung menerima rekap mingguan yang benar dan **membayarnya**; komisi tercatat di `Finance`, bukan di tabel bayangan.

---

## F5.2 — Langganan premium & `PlanService`

**Minggu 56–58** · PRD §5j, temuan #20 · dok 18 §4.12 · dok 19 F5.2

| Platform | Terlibat | Urutan |
|---|---|---|
| API | ✅ | 1 |
| MER | ✅ | 2 |
| WEB | ✅ (persetujuan tagihan oleh Ops) | 2 |

### API

- `…_create_guyub_subscriptions_table` `+` — **satu langganan aktif per merchant**.
- `…_create_guyub_subscription_invoices_table` `+` — tagihan + `unique_amount` (prefiks `TAG`); diverifikasi **Ops**, bukan merchant.
- `PlanService.php` `+` — **satu-satunya penentu hak fitur** (temuan #20). Klien hanya menyembunyikan tombol; server yang menolak.
- `MerchantPlanController.php` / `OpsInvoiceController.php` `+` — `GET plan`, `GET invoices`; Ops: `POST invoices/{id}/approve`.

### MER

- `lib/ui/features/premium/premium_page.dart` `+` — paket aktif & tanggal berakhir; tagihan dengan **nominal unik** + tombol "Saya sudah transfer".

### WEB

- Persetujuan tagihan masuk ke `web/app/pages/guyub/langganan.vue` (dibangun di F5.4).

**Selesai bila** — mematikan langganan di server **langsung** mencabut hak fitur walau aplikasi merchant belum dimuat ulang; tidak ada satu pun hak fitur yang diputuskan di klien.

---

## F5.3 — Slot bersponsor, statistik iklan, broadcast

**Minggu 58–60** · PRD §5j, temuan #19 · dok 18 §4.12 · dok 19 F5.3

| Platform | Terlibat | Urutan |
|---|---|---|
| API | ✅ berat | 1 |
| MER | ✅ | 2 |
| CUS | menerima broadcast lewat FCM — tanpa layar baru | — |

### API

- `…_create_guyub_ad_slots_table` `+` — kuota harian **ditegakkan di DB**; maks 3 slot/hari.
- `…_create_guyub_ad_daily_stats_table` `+` — agregat harian tayang/klik/order — **bukan log per tayangan** (pengendali biaya, §7.4).
- `DiscoveryRankingService.php` `~` — bersponsor **maks 20%**; premium hanya *tie-break*; **warung tutup atau habis stok tidak pernah diangkat**.
- `AdSlotController.php` `+` — `POST /guyub/merchant/ads`, `GET ads/stats`.
- `BroadcastService.php` `+` — **merchant tidak pernah menerima nomor pelanggan** (temuan #19); hanya pelanggan yang pernah memesan; maks 1×/minggu; opt-out satu ketukan; setiap broadcast **dicatat audit**.
- Uji `SponsoredQuotaTest` `+` — > 20% bersponsor ditolak; **badge popularitas tidak terpengaruh paket**.

### MER

- Perluasan `premium_page.dart` — pilih tanggal & produk yang disorot; **statistik iklan** ("dilihat 340 · diklik 28 · jadi 6 pesanan"); broadcast promo dengan **pratinjau**.

**Selesai bila** — tidak ada jalur mana pun yang memberi nomor pelanggan ke merchant; slot bersponsor selalu berlabel; badge *Paling Disukai* tetap murni hasil penilaian.

---

## F5.4 — Konsol Ops lengkap

**Minggu 60–62 (boleh mulai minggu 56)** · PRD §6.6, §30.6, temuan #11 · dok 19 F5.4

| Platform | Terlibat |
|---|---|
| WEB | ✅ berat |

- `web/app/pages/guyub/komplain.vue` `+` — tiket komplain + bukti + riwayat `guyub_order_events`; **setiap keputusan dicatat audit**.
- `web/app/pages/guyub/laporan.vue` `+` — **4 angka §30.6** + ekspor.
- `web/app/pages/guyub/langganan.vue` `+` — status langganan, konfirmasi tagihan (dari F5.2).
- `web/app/pages/guyub/penyalahgunaan.vue` `+` — rasio batal, order dari nomor sama, **rasio penolakan klaim per merchant** (temuan #11).
- `web/app/config/nav.ts` `~` — item Ops lengkap, **digerakkan permission** (DNA §9f).

**Selesai bila** — satu sengketa pembayaran nyata bisa diselesaikan dari awal sampai akhir **tanpa membuka database**, dan jejak keputusannya bisa dibaca ulang enam bulan kemudian.

---

## 8 — Kalender mingguan Fase 5

| Minggu | API | WEB | MER |
|---|---|---|---|
| 54–55 | F5.1 komisi & rekap mingguan | — | — |
| 56 | F5.1 → F5.2 langganan | **F5.4 mulai** (komplain) | F5.1 rekap keuangan |
| 57–58 | F5.2 `PlanService` & tagihan | F5.4 laporan §30.6 | F5.2 halaman premium |
| 58–59 | F5.3 slot & kuota DB | F5.4 langganan | F5.3 slot bersponsor |
| 59–60 | F5.3 broadcast & statistik | F5.4 penyalahgunaan | F5.3 statistik & broadcast |
| 61–62 | perbaikan | F5.4 nav & rapikan | — |

---

## 9 — Catatan & asumsi fase ini

1. **Tidak ada penanda ⊕** — dok 18 §9 Fase 5 hanya menjanjikan premium, tagihan, statistik iklan, dan broadcast di Merchant; semuanya tercakup F5.2–F5.3.
2. **Customer tidak mendapat layar baru di fase ini.** Broadcast masuk sebagai notifikasi biasa (dok 18 §6) dan opt-out ada di layar Notifikasi/Akun yang sudah ada sejak F1.12.
3. **Komisi menyala di bulan ke-7 sejak peluncuran publik** (§30.5) — sekitar Juli 2027, bukan bulan ke-7 sejak mulai ngoding. Kalau pengguna belum sampai di sana, **tunda penagihannya**, bukan kodenya.
4. **`PlanService` adalah satu-satunya penentu hak fitur.** Setiap kali muncul godaan `if (isPremium)` di Flutter, itu hanya boleh menyembunyikan tombol — server tetap harus menolak.
5. **Gateway pembayaran tidak dibangun di sini** kecuali badan usaha sudah ada (§12, §22.9). Kalau belum, `PaymentVerifier` (F1.3) tetap `ManualMerchantVerifier` — jahitannya sudah siap, tinggal ditukar kapan pun statusnya berubah.
6. **Premium penuh boleh digeser** (§37.7). Yang tidak boleh: F5.4 halaman komplain — Ops sudah menanganinya secara manual sejak Fase 1, dan beban itu tumbuh seiring pengguna.
