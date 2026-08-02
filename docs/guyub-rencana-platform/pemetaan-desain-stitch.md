# GUYUB — Pemetaan Desain Stitch ↔ Rencana Implementasi

**Sumber desain**: `stitch_spesifikasi_desain_mobile_guyub/` (172 folder, masing-masing berisi `code.html` + `screen.png`).
**Sumber rencana**: `docs/18-guyub-spesifikasi-fitur.md` (layar per app) + `docs/guyub-rencana-platform/fase-*.md` (fitur `F<fase>.<n>` per platform).

**Status**: v1.0-draft. Dibuat manual dengan membaca nama folder + `<title>`/konten `code.html` tiap layar ambigu, lalu dicocokkan ke baris fitur di dokumen fase. Belum ada tautan otomatis — kalau folder desain berganti nama, tabel ini harus disesuaikan manual.

Simbol:
- ✅ cocok langsung dengan baris fitur yang ada di doc 18 / dokumen fase.
- ⊕ **elaborasi tambahan** — desainnya ada, tapi belum ada baris eksplisit di doc 18/19/fase (sama makna dengan marker ⊕ di dokumen fase). Bukan kesalahan, hanya perlu direview saat fase terkait dikunci.
- 🎨 aset non-layar — bukan bagian dari inventaris fitur (dikecualikan dari hitungan cakupan).

## Aturan resolusi konflik

Mengikuti urutan yang sudah dipakai `00-indeks.md` (PRD → doc 18 → doc 19 → dokumen fase), desain Stitch ditambahkan di **paling bawah** urutan itu:

> **PRD → doc 18 → doc 19 → dokumen fase → desain Stitch.**

Kalau sebuah layar/elemen Stitch **tidak disebut atau bertentangan** dengan dokumen di atasnya (bukan sekadar detail visual/langkah tambahan yang netral seperti registrasi dipecah 3 layar), layar/elemen itu **tidak dimasukkan ke pemetaan ini dan tidak diimplementasikan** — kecuali PRD/doc 18/doc 19/dokumen fase diperbarui dulu secara sadar untuk mengakomodasinya. Riwayat item yang sudah dibuang dengan alasan penolakannya ada di §10.

---

## 1 — Fase 0: Fondasi (framework, auth, onboarding)

| Layar Stitch | Fitur | Catatan |
|---|---|---|
| `onboarding_guyub` | F0.4 | Opener umum |
| `onboarding_customer_1`, `onboarding_customer_2` | F0.4 | 3 slide opener Customer |
| `onboarding_carousel_cara_belanja` | F0.4 | Slide "cara belanja" |
| `onboarding_merchant_1`, `onboarding_merchant_2` | F0.4 | Framework/onboarding Merchant |
| `beranda_guest_mulai_belanja` | F0.4 | Layar sebelum login |
| `pilihan_masuk_guyub` | F0.4 | "Selamat Datang di Guyub" — pemilihan jalur masuk |
| `masuk_ke_akun`, `masuk_ke_akun_refined` | F0.2 | Login HP + PIN 6 digit |
| `registrasi_pengguna_baru` | F0.4 | Entri registrasi |
| `registrasi_akun_data_diri` | F0.4 ⊕ | Doc 18 hanya bilang "HP → OTP → PIN → nickname" satu baris; desain memecahnya jadi 3 langkah — lebih detail, bukan konflik |
| `registrasi_akun_kontak` | F0.4 ⊕ | idem |
| `registrasi_akun_lokasi` | F0.4 ⊕ | idem |
| `verifikasi_nomor_hp` | F0.2 | Verifikasi HP |
| `verifikasi_otp`, `verifikasi_kode_otp`, `verifikasi_akun` | F0.2 | OTP |
| `lengkapi_profil`, `lengkapi_profil_kamu` | F0.4 | Nickname/profil saat registrasi |
| `atur_profil_identity` | F0.4 | Setup identitas |
| `izin_akses_lokasi` | F0.4 | Izin lokasi "diminta saat dibutuhkan" (bukan di awal) — **cek urutan flow saat implementasi**, jangan taruh di opener |
| `keamanan_akun_1`, `keamanan_akun_2` | F0.2 ⊕ | Pengaturan keamanan akun (ganti PIN dst.) — belum ada baris eksplisit |
| `perangkat_terhubung` | F0.2 ⊕ | Manajemen perangkat terikat (device binding, PRD §36.5) — belum ada baris eksplisit |
| `menu_utama_side_drawer` | F0.4 | Pola navigasi alternatif di atas bottom-nav 4 item |
| `pengaturan_profil_merchant`, `_refined`, `_refined_v2` | F0.4/F1.0 | Profil & pengaturan dasar Merchant |

