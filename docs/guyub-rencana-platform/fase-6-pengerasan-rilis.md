# Fase 6 — Pengerasan & rilis · per platform

**Minggu 63–68 · Okt–Nov 2027 · tag `v1.0.0`**
Rujukan: PRD §12, §37.3, §2.10, §19.3, §25, §26 · dok 18 §8, §9 · dok 19 §8.
Indeks: [`00-indeks.md`](00-indeks.md)

**Gerbang lulus fase** (PRD §37.3, §37.6):
- **Audit keadaan kosong/gagal tuntas** — tidak ada layar putih di tiga aplikasi.
- **Uji beban ringan** lulus: 50 pengguna serentak, 10 menit, **p95 < 400 ms**.
- **Latihan restore** tercatat; target **12 dari 12 per tahun**.
- Rollback ke tag sebelumnya **benar-benar diuji**, bukan diasumsikan.
- Play Store listing + kebijakan privasi siap; tag `v1.0.0`.

> Fase ini **tidak menambah fitur**. Setiap dorongan menambah "satu hal kecil lagi" di sini adalah cara paling umum menggagalkan rilis v1.0.

---

## 1 — Ringkasan per platform

| Platform | Beban | Isi |
|---|---|---|
| **CUS** | ●● | Audit keadaan seluruh `lib/ui/features/**`, outbox offline |
| **MER** | ●● | Audit keadaan, outbox offline, listing Play Store |
| **DRV** | ●● | Audit keadaan, outbox offline (paling kritis — driver paling sering kehilangan sinyal) |
| **SHR** | ●● | `guyub_core/offline/{outbox,retry_policy}` dipakai tiga aplikasi |
| **WEB** | ● | Halaman `/status` disempurnakan, kebijakan privasi final |
| **API** | ● | Perbaikan dari hasil uji beban; tidak ada endpoint baru |
| **INF** | ●● | Uji beban k6, latihan restore, jalur rollback |

---

## 2 — Urutan

```
F6.2 outbox (SHR dulu) → F6.1 audit keadaan (tiga aplikasi, paralel)
F6.3 uji beban ─────────┐
F6.4 latihan restore ───┼── boleh paralel sejak minggu 63
F6.5 rilis ─────────────┘ terakhir, setelah semuanya hijau
```

**Kenapa F6.2 sebelum F6.1**: outbox mengubah cara setiap layar menampilkan keadaan "belum tersambung". Mengaudit keadaan lebih dulu berarti mengauditnya dua kali.

---

## F6.1 — Audit keadaan (loading / kosong / gagal)

**Minggu 63–66** · PRD §2.10, §31.2 · dok 18 §0 · dok 19 F6.1

| Platform | Terlibat |
|---|---|
| CUS · MER · DRV | ✅ — seluruh `lib/ui/features/**` |

Setiap layar di **tiga aplikasi** wajib punya, tanpa pengecualian:

| Keadaan | Syarat |
|---|---|
| **Loading** | Bukan layar kosong; kerangka atau indikator yang jelas |
| **Kosong** | Ilustrasi tangan sendiri + satu kalimat + **satu aksi** (§27.2) |
| **Gagal** | "Oups, ada kendala…" + **Coba lagi** + **5 karakter kode jejak** + tautan *"Kasih tahu kami apa yang terjadi"* (F1.10) |
| **Offline** | Penanda "belum tersambung" — **bukan layar gagal** (dok 18 §8) |

Cara kerja yang disarankan: satu daftar periksa per aplikasi, satu baris per rute `go_router`. Layar yang tidak bisa dibuktikan keempat keadaannya **dianggap belum selesai**.

**Selesai bila** — **tidak ada satu pun layar putih** di tiga aplikasi, dan setiap layar gagal bisa menyebutkan kode jejaknya.

---

## F6.2 — Ketahanan offline

**Minggu 63–64** · PRD Inv. 4 · dok 18 §8 · dok 19 F6.2

| Platform | Terlibat | Urutan |
|---|---|---|
| SHR | ✅ | 1 |
| CUS · MER · DRV | ✅ | 2 |

### SHR

- `guyub_core/lib/src/offline/{outbox,retry_policy}.dart` `+` — setiap kiriman yang diantre memakai **`Idempotency-Key` yang sama** saat dikirim ulang; penanda "belum tersambung".

### Per aplikasi (mengikuti dok 18 §8)

| Aplikasi | Tetap bekerja | Diantre | Diblokir (dengan penjelasan) |
|---|---|---|---|
| **CUS** | Riwayat & status terakhir, hitung mundur lokal | Masukan & saran, pesan cepat | Membuat pesanan (butuh validasi server) |
| **MER** | Daftar pesanan aktif, detail & item | Terima/tolak, tandai siap, pesan cepat | Verifikasi pembayaran (butuh data terbaru) |
| **DRV** | Detail order aktif, alamat, OTP | Semua perubahan status, foto, pesan cepat | Menerima tawaran baru |

