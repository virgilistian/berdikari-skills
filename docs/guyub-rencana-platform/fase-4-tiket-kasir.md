# Fase 4 — Tiket wisata + Kasir Ringan · per platform

**Minggu 44–53 · Jun–Ags 2027 · tag `v0.5.0`**
Rujukan: PRD §12, §37.3, §5c, §18, §32.2, §34.5 · dok 18 §2.3, §3.12, §4.11 · dok 19 §6.
Indeks: [`00-indeks.md`](00-indeks.md)

**Gerbang lulus fase** (PRD §37.3):
- **Pindai QR offline teruji di gerbang** — HP petugas tanpa sinyal, tanda tangan terverifikasi, penukaran ganda tercegah.
- Dapur menerima **satu** format pesanan, bukan dua (§34.5).
- Rekap harian menggabungkan penjualan offline + online.

---

## 1 — Ringkasan per platform

| Platform | Yang lahir di fase ini |
|---|---|
| **API** | Modul `Ticketing` (destinasi, kuota per tanggal, tiket bertanda tangan Ed25519, rekonsiliasi penukaran), penjualan kasir di `Ordering` yang sudah ada |
| **WEB** | `/wisata/<slug>` di Web Profil |
| **CUS** | Destinasi, beli tiket, **Tiket saya** (QR berlaku offline) |
| **MER** | **Kasir Ringan (POS)** + layar pindai tiket di gerbang |
| **DRV** | — |
| **SHR** | Model tiket, widget QR |

> **Dua fitur besar yang tidak saling bergantung.** F4.1 (tiket) dan F4.2 (kasir) boleh ditukar urutannya bila salah satu terhambat — satu-satunya jahitan bersama adalah `QueueNumberService` dari F1.5.

---

## 2 — Jalur kritis & paralelisasi

```
F4.1 Ticketing (44–48)  ──┐
                          ├── keduanya bermuara di aplikasi Merchant
F4.2 Kasir Ringan (48–53) ─┘
```

- **Risiko teknis nomor satu fase ini** adalah **verifikasi offline** (F4.1): tanda tangan Ed25519 diverifikasi tanpa jaringan, penukaran dicatat lokal, rekonsiliasi menyusul. Uji di gerbang sungguhan — bukan di meja.
- **Risiko produk nomor satu** adalah F4.2 memakai **varian & pilihan yang sama** dengan pesanan aplikasi (§34.5). Kalau kasir memakai jalur produk sendiri, dapur menerima dua format dan seluruh manfaatnya hilang.
- Keduanya **boleh digeser** kalau jadwal tertinggal (§37.7).

---

## F4.1 — Modul `Ticketing`

**Minggu 44–48** · PRD §5c, §19.1 · dok 18 §2.3, §3.12 · dok 19 F4.1

| Platform | Terlibat | Urutan |
|---|---|---|
| API | ✅ berat | 1 |
| CUS | ✅ | 2 |
| MER | ✅ (layar gerbang) | 2 |
| WEB | ✅ ringan | 2 |

### API

- Scaffold `api/Modules/Ticketing/**` `+`.
- `…_create_guyub_destinations_table` `+` — destinasi + jam operasional gerbang.
- `…_create_ticket_inventories_table` `+` — kuota per tanggal; **kunci baris per (destinasi, tanggal)** — ini yang mencegah kuota terjual berlebih.
- `…_create_guyub_tickets_table` `+` — tiket + status penukaran; prefiks `TKT`.
- `TicketSigner.php` `+` — payload ringkas + **tanda tangan Ed25519**; public key **tertanam di aplikasi**.
- `RedemptionReconciler.php` `+` — penukaran ganda dicegah lewat penyimpanan lokal + rekonsiliasi; bentrok → **eskalasi ke Ops**, bukan diputuskan diam-diam.
- `TicketController.php` `+` — `POST /guyub/tickets`, `GET /{id}`, `POST /redeem` (**idempoten**).
- Pembayaran memakai gerbang §5h yang sudah ada (F1.3) — **tidak ada jalur uang baru**.

### CUS