---

## 2 — Web Profile (`guyub.<domain>`)

**Tidak ada dalam set desain ini** — dan itu wajar, karena nama foldernya memang "desain **mobile**". Halaman F0.7 (`/`, `/daftar-warung`, `/gabung-driver`, `/bantuan`, `/privasi`, `/ketentuan`, `/status`) dan F1.9 (`/w/<slug>`), F4.1 (`/wisata/<slug>`) tidak perlu dicari di sini.

---

## 3 — Mobile Customer (`guyub_customer`)

### Home & pencarian (F1.9)

| Layar Stitch | Fitur | Catatan |
|---|---|---|
| `beranda_customer_1`, `beranda_customer_2` | F1.9 | `home_page.dart` |
| `guyub_food_delivery_local_service` | F1.9 ⊕ | Varian/eksplorasi home lain |
| `beranda_cafe_kedai`, `cafe_kedai_terdekat`, `daftar_cafe_kedai_terdekat` | F1.9 | Kategori kafe di discovery |
| `pangkalan_terdekat` | F1.9 | Zona pilot ("Pangkalan") |
| `daftar_merchant_kuliner`, `daftar_warung_tetangga` | F1.9 | `merchant_list_page.dart` |
| `cari_produk_warung`, `cari_produk_warung_focused_overlay` | F1.9 | `search_page.dart` |
| `hasil_cari_warung`, `hasil_cari_produk`, `hasil_cari_produk_terdekat`, `hasil_cari_kuliner_produk`, `hasil_cari_kuliner_refined` | F1.9 | Hasil pencarian |
| `filter_pencarian`, `filter_pencarian_bottom_sheet` | F1.9 | Filter kategori/buka saja/zona |
| `urutkan_hasil_cari_bottom_sheet` | F1.9 | Sortir: terdekat · terlaris · paling disukai |
| `loading_state_search_results_skeleton` | F1.9 | State loading |
| `konfirmasi_hapus_riwayat_pencarian`, `_refined` | F1.9 ⊕ | Hapus riwayat cari — elaborasi UI kecil |
| `onboarding_temukan_warung_produk` | F1.9 ⊕ | Tooltip onboarding fitur discovery |
| `atur_lokasi` | F1.9 | Pilih lokasi dasar untuk radius pencarian |
| `pusat_notifikasi` | F1.12 | `notifications_page.dart` |

### Profil warung & produk (F1.2)

| Layar Stitch | Fitur | Catatan |
|---|---|---|
| `profil_warung_1`, `profil_warung_2`, `profil_warung_detail_kaya` | F1.2 | Stall profile |
| `profil_kedai_titik_temu` | F1.2 | "Warung Bu Leti - Detail Merchant" |
| `profil_warung_jam_buka`, `profil_warung_refined_time_picker` | F1.0/F1.2 | Tampilan jam buka pada profil warung |
| `detail_merchant_produk` | F1.2 | Profil + produk |
| `detail_produk`, `detail_produk_telur_ayam` | F1.2 | Product detail (varian/opsi/tambahan) |
| `share_produk_bottom_sheet` | F1.9 | Share link `/w/<slug>` |
| `ulasan_pengguna` | F2.8 | Ulasan produk ("Minyak Goreng Guyub") — implementasikan tanpa kotak teks bebas (doc 18 §3.9: rating cuma 👍/👎 + alasan preset) |

