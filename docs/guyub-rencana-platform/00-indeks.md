> **Sesi baru / lanjut kerja?** Baca [`STATUS.md`](STATUS.md) dulu — posisi implementasi saat ini, apa yang sudah selesai & terverifikasi, keputusan yang diambil di luar dokumen ini, dan gotcha operasional. Dokumen-dokumen di bawah ini baru dibuka kalau butuh detail spesifik.

# GUYUB — Implementation Plan per Platform (index)

**Derivative of** `docs/17-guyub-prd.md` (PRD), `docs/18-guyub-spesifikasi-fitur.md` (screens per application), and `docs/19-guyub-rencana-implementasi.md` (files per feature).

Document 19 answers **"what file did I touch"**. This set of documents answers **"who does what on which platforms, and in what order between platforms"** — one file per phase, per the PRD §37.3 timeline.

If there is a conflict: **PRD wins**, then doc 18, then doc 19, then this document.

**Status**: v1.0-draft. Weeks & calendars follow PRD §37.3; fill the phases following PRD §12; the sequence within the phases follows PRD §37.4.

---

## 1 — Files in this collection

| Phase | File | Sunday | Calendar | Tags |
|---|---|---|---|---|
| 0 — Foundation | [`fase-0-fondasi.md`](phase-0-foundation.md) | 1–6 | Aug–Sep 2026 | `v0.1.0` |
| 1 — Culinary (pick up yourself + merchant courier) | [`fase-1-kuliner.md`](phase-1-culinary.md) | 7–20 | Sep–Dec 2026 | `v0.2.0` |
| → Public launch | [`fase-1-kuliner.md`](phase-1-culinary.md#9--public-launch-week-2122) | 21–22 | Dec 2026 | — |
| 2 — GUYUB Courier | [`fase-2-kurir-guyub.md`](phase-2-courier-guyub.md) | 23–35 | Jan–Mar 2027 | `v0.3.0` |
| 3 — Services + Purchase | [`fase-3-jasa-titip-beli.md`](phase-3-jasa-titip-beli.md) | 36–43 | Apr–May 2027 | `v0.4.0` |
| 4 — Ticket + Light Cashier | [`fase-4-tiket-kasir.md`](phase-4-ticket-cashier.md) | 44–53 | Jun–Aug 2027 | `v0.5.0` |
| 5 — Money, Premium & Ops | [`fase-5-uang-premium-ops.md`](phase-5-money-premium-ops.md) | 54–62 | Aug–Oct 2027 | `v0.6.0` |
| 6 — Hardening & release | [`fase-6-pengerasan-rilis.md`](phase-6-hardening-release.md) | 63–68 | Oct–Nov 2027 | `v1.0.0` |

Cross-reference: [`pemetaan-desain-stitch.md`](pemetaan-desain-stitch.md) memetakan 172 layar desain di `stitch_spesifikasi_desain_mobile_guyub/` ke fitur `F<fase>.<n>` di atas — termasuk gap (fitur ter-spec belum ada desain) dan item yang perlu diklarifikasi.

---

## 2 — Five platforms (and why API counts)

The question is plans for **web · customer mobile · merchant mobile · driver mobile**. These four are *clients*; none of it can be done until the contract is in place. Therefore, each feature in this document is always broken down into **five columns**, with API as column zero.

| Code | Platforms | Repos / path | Stacks | Role in the plan |
|---|---|---|---|---|
| **API** | Shared backend | `berdikari-api/` (`api/`) | Laravel 13, nwidart modules | **Line zero** — contract, value authority, RBAC. All clients are waiting for this |
| **WEB** | Profile Web + Ops Console | `berdikari-web/` (`web/`) | Nuxt 4, Vue 3, Pinia, Cloudflare Pages | Public (`/publik/**`) & Ops (`/guyub/**`) |
| **CUS** | Mobile Customers | `guyub-mobile/apps/guyub_customer` (`mob/`) | Flutter, melos, `go_router` | Booker |
| **MER** | Mobile Merchants | `guyub-mobile/apps/guyub_merchant` | Flutter | Stall — most critical application (orders must be **audible**) |
| **DRV** | Mobile Driver | `guyub-mobile/apps/guyub_driver` | Flutter | Newborn in Phase 2 |
| **SHR** | Shared packages | `guyub-mobile/packages/guyub_core`, `guyub_ui` | Flutter | Three apps are used — the changes touch them all |
| **INF** | Infra & legal | `infra/guyub/`, `docs/` | Docker, R2, docs | Not application code, but blocking release |

**Sequencing rules that apply across phases**: `API → SHR → klien`. A screen may not start until its endpoint contract is agreed (allowed with a *stub* response), and `guyub_core`/`guyub_ui` always preempts the consuming application.

---

##3 — Load per platform, per phase (large map)

Scale: ●●● heavy · ●● medium · ● light · — untouched.

| Phase | API | WEB | CUS | MER | DRV | Phase rhythm determinants |
|---|---|---|---|---|---|---|
| 0 | ●●● | ●● | ● | ●● | — | Auth + merchant notification sounds |
| 1 | ●●● | ●● | ●●● | ●●● | — | Payment gateway (§5h) |
| 2 | ●●● | ● | ●● | ● | ●●● | The Driver Application is born |
| 3 | ●● | ● | ●● | — | ●● | Buy Tip & bailout ceiling |
| 4 | ●●● | ● | ●● | ●●● | — | Scan QR offline & Light Cashier |
| 5 | ●●● | ●●● | — | ●● | — | Ops & commissions console |
| 6 | ● | ● | ●● | ●● | ●● | State audit across three applications |

Important reading from this table: **Phase 1 is the only phase with three heavy platforms at once** — that's why it's 14 weeks, and that's why discovery (F1.9) was intentionally put at the back.

---

##4 — Rules that apply to each feature (not repeated per row)

Derived from doc 19 §0.4 and DNA Berdikari §2/§9j. Every line of work in any document is subject to this:

1. **Money value, stock, quota calculated by server** — idempotent, audit recorded (PRD Inv. 2, §16.3). Client sends **intent**, receives **value**.
2. Each `POST` mutation carries **`Idempotency-Key`** (PRD Inv. 4). Submissions queued offline use **the same** key when resent.
3. New permission → `PermissionSeeder.php` + `web/app/utils/permissions.ts`, no wildcard, **and test rejection path** (DNA §9j.8).
4. The public endpoint only touches the projection table `*_public_*` (PRD §6.3).
5. Resource API is always **explicit field list** — never model `toArray()`.
6. Copy **Indonesian** passes PRD §17; no hard strings in widgets (all in ARB).
7. Each screen has a state of **loading / blank / failed + try again** + 5 character trace code (PRD §31.2).
8. Test the feature in `api/tests/Feature/Guyub/`; test the widget/viewmodel in the related app.
9. Touch target ≥ 44 px, designed at 360 dp, text at least 14 sp.

---

## 5 — How to read phase files

Each phase beam has the same shape:

1. **Phase pass gate** — from PRD §37.3 and §37.6.
2. **Per platform summary** — what was born in that phase for each platform.
3. **Critical path & parallelization** — what locks what.
4. **Per feature** (`F<fase>.<n>`), each contains:
- week, reference PRD/doc 18/doc 19;
- **platform matrix** — who is involved and in what order;
- one block per platform: jobs, master files, used contracts;
- **Done when** — per platform, can be checked.
5. **Weekly calendar** — week × platform.
6. **Notes & assumptions** — including the ⊕ marker.

**The ⊕** marker means: client work that is **implied in dock 18 but does not yet have its own line in dock 19**. It appears in this document because without it the promised screen doc 18 §9 would not exist. All ⊕ are summarized in the *Notes* section of each phase file — review before locking the phase scope.

The file legend follows doc 19 §0.1: `+` new file, `~` existing and changed file (adding, not refactoring), `api/` `web/` `mob/` `infra/` according to table §2 above.

---

## 6 — Work rhythm (PRD §37.2, §37.7)

- **Every Monday**: one day for field/legal **before** touching code; specify **3 results** that week, not 10.
- **Every Friday**: tag, then show it to **one stall owner** — not yourself.
- **One number to monitor**: current week vs planned week. Miss > 3 weeks → **cut next phase scope**, not overtime.
- **Can be shifted**: Ticket (F4), Light Cashier (F4), Full Premium (F5), Purchase Deposit (F3).
- **No swipe**: payment gateway (§5h), security controls §9, legal checklist §22.8, restore practice §19.3, input channels §28.
- Estimated week wear **20 hours/week** (§37.1). Different speeds → multiply the weeks; **order between platforms does not change**.