- `lib/ui/features/ticket/{destination_page,buy_ticket_page,my_tickets_page}.dart` `+` — foto, jam, harga, **kuota tersisa per tanggal**; pesan tiket (tanggal, jumlah, total, cara bayar); **QR bertanda tangan berlaku offline** + status *belum dipakai / sudah dipakai*.

### MER

- `lib/ui/features/gate/scan_page.dart` `+` — **verifikasi tanda tangan offline**, catat lokal, sinkron menyusul saat ada jaringan.

### WEB

- `web/app/pages/publik/wisata/[slug].vue` `+` — foto, jam, harga, **kuota tersisa hari ini**, cara menuju ke sana, tombol "Beli tiket di aplikasi".

**Selesai bila** — HP petugas dalam mode pesawat bisa memverifikasi tiket asli **dan menolak tiket palsu**; dua kali pindai tiket yang sama tidak pernah menghasilkan dua penukaran setelah rekonsiliasi.

---

## F4.2 — Kasir Ringan (POS) di aplikasi Merchant

**Minggu 48–53** · PRD §18, §32.2, §34.5 · dok 18 §4.11 · dok 19 F4.2

> **Sengaja tanpa shift, tanpa valuasi, tanpa printer** (§18.2). Gratis selamanya; yang premium hanya rekap bulanan & ekspor.

| Platform | Terlibat | Urutan |
|---|---|---|
| API | ✅ | 1 |
| MER | ✅ berat | 2 |

### API

- `QueueNumberService.php` `~` — pembeli langsung **mengambil nomor dari urutan yang sama** dengan pesanan aplikasi (§32.2). Ini sebabnya nomor antrean dibangun benar sejak F1.5.
- `CounterSaleController.php` `+` — catat penjualan offline; memakai **varian & pilihan yang sama** (§34.5).
- `…_add_channel_to_guyub_orders` `~` — `channel` = `aplikasi` / `kasir`.

### MER

- `lib/ui/features/pos/{pos_grid_page,quick_cart_sheet,daily_recap_page}.dart` `+` — grid produk → keranjang cepat → total → **Tunai / QRIS** → simpan; **tandai habis langsung dari grid**; rekap harian menggabungkan offline + online.

**Selesai bila** — dapur menerima **satu** format pesanan; menandai habis dari kasir langsung mematikan produk di aplikasi customer; rekap harian satu angka, bukan dua daftar terpisah.

---

## 8 — Kalender mingguan Fase 4

| Minggu | API | WEB | CUS | MER |
|---|---|---|---|---|
| 44–45 | F4.1 destinasi & kuota | — | — | — |
| 46 | F4.1 `TicketSigner` | — | F4.1 beli tiket | — |
| 47 | F4.1 redeem & rekonsiliasi | F4.1 `/wisata/<slug>` | F4.1 tiket saya | F4.1 pindai gerbang |
| 48 | **uji lapangan gerbang** | — | — | F4.1 perbaikan dari lapangan |
| 48–50 | F4.2 counter sale & channel | — | — | F4.2 grid & keranjang cepat |
| 51–52 | F4.2 nomor antrean bersama | — | — | F4.2 rekap harian |
| 53 | — | — | — | uji di warung sungguhan |

---

## 9 — Catatan & asumsi fase ini

1. **Tidak ada penanda ⊕** — dok 18 §9 Fase 4 (`/wisata/<slug>` di Web; tiket wisata di Customer; kasir ringan + pindai tiket di Merchant) tercakup penuh.
2. **Aplikasi Merchant memikul dua fitur besar sekaligus** (gerbang + kasir). Kalau harus memilih, **Kasir Ringan lebih bernilai** — ia dipakai setiap hari oleh setiap warung; gerbang tiket dipakai segelintir destinasi.
3. **Public key Ed25519 tertanam di aplikasi.** Rotasi kunci berarti rilis aplikasi baru — rencanakan masa transisi dua kunci sejak awal, jangan setelah kunci pertama bermasalah.
4. **Tiket memakai gerbang pembayaran §5h yang sudah ada.** Jangan membuat jalur uang kedua untuk tiket — kalau terasa perlu, itu tanda ada yang salah dengan asumsi di F1.3.
5. **Kedua fitur boleh digeser** (§37.7). Yang tidak boleh digeser dari fase ini: uji pindai offline **sebelum** dijanjikan ke pengelola destinasi.