### Keranjang & checkout (F1.2)

| Layar Stitch | Fitur | Catatan |
|---|---|---|
| `keranjang_belanja`, `ringkasan_keranjang_belanja` | F1.2 | Cart |
| `checkout_pesanan_1`, `_2`, `_refined` | F1.2 | Checkout |
| `atur_lokasi_pengiriman`, `pilih_alamat_pengiriman` | F1.2 | Titik antar |
| `daftar_alamat`, `detail_alamat_1`, `detail_alamat_2` | F1.2 | Daftar/detail alamat |
| `success_alamat_disimpan` | F1.2 | Konfirmasi alamat tersimpan |
| `warning_konfirmasi_pembatalan` | F1.5 | Konfirmasi batal pesanan |

### Pembayaran (F1.3)

| Layar Stitch | Fitur | Catatan |
|---|---|---|
| `checkout_pembayaran` | F1.3 | |
| `pembayaran_qris`, `pembayaran_qris_refined` | F1.3 | `qris_page.dart` |
| `verifikasi_pembayaran`, `verifikasi_pembayaran_detail`, `verifikasi_detail_pembayaran` | F1.3 | Status klaim pembayaran (sisi customer) |
| `detail_transaksi_menunggu`, `_refined_receipt` | F1.3 | Status `menunggu_verifikasi` |
| `detail_transaksi_berhasil`, `_refined_receipt` | F1.5/F1.12 | Struk sukses |
| `detail_transaksi_gagal`, `_refined_receipt` | F1.5 | Struk gagal |
| `full_screen_receipt_viewer` | F1.5/F1.12 | Struk layar penuh |

### Status pesanan & pelacakan

| Layar Stitch | Fitur | Catatan |
|---|---|---|
| `status_pesanan_1`, `_2`, `_refined` | F1.5 | `order_status_page.dart` |
| `detail_pesanan_customer` | F1.5 | |
| `lacak_pesanan_real_time_map`, `lacak_pesanan_real_time_tracking` | F2.6 | Pelacakan & polling adaptif |
| `status_pesanan_animated_driver_arrival` | F2.6 | |
| `konfirmasi_serah_terima_pesanan` | F2.4 | OTP 4 digit / foto serah terima |
| `pesan_dengan_kurir` | F2.7 | Pesan Cepat dengan driver |
| `menuju_customer`, `menuju_warung` | F2.4 | Tahapan `active_order_page` (ditampilkan dari sisi customer sbg status) |

### Penilaian, riwayat, akun

| Layar Stitch | Fitur | Catatan |
|---|---|---|
| `beri_penilaian` | F2.8 | `review_page.dart` |
| `daftar_penilaian` | F2.8 | (folder ini judulnya "Guyub Merchant" — cek ulang, kemungkinan util bersama Customer/Merchant) |
| `detail_balas_penilaian` | F2.8 ⊕ | Balas penilaian — `private_feedback_card` di doc hanya bilang merchant **tidak bisa hapus**, tidak menyebut fitur balas eksplisit |
| `profil_driver_bang_jaka` | F2.4 ⊕ | Kartu driver di doc 18 §3.8 cuma "nama, foto, plat, telepon" inline; ini profil penuh — elaborasi wajar |
| `ulasan_driver_bang_jaka` | F2.8 | Ulasan driver (tampilan customer) |
| `daftar_pesanan_saya` | F1.12 | `history_page.dart` |
| `favorit_saya` | F1.12 | Field "favorite places" di akun |
| `akun_saya`, `manajemen_profil_pengguna`, `pengaturan_profil_saya` | F1.12 | `account_page.dart` |
| `preferensi_akun` | F1.12 ⊕ | "Pangkalan Hub" — preferensi zona |
| `konfirmasi_keluar_akun` | F1.12 | Logout |
| `pengaturan_app` | F2.4 | **Cek nama**: `<title>` = "Pengaturan - Kurir Lokal" → ini sepertinya layar setelan **Driver** (§5.7), bukan Customer, walau namanya generik |