**Selesai bila** — mematikan jaringan di tengah alur **tidak pernah** menghasilkan pesanan ganda saat jaringan kembali, dan **tidak pernah** menampilkan layar gagal untuk hal yang bisa diantre.

---

## F6.3 — Uji beban ringan

**Minggu 65** · PRD §25.3, §26.1 · dok 19 F6.3

| Platform | Terlibat |
|---|---|
| INF + API | ✅ |

- `infra/load/k6-guyub.js` `+` — **50 pengguna serentak, 10 menit, p95 < 400 ms**.
- Skenario yang diuji: discovery (paling sering & anonim), checkout (paling mahal), polling status (paling banyak permintaan).
- Hasilnya dipakai untuk memutuskan **kapan naik ke T1** (§25.7) — bukan untuk optimasi spekulatif.

**Selesai bila** — angka p95 tercatat di `infra/` dan ambang naik-tingkat ditulis, bukan diingat.

---

## F6.4 — Latihan restore

**Minggu 66** · PRD §19.3 · dok 19 F6.4

| Platform | Terlibat |
|---|---|
| INF | ✅ |

- `infra/backup/restore-drill.sh` `~` — dijalankan lagi dan **dicatat**; target **12 dari 12 per tahun**.
- Ini latihan yang keberapa sejak F0.8? Kalau jawabannya bukan "keduabelas", catat kekurangannya sekarang — jangan menutup fase dengan angka yang tidak jujur.

**Selesai bila** — restore selesai di dalam RTO dan waktunya tercatat, seperti di F0.8.

---

## F6.5 — Rilis

**Minggu 67–68** · PRD §12, §22, §37.6 · dok 19 F6.5

| Platform | Terlibat |
|---|---|
| CUS · MER · DRV | ✅ |
| WEB | ✅ |
| INF | ✅ |

- `mob/apps/*/android/app/build.gradle` `~` — versi rilis, penandatanganan, ukuran APK diperiksa ulang (< 30 MB seperti F0.4).
- Play Store listing untuk **tiga aplikasi**: tangkapan layar, deskripsi Bahasa Indonesia, **kebijakan privasi tertaut** (§22).
- `web/app/content/guyub/*.md` `~` — kebijakan privasi & S&K final, sinkron dengan yang tertaut di Play Store.
- `web/app/pages/publik/status.vue` `~` — halaman status disempurnakan; ia yang dipakai saat insiden (§19.4).
- **Rollback ke tag sebelumnya diuji nyata** di staging — bukan dianggap bisa.
- Tag `v1.0.0` + catatan perubahan.

**Selesai bila** — tiga aplikasi lolos tinjauan Play Store; kebijakan privasi yang tertaut **identik** dengan yang di web; satu rollback nyata sudah dijalankan dan waktunya diketahui.

---

## 8 — Kalender mingguan Fase 6

| Minggu | SHR | CUS | MER | DRV | WEB / INF |
|---|---|---|---|---|---|
| 63 | **F6.2 outbox** | — | — | — | F6.3 skrip k6 disiapkan |
| 64 | F6.2 retry policy | F6.2 integrasi | F6.2 integrasi | F6.2 integrasi | — |
| 65 | — | F6.1 audit | F6.1 audit | F6.1 audit | **F6.3 uji beban** |
| 66 | — | F6.1 audit | F6.1 audit | F6.1 audit | **F6.4 restore drill** |
| 67 | — | F6.5 build rilis | F6.5 build rilis | F6.5 build rilis | F6.5 privasi & status |
| 68 | — | Play Store | Play Store | Play Store | **rollback diuji · tag `v1.0.0`** |

---

## 9 — Catatan & asumsi fase ini

1. **Tidak ada penanda ⊕** — dok 18 §9 Fase 6 (halaman status disempurnakan di Web; audit keadaan di tiga aplikasi) tercakup penuh.
2. **Fase ini tidak menambah fitur.** Kalau sesuatu terasa "kurang" di sini, catat sebagai v1.1 — bukan sebagai tambahan minggu 67.
3. **Driver adalah aplikasi yang paling diuntungkan F6.2.** Ia paling sering kehilangan sinyal (di jalan, di lembah, di dalam gedung), dan perubahan status yang hilang di sana berarti uang yang hilang.
4. **Uji beban memakai angka T0** (§25.3). Kalau p95 meleset, jawabannya mungkin naik ke T1 (§25.7) — bukan otomatis mengoptimasi kode.
5. **Jumlah latihan restore adalah angka kejujuran fase ini.** Ia dimulai di F0.8 dan dihitung sepanjang 68 minggu; menutupnya dengan "kami lakukan dua kali" lebih berguna daripada menuliskan angka yang tidak terjadi.