### Masukan & saran, bantuan (F1.10)

| Layar Stitch | Fitur | Catatan |
|---|---|---|
| `masukan_saran` | F1.10 | `feedback_page.dart` |
| `pusat_bantuan` | F1.10 | Pintu masuk ke-2 (Halaman Bantuan) |
| `panduan_cari_chat`, `onboarding_cari_quick_chat` | F2.7 ⊕ | Tooltip pengenalan Pesan Cepat |

---

## 4 — Mobile Merchant (`guyub_merchant`)

| Layar Stitch | Fitur | Catatan |
|---|---|---|
| `beranda_merchant` | F1.0 | `home_page.dart` |
| `atur_jam_operasional`, `atur_jam_time_picker_refined` | F1.0 | `hours_page.dart` |
| `konfirmasi_jadwal_refined_animation` | F1.0 | |
| `konfirmasi_terapkan_semua_jadwal` | F1.0 | "Terapkan ke semua hari" |
| `pesanan_masuk`, `tawaran_order` | F1.5 | `incoming_order_page.dart` |
| `daftar_pesanan_merchant`, `detail_pesanan_merchant` | F1.5 | `order_list_page` / `order_detail_page` |
| `persiapan_pesanan` | F1.5 | Checklist item pesanan |
| `verifikasi_pembayaran`, `verifikasi_pembayaran_detail` | F1.3 | `pending_list_page.dart` (sisi Merchant) |
| `verifikasi_qris_merchant`, `verifikasi_qris_detail`, `verifikasi_qris_alasan_penolakan` | F1.3 | `confirm_sheet.dart` |
| `pembayaran_berhasil_merchant_success` | F1.3 | |
| `kelola_menu`, `ubah_menu`, `ubah_menu_varian_dinamis` | F1.1 | Menu, varian, opsi, tambahan |
| `filter_menu_merchant` | F1.1 | |
| `stok_toko_merchant_inventory` | F1.1 | "Tandai habis" |
| `pilih_sumber_foto_unggah_foto`, `pilihan_foto_bottom_sheet` | F1.1 | `PhotoTipsSheet` (dipakai juga di F0.4 foto profil) |
| `pusat_notifikasi_merchant` | F1.12-setara ⊕ | Notifikasi Merchant — tidak eksplisit di doc 18 tapi konsisten dgn peta notifikasi §6 |
| `menu_lainnya` | F1.0 | Tab "Lainnya" (Home · Orders · Menu · Others) |
| `pengaturan_profil_merchant`, `_refined`, `_refined_v2` | F0.4/F1.0 | |
| `pendapatan_merchant_1`, `_2`, `_3`, `_refined_dashboard` | **F5.1** | `recap_page.dart` — **catatan penting**: ini fitur Fase 5 (Minggu 54–56, jauh setelah Fase 0/1 yang sedang berjalan). Desainnya sudah ada duluan, tidak masalah tapi jangan dikira ini scope Fase 1 |
| `laporan_bulanan_merchant_1`, `_2`, `_3`, `_refined_v2` | **F5.1** | idem |
| `buat_promo_baru`, `daftar_promo_merchant`, `detail_promo_merchant`, `konfirmasi_promo_baru` | **F5.3** | Slot bersponsor — juga Fase 5, bukan Fase 1 |

### Gap Merchant (di-spec, belum ada desain)
- **F1.7** — Cara kirim & kurir saya (`fulfillment_page`, `courier_list_page`, `fee_rule_form`).
- **F1.4** — Pelanggan & trust / pengaturan COD (`customer_list_page`, `cod_settings_page`).
- **F1.8** — Pesan ke pelanggan (`messages_page` — welcome & thank-you message editor).
- **F4.2** — Kasir Ringan/POS (`pos_grid_page`, `quick_cart_sheet`, `daily_recap_page`).
- **F5.2** — Langganan premium & tagihan (`premium_page` bagian paket & "Saya sudah transfer").
- **F5.3** — Statistik iklan & broadcast (perluasan `premium_page` — baru bagian promo produk yang ada desainnya, bukan statistik & broadcast).

---

## 5 — Mobile Driver (`guyub_driver`)

| Layar Stitch | Fitur | Catatan |
|---|---|---|
| `onboarding_driver_1`, `onboarding_driver_2` | F2.2 | Onboarding aplikasi ketiga |
| `verifikasi_dokumen_driver` | F2.2 | KTP, foto diri, SIM C, STNK |
| `beranda_driver` | F2.4 | Sakelar Online/Offline |
| `tawaran_order` | F2.4/F2.3 | `offer_card_page.dart` — hitung mundur 30 detik |
| `menuju_warung`, `menuju_customer` | F2.4 | `active_order_page.dart` tahap demi tahap |
| `persiapan_pesanan` | F2.4 ⊕ | Kemungkinan dipakai ulang untuk checklist "pesanan diambil" di sisi driver — **cek folder ini dipakai untuk Merchant atau Driver, judulnya generik "Guyub"** |
| `konfirmasi_serah_terima_pesanan` | F2.4 | OTP/foto serah terima |
| `pesan_dengan_kurir` | F2.7 | (folder sama dipakai lintas app — wajar, `quick_message_bar` dipakai bertiga) |
| `pendapatan_driver` | F2.5 | `earnings_page.dart` |
| `pengaturan_app` | F2.4 | Akun & setelan Driver (§5.7) — lihat catatan di atas |

### Gap Driver (di-spec, belum ada desain)
- **F3.1** — Order ojek penumpang & kurir (`ride_order_page`) — sisi driver dipakai ulang dari F2.4, tapi sisi **Customer**-nya belum ada desain sama sekali.
- **F3.2** — Direktori Travel (`travel_directory_page`).
- **F3.3** — Titip Beli sisi driver (`shopping_task_page`, `receipt_capture_page`) — hanya `proses_titip_beli` yang ada, kemungkinan itu sisi Customer.
- **F3.4** — Tawaran sekalian/batching (`batch_offer_sheet`).
- **F4.1** — Tiket wisata sisi Customer (`destination_page`, `buy_ticket_page`, `my_tickets_page`) & sisi Merchant (`scan_page` — pindai gerbang).

---

## 6 — Titip Beli, ojek, tiket (Fase 3–4)

| Layar Stitch | Fitur | Catatan |
|---|---|---|
| `proses_titip_beli` | F3.3 | Kemungkinan besar sisi Customer (`shopping_order_page`/`receipt_update_page`) — **hanya 1 layar untuk fitur yang di rencana punya minimal 4 layar** (pilih toko, daftar belanja, "driver sedang belanja", update struk). Perlu didesain lebih lanjut sebelum Fase 3 mulai. |

Tidak ditemukan desain untuk: order ojek (F3.1), direktori travel (F3.2), tiket wisata (F4.1), kasir ringan (F4.2) — **wajar**, karena timeline fitur-fitur ini memang 2027 (jauh setelah Fase 0/1 yang berjalan sekarang).

---

## 7 — Pola UI bersama (`packages/guyub_ui`, tidak terikat 1 fase)

| Layar Stitch | Komponen doc 18 §1 |
|---|---|
| `alert_sukses_informasi` | Pola sukses generik |
| `error_kendala_sistem` | `ErrorState` + kode jejak 5 karakter |
| `konfirmasi_keluar_akun` | Konfirmasi generik |

---

## 8 — Aset non-layar (dikecualikan dari cakupan) 🎨

| Folder | Alasan dikecualikan |
|---|---|
| `guyub_narrative` | Hanya berisi `DESIGN.md` (dokumen naratif/pitch), tidak ada `code.html` |
| `guyub_ar_explorer` | Eksperimen visual (canvas full-black, tanpa teks/judul) |
| `shader` | Background shader (`<canvas>`, WebGL), bukan layar fungsional |
| `animated_svg_1`, `animated_svg_2`, `animated_svg_3` | Aset animasi SVG lepas (splash/loading), bukan layar dengan konten |

---

## 9 — Ringkasan gap (fitur ter-spec, belum ada desain)

| Fitur | Fase | Layar yang ditunggu |
|---|---|---|
| F1.4 Pelanggan & trust | 1 | `customer_list_page`, `cod_settings_page` |
| F1.7 Kurir saya (Merchant) | 1 | `fulfillment_page`, `courier_list_page` |
| F1.8 Pesan ke pelanggan (Merchant) | 1 | `messages_page` |
| F3.1 Order ojek (Customer) | 3 | `ride_order_page` |
| F3.2 Direktori Travel | 3 | `travel_directory_page` |
| F3.3 Titip Beli (Driver) | 3 | `shopping_task_page`, `receipt_capture_page` |
| F3.4 Tawaran sekalian | 3 | `batch_offer_sheet` |
| F4.1 Tiket wisata | 4 | `destination_page`, `buy_ticket_page`, `my_tickets_page`, `scan_page` (gerbang) |
| F4.2 Kasir Ringan | 4 | `pos_grid_page`, `quick_cart_sheet`, `daily_recap_page` |
| F5.2 Langganan premium | 5 | Perluasan `premium_page` (paket & tagihan) |
| F5.3 Statistik iklan & broadcast | 5 | Perluasan `premium_page` |

Semua gap ini sejalan dengan timeline — belum jadi masalah untuk Fase 0/1 yang sedang berjalan (Agu–Des 2026), tapi perlu masuk antrean desain sebelum minggu kerja fase masing-masing dimulai (lihat `00-indeks.md` §1 untuk kalender per fase).

---

## 10 — Layar yang dibuang dari pemetaan (bertentangan dengan rencana)

Per keputusan: **kalau desain Stitch ambigu/bertentangan dengan dokumen rencana (PRD/doc 18/doc 19/dokumen fase), ikuti rencana — layar/bagian Stitch yang menyimpang dibuang dari pemetaan, tidak diimplementasikan.** Dibuang dari §3–4 di atas:

| Layar Stitch (dibuang) | Alasan |
|---|---|
| `beri_penilaian_pilih_media` | Lampiran media pada layar penilaian tidak ada di rencana — doc 18 §3.9 tegas rating cuma 👍/👎 + alasan preset, tanpa komentar/lampiran bebas. Lampiran media tetap ada, tapi khusus di Masukan & saran (F1.10). Fungsinya sudah tercakup `beri_penilaian`. |
| `daftar_komplain_merchant_1`, `_2`, `detail_komplain_solusi` | Doc 18 §4.10 tegas: follow-up komplain merchant lewat telepon/WhatsApp Ops, bukan balasan in-app. Penanganan komplain adanya di Ops Console Web (`masukan.vue`, `anomali-penilaian.vue`), bukan layar app Merchant. |
| `pusat_bantuan_faq_live_chat` | Tidak ada konsep chat bebas di rencana mana pun — yang ada cuma Pesan Cepat (F2.7, tombol siap pakai tanpa kotak teks). Fungsi bantuan sudah tercakup `pusat_bantuan` (FAQ + tombol WhatsApp Ops, doc 18 §2.5). |

Catatan penamaan (bukan pertentangan isi, jadi **tetap dipetakan**, bukan dibuang):
- `pengaturan_app` — judul `<title>` "Pengaturan - Kurir Lokal" → setelan **Driver** (§5.7).
- `persiapan_pesanan` — konten "Daftar Menu Pesanan" → dipetakan ke **Merchant** (F1.5, checklist item pesanan).

Item bertanda ⊕ (elaborasi tambahan) di §1–5 **tetap dipetakan dan boleh diimplementasikan** — itu bukan pertentangan dengan rencana, hanya detail/langkah tambahan yang belum sempat ditulis eksplisit di doc 18/19/fase (mis. registrasi 3 langkah, kartu profil driver penuh, manajemen perangkat terhubung). Aturan "buang dari pemetaan" di atas hanya berlaku untuk yang isinya menyimpang dari rencana, bukan untuk ⊕.
