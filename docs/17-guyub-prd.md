#17 — GUYUB — Project DNA / PRD

**Product**: GUYUB — hyperlocal ordering platform (culinary, delivery/ojek/courier services, tourist tickets) for **Pangkalan District** and **Tegalwaru District**, Karawang Regency. Travel/car charter is just a contact directory (§22.4).
**Backend**: `berdikari-api` (Laravel modular monolith) — reused, not a new application.
**Client**: 3 Flutter apps (Customer, Merchant, Driver) + web-based Ops console.
**Per-app screen specifications**: `docs/18-guyub-spesifikasi-fitur.md` (a derivative of this document).
**Document status**: v1.0-draft — design, no code yet. (v0.2 locks individual owners, merchant trust-based COD, and static QRIS payment handling; v0.3 adds product ratings §5i and Merchant Premium §5h; v0.4 adds operating hours & last message limit §5k; v0.5 adds estimate & countdown §5l, merchant messages §5m, and tone guide §17; v0.6 adds light cashier §18, DR runbook §19, web profile §20, and go-to-market strategy §21; v0.7 adds legal compliance mapping §22 — which takes travel/car charter bookings out of v1; collect, drivers paid cash on pickup; v1.0-draft adds Buy Tip §24, T0 infra specs §25, test schematic §26, visual design guide §27, feedback & suggestions channel §28, storage budget §25.6, and Quick Order §29.) This document is the single source of truth for GUYUB and applies **above** `.agents/skills/project/berdikari.md` (Independent DNA Project); if conflicting, DNA Berdikari prevails unless this document explicitly states an exception.

---

##1 — Product Identity

GUYUB is a **hyperlocal market in one sub-district**: stalls, motorbike taxi drivers and tourist destination managers in Pangkalan & Tegalwaru accept orders from surrounding residents via cellphone.

**Not** a small version of Gojek/Grab. The differences that shape all technical decisions:

| Aspect | National application | GUYUB |
|---|---|---|
| Coverage | Hundreds of cities | 2 sub-districts, radius ± 15 km |
| Address | Full geocoding, free addresses | **List of curated places** (villages, hamlets, benchmarks/landmarks) — user selects, not types |
| User funds | Detained platform (electronic money, licensed) | **Never held** — pay directly to merchant/driver. Individual platform owners, so this is a legal requirement, not an option |
| Pay cash/COD | Open to all | **Privileges that a merchant gives** to customers he knows (§5g) |
| Fleet | Thousands of anonymous drivers | Dozens of drivers **known to residents**; social reputation > algorithms |
| Infra costs | Irrelevant | **Hard limit**: pilot ≤ IDR 500 thousand/month |

**North star**: a stall owner with an Android cellphone worth Rp. 1.5 million and a quota of 2 GB can receive and complete orders **without being trained**. If a feature needs training, it's wrong.

**Name & tone**: "guyub" = harmony, mutual cooperation. Copy uses shop language, not application language ("New order!", "Has it been delivered?", not "Order confirmed").

---

## 2 — Non-Negotiables

Inherited from DNA Berdikari (§2) — remains in full force:

1. **Indonesian** for all text the user sees. The l10n key can be English, the value must be Language. The tone must be **relaxed and humane** according to **§17** — copy that does not pass §17 is considered defective, not just less readable.
2. **Simple over complete** — no jargon. There is no "escrow", "settlement", "SLA" on the user screen.
3. **Mobile-first** — design at 360 dp, touch target ≥ 44 × 44 px.
4. **Extend, never replace** — GUYUB **add** module in `berdikari-api`; do not refactor/rename existing modules, routes, or tables.
5. **Backward compatibility** — contracts API `v1` that have been used `berdikari-web` and `berdikari-mobile` cannot be changed.
6. **API stateless** — three Flutter apps using the same endpoint without a server session.
7. **Docker-first** — `docker-compose.yml` root remains the sole source of the service version.

GUYUB special additions (required, parallel to the above):

8. **The platform does not hold funds from users — and individual owners.** Holding balances/top-ups = electronic money, requires permission from Bank Indonesia. Because the platform owner is an **individual** (not a business entity), this is not just a design choice: the *split settlement* and *sub-merchant* features in payment gateways are generally only open to licensed business entities. So the money flows **directly** customer → merchant/driver; GUYUB only records and collects commission. **No wallet, no top-up, no escrow account.** The owner's personal account only accepts commissions, never accepts payment for orders.
9. **Byte budget.** List responses ≤ 30 KB, product images ≤ 80 KB (WebP, resized in client before upload), no polling when there are no active orders. User quota is a user fee.
10. **Graceful degradation, not a white screen.** Each screen has a *loading / blank / failed state + retry button*. Orders that have been received must still be read by the merchant/driver when the signal is lost.
11. **Infra cost limit**: pilot ≤ IDR 500 thousand/month; increases only following order volume, not following features.
12. **Minimum compliance from day one**: PSE Kominfo registration (private scope, can be in the name of an individual/NIK), privacy policy + user agreement in accordance with **Law 27/2022 (PDP)**, driver location retention is limited (see §11).
13. **Customer claims are not proof of payment.** `lunas` status may only be changed by **merchant confirmation of its own account mutation** (phase 1) or **verified gateway webhook** (advanced phase). The “I paid” button and the transfer screenshot are *tools*, not sources of truth — they can be faked in 10 seconds.
14. **Merchants do not cook before the order is guaranteed.** An order may only enter the cooking queue if **it has been paid in full** or **the customer is trusted by the merchant** (§5g). The biggest loss to merchants is not dead applications, but cooked food that is not picked up.
15. **There are no orders entered into merchants that are closed — or that have passed the last message limit.** The open/close status and last message limit are **calculated by the server from server time**, never from the clock on the cellphone and never from the status sent by the client (§5k).
16. **Customer never waits without explanation.** Each running state displays an estimate or countdown (§5l); when the estimate is missed, a calming sentence appears — not a minus number.

---

## 3 — Actors, Applications, and Roles

| Actor | Application | Role RBAC | Summary |
|---|---|---|---|
| Residents ordering | **GUYUB Customer** (Flutter) | `guyub-customer` | Search for merchants, order food, order motorbike taxis/couriers, buy tourist tickets, track orders, view the travel directory |
| Shop owner / service provider | **GUYUB Merchant** (Flutter) | `guyub-merchant-owner`, `guyub-merchant-staff` | Open/close shop, accept/reject orders, change menu & stock, view income |
| Tour Manager | **GUYUB Merchant** (tourist mode) | `guyub-merchant-owner` | Manage destinations, daily quota, scan tickets at the gate |
| Motorbike taxi / courier | **GUYUB Driver** (Flutter) | `guyub-driver` | Receive delivery & passenger orders, navigation, proof of completion. Verification: driving license C required, valid STNK (loan motorbike allowed), double helmet (§22.10) |
| GUYUB Operator (BUMDes/cooperative/manager) | **Ops Console** (web) | `guyub-ops`, `guyub-admin` | Verify merchants & drivers, handle complaints, set commissions & areas, view reports |

**Identity decision**: customer and driver are `users` in the same IAM table, **without** business membership (`business_id = null`). Merchants are **tenants** (`businesses`) like in Berdikari — so growing merchants can directly use Berdikari ERP (POS, stock, finance) without data migration. There is no second user table, no second authentication path (see §9, Invariant 6).

---

##4 — Scope

**MVP (v1.0) — login:**
- Culinary: merchant catalog, **product variants & choices (spicy, hot/cold, portions, additional — §34)**, basket, order, delivery by driver **or** pick up yourself.
- Services: passenger motorbike taxi & courier (pick up point → destination point from curated list of places). **Car travel/charter is a contact directory only**, not a booking — see §22.4.
- Tourist ticket: destination + quota per date + QR ticket + scan at the gate (can be **offline**).
- Payment: Merchant's static **QRIS** (unique nominal + merchant's manual verification, §5h) and **cash/COD limited to customers trusted by merchant** (§5g).
- Dispatch driver: sequential offer to the nearest online driver.
- Notifications: FCM push + in-app notifications.
- **Merchant operating hours** — schedule per day (multiple sessions allowed), holidays, temporarily closed, and **last order limit before closing** — §5k.
- **Per product ratings** (likes / dislikes + preset reasons) and “Best Selling” / “Most Liked” ratings on discovery — §5i.
- Simple ratings for merchants and drivers (separate from product ratings).
- **Purchase Tip** — driver buys from a non-partnered shop, at the customer's written request (§24).
- **Merchant Premium** — monthly subscription + sponsored slot on the homepage as a source of platform revenue — §5m.
- Ops console: verification, complaints, commissions, reports.

**MVP — not entered (on purpose):**
- GUYUB wallet/balance, top-up, points, tiered promos.
- Real-time second-by-second live map (see §7.4 — use adaptive polling).
- In-app chat (use phone; number displayed only when order is active).
- **Multi-merchant basket** — architecturally closed as long as the platform does not hold funds; the replacement is Tip Buy or two orders in one direction (**§33**). Also: recurring subscriptions and scheduling.
- **Batching** (one driver two orders) — the seam is installed in Phase 2, the feature is Phase 3 (§33.3).
- iOS for Drivers & Merchants (Android first; Customers can use iOS in phase 3).
- Full offline-first (offline resilience only: read from cache + queue resend).

---

##5 — Core Business Flow

### 5a — Order culinary (delivery)
1. Customer selects merchant (**open and not past last order limit**, §5k, and within service area) → add item → select delivery point from **list of places**; may add a benchmark in the form of free text ≤ 120 characters.
2. The server calculates the subtotal, shipping (from the rate table per zone), and commission. **Client never sends price.**
3. **Payment gateway** (§5g): the server determines the payment methods that customers can choose for that merchant. Cash/COD only appears if the customer is *trusted* **and** the fulfillment mode is not GUYUB courier (§23.4); other than that it's just QRIS pay-first. **Always one time payment** — food and postage in one amount (§23.4). → `POST /guyub/orders` with `Idempotency-Key`.
4. If you pay first: the order has status `menunggu_pembayaran` with **unique nominal** (§5h) and a time limit of 15 minutes. **Merchant has not been notified, not yet cooked.** After merchant confirms incoming funds → go to step 5. Over limit → cancel automatically, no loss.
5. Merchant receives high priority notification (alarm sounds, foreground service) → **Accept** / **Reject (reason)** within 5 minutes; over limit → auto-cancel, customer is notified. For orders COD from new customers, merchants look at the customer's short card (§5g) and the **Call First** button before deciding.
6. Once received → dispatch offers the order to the nearest online driver, 30 seconds per driver, maximum 5 rounds; failed → merchant may choose "self delivery" or order canceled without penalty.
7. Driver: **Pick up** (+ pressing **"Delivery received"** when the stall hands over cash delivery, §23.4) → **Picked up** → **Delivered** → **Done** (with **4 digit OTP** from the customer, or photo if the customer is not there). Customer not available → status `gagal_tidak_diambil` + note instead of `selesai`; drivers still get paid.
8. Pick up yourself: orders have a **pick up limit** (default 60 minutes after ready). Over limit → `gagal_tidak_diambil`, recorded in customer reliability history (§5g).

### 5b — Passenger & courier taxis (car travel: see limitations §22.4)

Just like 5a without a merchant: customer chooses pick-up point & destination from a list of places, the server calculates the fare from the **inter-zone fare matrix** (not per-km GPS — cheaper, fairer, and can't be cheated). The fare must be within the lower–upper limit range for online motorcycle taxis applicable to this regional zone, and the application discount must be below the maximum limit set (§22.4).

**Travel/car charter is not included in v1.** Special rental transportation requires a licensed legal entity, and the GUYUB owner is an individual — booking a passenger car without a permit is illegal transportation, not just an administrative risk. Replacement in v1: **Travel Directory** — a list of licensed travel providers complete with a call button, no in-app booking, no rate setting, and no commission. Details and path of ascent in §22.4.

### 5c — Tourist ticket
1. Customer selects destination + date + number of tickets → server orders quota (`ticket_inventories`, row lock + limit per date).
2. Pay (phase 1: QRIS/cash at gateway with status `dipesan`; phase 2: prepay via gateway).
3. Ticket = **QR digitally signed** (compact payload + Ed25519 server signature). The Merchant application at the gateway verifies **signatures offline** with the embedded public key, records local exchanges, then syncs when the signal is present. Duplicate exchanges are prevented via local storage + server reconciliation (one-time ticket; conflict reported to Ops).
4. This also closes DNA Berdikari roadmap #11 (pool ticket) — the same `Ticketing` module.

### 5d — Order state machine (one for all verticals)

Order status and payment status are **two separate fields** that lock each other.

```
status_bayar:  belum_bayar → menunggu_verifikasi → lunas
                          ↘ kadaluarsa / gagal / dikembalikan

status_order:  dibuat → [gerbang: lunas ATAU COD-dipercaya] → menunggu_konfirmasi
             → diterima → disiapkan → menunggu_driver → driver_ditugaskan
             → dijemput → diantar → selesai
             ↘ dibatalkan_customer / dibatalkan_merchant / dibatalkan_sistem
             ↘ gagal_tidak_diambil        (makanan siap, customer tidak ambil / tidak bayar)
```

Rules enforced **on the server**:
- Each transition has a list of actors permitted to perform it and a valid origin status; illegal transition → `422`, audit logged.
- **Orders never reach the merchant before the payment gateway passes.** This is the only structural protection against "cooked, customer gone".
- `status_bayar` **cannot be changed by the customer** under any circumstances (Non-negotiable 13). Customers can only make *claims* (`belum_bayar → menunggu_verifikasi`).
- `gagal_tidak_diambil` is not a synonym of `dibatalkan`: it records merchant losses, enters customer reliability history, and can be submitted as a complaint to Ops.
- No status can be reversed; correction = new compensation record (B7 security DNA). `order_type ∈ {kuliner, ojek, kurir, tiket}` uses the same state machine with irrelevant steps skipped. (`travel` does not become `order_type` in v1 — §22.4; the enum is set up but not enabled.)

### 5e — Commissions & billing (individual owners)
- Platform commission: % of merchant subtotal (default 0% during pilot → gradual increase), + fixed deduction per service order. **Always count the server**, never the client.
- Money orders **never go through GUYUB**. GUYUB charges a **weekly** commission from the server-calculated summary (`GET /guyub/settlements/summary`) — the merchant pays to the platform owner's personal account/QRIS. Logged in the existing `Finance` module.
- Merchants who are in arrears > 2 weeks: their status is reduced to *does not appear in discovery* (not suddenly blocked), with gradual notification. This decision is manual by Ops, not automatic.
- Because it is an individual owner, commission = individual income: keep a neat record for PPh, and **never** mix up transfers of order payments to the same account (see §11).
- Future path: once a business entity exists, `Payment` can install a gateway with split settlement without changing the domain — see §5h "up path".

### 5f — Cancellations, complaints, refunds
- Customers can cancel for free before `diterima` status; After that, you need merchant approval.
- Complaint → ticket in Ops Console with evidence (photo, status history, `guyub_order_events` history) → Ops decision recorded audit.
- **Phase 1 refunds are carried out by merchants directly to customers** (transfer/cash); the system only records `dikembalikan` + evidence. GUYUB has never been an intermediary for funds — including during disputes.

### 5g — COD Trust (who can pay cash)

The problem is real: the food is cooked, the customer doesn't show up, the merchant bears all the losses. The solution is not to delete COD, but **make COD a privilege given by the merchant**, not a customer's free choice.

**Per merchant policy** (`cod_policy`, set in Merchant app):

| Value | Meaning | Default |
|---|---|---|
| `tutup` | All orders pay first | — |
| `pelanggan_dipercaya` | COD only for customers trusted merchants | ✅ default |
| `terbuka` | COD for anyone (merchants do so at their own risk, there is a warning when activating) | — |

**Who is a "trusted customer"** — the server decides, the merchant controls:
1. Merchant marks customer as trusted manually (from order history or after calling), **or**
2. The customer has completed **≥ 2 orders** at that merchant without fail (automatically, the merchant can revoke it at any time).

Trust is **per merchant**, not transmitted between merchants. Warung A believes Mrs. Siti; stall B not necessarily.

**COD nominal limit**: default maximum IDR 100,000 per order, can be changed by merchant. Above the limit → pay first, regardless of trust status.

**Customer card in Merchant app** — displayed **before** the merchant presses Accept. It contains actual numbers, not a secret score:

> **Mrs Siti — new customer**
> Completed orders: 0 · Not picked up: 0 · Joined: 3 days ago
> [ Call first ] [ Accept ] [ Ask to pay first ] [ Reject ]

The **"Request payment first"** button is an important middle ground: the merchant does not reject the order, but moves it to the QRIS line — the order goes back to `menunggu_pembayaran`, and the merchant only cooks after it is paid.

**Customer reliability** (`guyub_customer_reliability`): simple count `selesai` vs `gagal_tidak_diambil` vs `batal setelah diterima`. The rules are explicit and can be explained to the user:
- 2 times `gagal_tidak_diambil` in 30 days → COD disabled **across platforms** for 30 days; the customer is told the reason and can submit an objection to Ops.
- This is a rule-based decision that can be read by humans, **not an opaque score** — a mandatory requirement so that it doesn't become *automated decision-making* which is problematic in the PDP Law and so that merchants can understand it.
- Merchants cannot mark `gagal_tidak_diambil` without the order actually reaching `disiapkan`/`siap` status; Every marking is recorded in an audit (preventing merchants from penalizing customers unilaterally).

### 5h — Static QRIS payments & handling of missing/failed payments

Static QRIS has no callback: the server **never knows** funds have arrived. Only the merchant knows, from their mobile banking / digital wallet notifications. The entire design departs from that fact.

**1. Unique nominal — cheapest reconciliation key.**
The server adds 3 unique digits to the total **(food + shipping, one-time payment — §23.4)**: IDR 45,000 → **IDR 45,317**. The merchant matches his account statement to that number, without any tools. The rules:
- Unique among **active** orders belonging to the same merchant (unique constraint on `(business_id, unique_amount, status_bayar aktif)`), not globally unique.
- The difference belongs to the merchant; displayed honestly to the customer: *"Pay exactly IDR 45,317 — last 3 digits so your payment is easy to check."*
- Valid 15 minutes; After that the nominal value is released and can be used for another order.

**2. Payment status flow.**

| Status | Triggered by | What happened |
|---|---|---|
| `belum_bayar` | Order created | QR + unique nominal + 15 minute countdown displayed |
| `menunggu_verifikasi` | **Customer** presses "I have paid" (can upload proof) | Merchants will receive a notification: *"Check mutation: IDR 45,317 from Mrs. Siti"*. Nothing has been cooked yet. |
| `lunas` | **Merchant** presses "Funds have arrived" | Order continues to `menunggu_konfirmasi` → can be cooked |
| `kadaluarsa` | 15 minutes pass without claim | Order canceled by system. No loss. |
| `gagal` | Merchant rejects claim (no funds available) | Order is on hold, customer is notified, can pay again 1× or escalate Ops |
| `dikembalikan` | The merchant returns the funds (the funds apparently came in after canceling/double paying) | Noted + evidence; transfers are carried out by merchants directly |

**3. Real case handling.**

| Case | Handling |
|---|---|
| Late arrival of funds (interbank) | Claims hold orders in `menunggu_verifikasi` for up to **60 minutes** (not 15) — the countdown stops once the customer claims. Merchants can check again at any time. |
| Customer claims to pay, no funds | Merchant presses "Not logged in" → status `gagal` → **not cooked**. Customers can upload proof → Ops escalation with complete data (time, unique amount, sender's name). |
| The nominal value is not the same (customer made a typo) | Merchant presses "Different nominal" + enter the amount actually entered → less: customer pays the shortfall or order is canceled & funds are returned; more: refunded merchant. Everything is recorded. |
| Pay to QRIS other merchant / Incorrect QR | Out of system coverage — Ops helps connect the two merchants. Recorded as an incident, never bailed out by the platform. |
| Pay double | Detected when a merchant matches a mutation; one noted `dikembalikan`. |
| Merchant forgot to confirm | Merchant App displays card **"Waiting to check: 2 orders"** which cannot be closed + reminder every 10 minutes; Ops sees the *aging* list in the console. |
| Rogue merchant (funds entered, marked failed) | `gagal` ratio per merchant monitored Ops; customer evidence is stored. Manual sanctions, not automatic. |
| Fake transfer proof | **Proof of never changing status.** Only merchant account mutations are decisive (Non-negotiable 13). |

**4. Ascending path (without changing domain).**
The `Payment` module defines one interface `PaymentVerifier`. Phase 1 uses `ManualMerchantVerifier` (above). When a merchant has dynamic QRIS from their provider, or the platform is already incorporated and uses a gateway, simply install `WebhookVerifier` — **`lunas` state moves from the merchant button to the signed webhook**, and the entire state machine above does not change a single line.

### 5i — Product ratings & "most liked"

The goal is **not to judge the shop**, but to answer customer questions: *"What's delicious here?"*. In small, well-known communities, punitive leaderboards will damage social relationships and drive merchants away. Therefore the design elevates what is good and conveys what is lacking in private.

**Valuation form — two choices, not five stars.**
After the `selesai` order, one screen appears (allowed to be skipped):

> **How ​​is the order?**
> Special Fried Rice → 👍 Delicious / 👎 Less
> Sweet Iced Tea → 👍 / 👎
> Reason (optional, choose): *just right portion · still hot · just right spicy · not salty enough · small portion · takes too long*
> Merchant: 👍/👎 · Driver: 👍/👎

The reason: two options raise the fill rate well above 1–5 stars for non-technical users, and are enough to rank in popularity. **No free text comments in MVP** — moderation is expensive, and in small subdistricts open comments more often hurt than help.

**Two signals, two badges:**

| Badges | Calculated from | Why |
|---|---|---|
| **Best Selling** | Amount sold 30 days | The data we already have, is free, and **cannot be faked without spending real money** |
| **Most Liked** | % `suka` of total assessments, **minimum 5 assessments** | Quality of taste, not just volume |
| **New** | < 5 ratings | Protecting new products from one bad review |

Default order on merchant pages: **bestsellers**, with "most liked" as an optional filter. On the customer homepage: section *"Most liked on Base this week"* (aggregate across merchants, only products with ≥ 5 ratings).

**Integrity rules (non-negotiable):**
- Can only assess items from **own orders with status `selesai`**, one assessment per `order_item`, maximum 7 days after completion, can be changed within 24 hours then final.
- Merchant **cannot delete** ratings; he can see the summary and report anything suspicious to Ops.
- **No "worst" rankings** and no rating-based comparisons between merchants in public view. Negative ratings only appear as private summaries for merchants (“3 people said portions were low this week”) — that's what's useful, and that's what's not damaging.
- The public is always **anonymous**. In areas where everyone knows each other, displaying the name of a negative evaluator is socially dangerous.
- Badges **can never be purchased** (see §5j).

**Cheapest**: aggregates (`suka`, `kurang`, `terjual_30h`, `badge`) are calculated by a scheduled job every 15 minutes and written to the public projection `catalog_public_items` — discovery remains a lightweight query that can be cached at the edge, never calculating aggregates at request.

### 5h — Merchant Premium (platform continuity)

Individual platform owners need income that doesn't depend on small upfront commissions. Premium is the answer — **but it has to be sold without destroying the reason people use GUYUB.**

**Package:**

| Package | Price (proposed) | Contents |
|---|---|---|
| **Warung** (free forever) | Rp 0 | Profile, catalog, take orders, basic reports, 1 photo per product |
| **GUYUB'S FRIEND** ​​(premium) | IDR 30,000/month | All below |

Contents of the premium plan — chosen for its **low development costs but clear value to merchants**:

1. **Sponsored slots on homepage** — "Today's Pick" card, maximum 3 slots/day, rotates between premium merchants, **always labeled "Sponsored"**.
2. **Sequence priority** — only as a *tie-break* between merchants that are both open and both in range. Never beat open/close, distance, or stock status.
3. **Scheduled promo banner & strikethrough price**.
4. **5 photos per product** (free: 1).
5. **Deep reports + CSV export** — using existing `Finance`/report modules, almost zero development costs.
6. **Broadcast promo** to customers who **have ordered at that merchant**, maximum 1×/week, via FCM (free for the platform, valuable for the merchant). Merchant **never receives list of numbers** — system sends; Customers can stop subscribing at any time.
7. **2 percentage point lower commission** during subscription (3% when typical rate is 5%) — attractive for high-volume merchants. *Note: it previously said "0% commission"; that was incorrect and corrected in §30.5 — high volume merchants will generate commissions well above IDR 30K/month.*

**One-time add-on** for merchants who don't want to subscribe: **"7-day highlight"** (Rp. 15,000) and **"Weekend boost"** (Rp. 10,000).

**Integrity fence — this is what determines whether a platform lives or dies:**
- Paid slots **always labeled "Sponsored"**, without exception.
- **A maximum of 20% of discovery results** may be sponsored; the rest is purely distance, open/close, and popularity.
- **The “Best Selling” / “Most Liked” / “Verified” badge is not for sale.** Sold once, all signals in the app lose their value — and they cannot be repurchased.
- Merchants who are **closed or out of stock never enter sponsored slots and are never promoted to the top**, even premium (wasting the merchant's money and ruining the customer experience). It still appears at the bottom of the search results with the label “Closed” + next opening hours — see §5k.
- Premium **does not affect** driver matching on service orders.

**Billing (without gateway, individual owner):** subscription billing uses **exactly the same mechanism as §5h** — unique nominal + manual confirmation, only the recipient is a special owner's commission account and the confirmer is Ops, not the merchant. No new code needs to be written for the money flow.

**Feature rights (entitlement) are always checked on the server.** The client only hides the button; What determines whether a merchant can appear in sponsored slots or send broadcasts is `PlanService` on the server, based on active subscription status.

**Proof of value for merchants** (requirements for them to renew): simple daily stats — *"Your ad was seen by 340 people, clicked by 28, so 6 orders."* Stored as a daily aggregate, not a per-impression log (cheap).

**Sustainability calculation** (why the IDR 30,000 figure makes sense):


| | Pessimist | Realistic |
|---|---|---|
| Active merchants | 40 | 40 |
| Premium (25% / 40%) | 10 | 16 |
| Subscription revenue | IDR 300,000 | IDR 480,000 |
| Add-ons & highlight | IDR 50,000 | IDR 150,000 |
| Commission (non-premium) | IDR 200,000 | IDR 600,000 |
| **Total** | **Rp 550,000** | **Rp 1,230,000** |
| T0 infra costs | IDR 300–500 thousand | IDR 300–500 thousand |

The honest conclusion: **premium covers infra costs, not paying the owner.** Meaningful income only comes from commissions when volume increases. Premium should therefore not be built as a full system from the start — see timing notes in §12.

### 5k — Operating hours & last order limit

There are two problems that are solved, and the second is more often forgotten: (a) the order comes in when the shop is closing, and (b) the order comes in **five minutes before closing** — the merchant has cleaned up the kitchen, but has to turn on the stove again. Both end up the same: the merchant is disappointed or the customer is disappointed.

**Schedule model.**

| Layer | Contents | Win over |
|---|---|---|
| **Weekly schedule** | Per day (Monday–Sunday), there may be **several sessions** in a day — for example 06.00–10.00 then 16.00–21.00 | basic |
| **Special dates** | Holidays (Eid, celebrations) or different times on certain dates | weekly schedule |
| **Temporarily closed** | One tap switch in Merchant app, **required to select duration**: 30 minutes / 1 hour / 2 hours / until tomorrow | everything |
| **Auto close** | The system closes merchants who miss **3 consecutive orders in 30 minutes** | schedule, until the merchant opens it again |

Several sessions a day are not a luxury feature — rice stalls closing at midday then opening again in the afternoon is the normal pattern in Pangkalan and Tegalwaru. A one-open-one-close schedule will force merchants to use “temporary closes” every day and eventually forget to open them.

**Last message deadline (before closing).**

```
batas_pesan_terakhir = jam_tutup − waktu_siap
```

`waktu_siap` is set by merchant (default **30 minutes**, per merchant, not per product in MVP). The stall closes at 21.00 with a ready time of 20 minutes → last order received at 20.40. After that the merchant remains in "open" status for people who are waiting for their orders, but **not accepting new orders**.

For delivery orders, this is enough: what is protected is the merchant's kitchen, not the driver's home time — the driver has his own online status.

**What customers see** (clear labels, no jargon):

| Condition | Display | Order button |
|---|---|---|
| Open, > 60 minutes before the deadline | "Open" | active |
| Open, < 60 minutes before deadline | **"Closing in 40 minutes — book now"** | active |
| Past the limit, not before closing time | "Stop accepting orders · Reopen tomorrow 06.00" | dead |
| Closed (schedule/holiday/temporary) | "Closed · Reopen Monday 06.00" | off, there is **"Remind me when I open"** |

Closed merchants **still appear** in searches (at the bottom, labeled "Closed") — customers need to know which stalls are available and when they're open. What not to: Closed merchants appear on the homepage, in sponsored slots, or at the top (§5h).

**Authority is on the server, and is double checked.**
1. Status is calculated from **server time** (`Asia/Jakarta`), never from the clock on the phone and never from flags sent by the client.
2. **Revalidated at checkout.** Customers can open the screen at 20.35 and press Pay at 20.45; the server refuses with a `422` + Indonesian message stating the next opening time, and the basket is **not deleted** (saved for tomorrow).

**Special cases:**
- **Scheduled orders** (if later activated): validated against operational hours **at scheduled time**, not order time.
- **Tourist tickets**: destinations have their own operating hours for exchange at the gate, but it is still possible to purchase tickets for future dates at any time — the quota per date (§5c) is the limit, not the time.
- **Out of stock items**: marked by merchant per product, automatically available again at the next open session (unless permanently disabled). Out-of-stock products cannot be ordered even though the merchant is open.
- **Ojek/service**: not tied to merchant hours — depends on driver's online status.
- **Merchant forgot to open**: temporarily closed **always has an expiration time** (that's why a mandatory duration is selected); auto-close sends a reminder every morning at its scheduled opening time until the merchant responds. Stalls who forget to turn on their status are silently losing revenue — and the reason merchants blame the app.

**Cheapest**: the schedule is copied to the public projection, so open/close status is calculated when serializing the response (time comparison in memory, no additional queries), with a **60 second** edge cache. A maximum of one minute of inaccuracy is harmless because the checkout revalidates.

### 5l — Time estimation & countdown

Reference: GoFood, Fore, Kopi Kenangan. What makes the pattern work is not the numbers, but **the customer never looks at the screen without knowing how long to wait**.

**Who determines the estimate.** In the initial phase, **merchant** — not the system. When pressing Accept, the merchant selects from the large buttons: **10 · 15 · 20 · 30 · 45 minutes** (default suggested from `prep_minutes` + number of running queues). The guess of the person standing in front of the stove is much more accurate than the guess of a system that has no data, and this makes the merchant feel in control.

**The formula:**

```
siap        = waktu_diterima + estimasi_merchant
sampai      = siap + waktu_antar(zona_merchant → zona_tujuan)   # dari matriks zona, §6.7
```

Delivery times are taken from the zone matrix already used for fares — one additional column, without a paid routing engine.

**Before ordering: range. Once received: countdown.**

| Stage | The displayed | Why |
|---|---|---|
| Selecting a merchant | "±20–30 minutes" | Big promises are better than precise promises that miss the mark |
| Waiting for confirmation | "Wait for the stall to answer, usually under 5 minutes" | Waiting without information feels twice as long |
| Under preparation | **"It's getting ready — about 4 more minutes"** (going back every minute) | This is the requested GoFood/Fore pattern |
| Ready to take | "Orders ready! Waiting for you at Warung Bu Siti" | — |
| Delivered | "It's on its way! Approximately until 19.25" | For travel, **arrival clock** is more useful than countdown |

**What the server sends is `promised_ready_at` (timestamp), not "minutes remaining".** The client counts down itself locally. Two positive consequences: the countdown continues without the network, and does not trigger additional polling for a second (§7.4).

**If you miss — and you definitely miss sometimes.** The countdown **shouldn't** change to a minus number or "5 minutes late"; it makes customers angry at merchants for normal things in the shop. When the time passes, the display changes to a calm sentence: *"Just a little longer, your order is being sorted out."*

Merchants can press **"+5 minutes"**, a maximum of **2 times per order** (recorded). Customers are informed in pleasant language, and after the second renewal **customers can cancel for free** — that's a fair limit: merchants have room to delay, customers are not held hostage.

**Learn without ML.** Save `estimasi` vs `aktual` per merchant. After 20 orders, the Merchant app suggests: *"It usually takes you 22 minutes, not 15. Would you like me to change the ready time setting?"* Simple aggregate, increased accuracy, zero cost.

**Exception**: scheduled orders (when later enabled) display **schedule**, not countdown. Tour tickets do not have an ETA.

### 5m — Message from merchant (acknowledgment)

The cheapest and most human touch: a short message from the stall owner himself, appearing on the "Order completed" screen and in his notifications.

**Two message types** (both merchants can change, both have ready-to-use templates so merchants don't face empty boxes):

| Type | Appears when | Built-in example |
|---|---|---|
| Welcome message | Merchant accepts order | *"Ready, we'll make it straight away!"* |
| Thank you message | Order completed | *"Thank you {name}, waiting for your next order!"* |

Only one variable is supported: `{nama}` (customer first name). More than that, it confuses merchants and invites misuse.

**Content rules — this is also a security control (finding #24):**
- **Plain text only**, maximum 120 characters. No HTML, no markdown, escaped on display.
- **Links are blocked**, as are long strings of numbers (account/cellphone numbers). The reason is straightforward: *"just transfer to this account so it's cheap"* is the most classic scam, and the free text box to the customer is the door.
- Reviewed Ops when they were first saved and each time they were changed (small volume, so manual review is still cheap). Violated → message revoked, merchant notified.
- Every change is recorded by audit.

**Premium section (§5h):** free merchants have **1 thank you message**; Premium merchants have **3 rotating messages** + one special message for customers who have ordered ≥ 5 times (*"Wow, this is a subscription. Thank you!"*). Added value that feels personal, development costs are almost zero.

---

## 6 — System Architecture

### 6.1 Overall shape

```
  Customer app ┐
  Merchant app ┼─ HTTPS ─→ Cloudflare (CDN, cache, WAF, rate limit)
  Driver app   ┘                     │
  Konsol Ops (Nuxt) ─────────────────┘
                                     ↓
                          berdikari-api (Laravel, modular monolith)
                          IAM · Core · Catalog · Inventory · Sales · Finance
                          + Merchant · Marketplace · Ordering · Delivery · Ticketing · Payment
                                     │
              ┌──────────────┬───────┴────────┬─────────────────┐
         PostgreSQL       Redis            Object storage      FCM
      (data transaksional) (cache, antrian,  (foto, R2/MinIO)  (push)
                            lokasi driver live)
```

**Decision: stick to a modular monolith, not microservices.** Reason: we already have IAM, tenancy, auditing, and notifications running; breaking up services means paying for networking, deployment, and data consistency for volumes that don't yet exist. Separation sutures are prepared (§7.5) so that later extraction is cheap — `docs/13-microservice-migration.md` remains in effect.

### 6.2 New module in `berdikari-api/Modules/`

| Module | Domains | Phase |
|---|---|---|
| `Merchant` | Public merchant profile, opening hours, service areas, verification, tariff zones | 1 |
| `Marketplace` | Search & discovery, public catalog projection, basket, curated places (villages/hamlets/landmarks) | 1 |
| `Ordering` | Cross-vertical orders, status machines, cancellations, ratings, complaints | 1 |
| `Delivery` | Driver, availability, dispatch, assignment, live location, proof of completion (OTP/photo) | 1 |
| `Ticketing` | Destinations, quota per date, issuance of signed QR tickets, exchange | 2 |
| `Payment` | Payment status, unique amount, `PaymentVerifier` (merchant manual → webhook gateway), COD policy & customer reliability, commission & billing | **1** (manual verification) → 3 (gateway) |

**Product & Premium ratings do not add new modules** (intentionally): ratings, popularity aggregates, sponsored slots, and discovery order are `Marketplace`'s business; packages, feature rights (`PlanService`), and subscription billing are the business of `Payment` — whose money flow is already in §5h. `Billing` can be extracted later when the package becomes complicated, not now.

**Reused without changes**: `IAM` (auth, RBAC, token), `Core` (tenancy `Tenantable`, notifications, `AuditLogger`), `Catalog` (product & category per merchant), `Inventory` (optional stock for culinary merchants), `Finance` (recording of commissions, subscriptions & merchant income), `Sales` (POS merchant — not used by GUYUB, but available for merchants who have upgraded).

Fixed DNA module boundary rules: **no direct cross-module queries**; synchronous via Service Contract, asynchronous via Event.

### 6.3 Public projection (the most important architectural decision)

Marketplace is intentional **cross-tenant reading** — a first for this system. This **should not** be done by loosening `Tenantable`.

Instead, each merchant publishes **public projections**: tables `merchant_public_profiles` and `catalog_public_items` containing **only publicly visible columns**, repopulated by events (`ProductUpdated`, `MerchantOpened`, …). The public endpoint only touches this projection table — never the tenant table.

Three benefits at once: (a) cross-tenant leaks become structurally impossible, rather than dependent on query discipline; (b) responses can be cached in Cloudflare (cheap); (c) new columns in the tenant table never leak silently.

This projection also holds **popularity aggregates** (`suka`, `kurang`, `terjual_30h`, `badge`), **package markers** (`is_sponsored`, `plan`), and **operational schedules** (§5k) — aggregates calculated by scheduled jobs, open/closed states calculated upon serialization of existing schedules in the projection. So a discovery that has been sorted and already contains badges is still a lightweight query that can be cached.

### 6.4 Order access — "three lenses"

One order line is viewed by three parties with different rules; This is enforced in policy, not in the controller:

| Lenses | Scope | Visible fields |
|---|---|---|
| Merchants | `business_id` = active tenant (`Tenantable`) | Items, notes, customer's first name, cellphone number **only when active status** |
| Customers | `customer_id` = authenticated user | All fields belong to him, name & driver number only when active status |
| Drivers | `assigned_driver_id` = authenticated user **and** status ∈ {assigned…delivered} | Customer address & cellphone number only during active assignment; disappears after completion |

### 6.5 Mobile application structure

One Flutter monorepo repo (`guyub-mobile/`, git itself, like `berdikari-mobile`) with **melos**:

```text
guyub-mobile/
├── apps/
│   ├── guyub_customer/      # com.guyub.customer
│   ├── guyub_merchant/      # com.guyub.merchant
│   └── guyub_driver/        # com.guyub.driver
└── packages/
    ├── guyub_core/          # ApiClient, models (freezed), repositories, auth, l10n
    └── guyub_ui/            # design tokens + widget bersama (AppButton 44px, KpiCard, …)
```

Stack follows `docs/16-mobile-implementation-plan.md` (Flutter stable, MVVM + `provider`, `go_router`, `http` + one `ApiClient`, `freezed`/`json_serializable`, `flutter_secure_storage`, `intl` id_ID). **Monorepo reason**: three apps share ±60% of the code (auth, order model, themes, components) — three repos means three times the maintenance and CI costs.

Notes per application:
- **Merchant**: Android foreground service + high priority FCM + repeating sound alarm for new orders. This is a mandatory feature, not a complement — unheard orders = lost orders.
- **Driver**: foreground service when online; location sent **only when there is an active order**, batch every 15 seconds (see §7.4 & §11).
- **Customer**: lightest; map only on tracking screen.

### 6.6 Console Ops

Add pages in existing `berdikari-web` (Nuxt, Cloudflare Pages) under `/guyub/*` with a new Pinia store — **not** a new web app. Follows the applicable page/store/`nav.ts` pattern (DNA §9f). Additional costs: zero.

### 6.7 Maps & addresses

- **No Google Maps** (per-request and per-load costs rise quickly). Use **MapLibre GL** + OSM tiles (Protomaps/self-host) for tracking screens only.
- Address not typed: **list of curated places** (village → hamlet → benchmark) filled in by Ops. For 2 subdistricts, it is realistic (hundreds of points), much more accurate than geocoding, and free.
- Rates from **zone matrix** (origin-zone × destination-zone), not GPS calculations — cannot be manipulated, no paid routing engine required.

---

##7 — Cheap, Scalable, HA

These three demands are mutually exclusive. Principles: **cheap now, scale path already mapped out, and HA only in layers that really hurt to die.**

### 7.1 Honest definition of HA for this context

HA here is **not** multi-region active-active. HA here means: there is not a single component whose death means "manual rebuild and data lost".

| Size | Target pilots | Growth targets |
|---|---|---|
| SLO availability | 99.0% during service hours (06.00–22.00 WIB) | 99.9% |
| RPO (maximum data loss) | ≤ 5 minutes (WAL/PITR) | ≤ 1 minute |
| RTO (recovery time) | ≤ 60 minutes | ≤ 15 minutes |
| API p95 Latency | < 400 ms | < 300 ms |

This is maintained by four things, not by expensive machines: **infra as code**, **monthly backup + restore practice**, **stateless app (can be thrown away & rebuilt)**, and **graceful degradation in the client**.

### 7.2 Infrastructure stage

| Stage | Volumes | Shape | Estimated cost/month |
|---|---|---|---|
| **T0 — Pilot** (months 1–6) | < 300 orders/day | 1 VPS (2 vCPU / 4 GB) running app + worker + Redis, free/cheap Postgres managed tier with PITR, free Cloudflare up front, R2 object storage, FCM | **Rp 300–500 thousand** |
| **T1 — Growing** | 300–3,000 orders/day | 2 stateless app instances behind a load balancer, separate workers, **paid Postgres managed with auto standby**, Redis managed, daily backups + PITR | IDR 1.5–3 million |
| **T2 — Scale** | > 3,000 orders/day | Autoscale app, read replica for reporting/discovery, `Delivery` extraction/tracking as a self-service, public projection cache at the edge | IDR 4–8 million |

Figures are rough estimates and must be verified when provisioning; What is binding is **limit IDR 500 thousand/month in T0** (Non-negotiable 11).

**Raising triggers (not guessing):** app CPU > 60% for 15 minutes in peak hours, p95 API > 400 ms for 3 days, or DB connection > 70% pool. Moving up a stage is a data decision, not a feeling decision.

### 7.3 HA per component

| Components | Fail mode | T0 Mitigation (cheap) | T1+ Mitigation |
|---|---|---|---|
| App (PHP) | Dead instance | Stateless + auto restart + healthcheck; deploy = image versioned, rollback = previous tag | 2+ instances behind LB, rolling deploy |
| PostgreSQL | Node down / data corrupted | **Managed** with PITR ≤ 5 minutes + daily dump to R2 + **monthly restore workout** | Automatic standby (failover managed) |
| Redis | Dead | Considered **may be lost**: cache, queue, live location. The queue falls to a DB table if Redis does not exist; live location lost → fallback client to poll status | Redis managed with persistence |
| Object storage | Dead | Photos are evidence, not the critical path; upload failed → queue in client | R2 has been replicated |
| FCM | Late/dead | Merchant & Driver application still **light poll every 20 seconds when there is an active order**; push is acceleration, not the only path | idem |
| Cloudflare | Dead | The origin endpoint can still be accessed directly (backup DNS) | idem |
| Tourist gateway (phase 2) | Signal off | **Offline QR verification** with digital signature; synchronous following | idem |
| **Owner credentials (individuals)** | HP lost, account locked, owner absent | Password manager + **printed 2FA backup code & stored offline**, second break-glass account in hosting/DNS/Play Console, IaC in git, written recovery runbook | Add one trusted person with limited access (billing + DNS) |
| Payment verification (manual) | Merchants do not check mutations | "Waiting to check" card that can't be closed + 10 minute reminder + *aging* list in Ops Console; orders are not cooked as long as they are not paid in full → delays never turn into losses | Replace `ManualMerchantVerifier` with gateway webhook (§5h) |

The principle that makes this all work: **clients should never assume the server is live**. Merchant stores active orders locally; the driver stores details of orders in progress; customer sees last status + "not connected" sign.

### 7.4 Cost controllers (where money actually leaks)

| Leaking | Control |
|---|---|
| Continuous polling | Polling **only** when there is an active order, adaptive interval 5 s (on delivery) → 20 s (waiting) → off (no order). The rest is FCM. |
| Driver location | Send only when the order is active, batch every 15 seconds. Save it in **Redis with a TTL of 2 hours**, not in Postgres. What is persisted is only the route summary after the order is completed. |
| Image | Resize + compress WebP **on HP** before uploading (max 1024 px, ≤ 80 KB), serve via Cloudflare cache. |
| Map | MapLibre + OSM, on-screen tracking only, no paid geocoding. |
| Discovery/catalog | Public projection + 60 second edge cache — the majority of read traffic never hits the app. |
| Notifications | FCM (free). OTP via WhatsApp Business API by default; **SMS gateway is an automatic fallback only** (§36.6) when the number can't be reached on WhatsApp. OTP only when registering & PIN recovery (see §9), not every login. |
| Logs & monitoring | Log files with rotation + free Sentry tier + free uptime monitor. No paid SIEM/APM in T0. |

### 7.5 Scalability path (prepared seams)

1. **Read ≠ write**: discovery/catalog using public projection → move to read replica or cache edge without changing domain code.
2. **Dispatch in queue**: all dispatches run as jobs; increase throughput = add workers.
3. **`Delivery` is the first extraction candidate** (tracking = busiest write traffic, most isolated domain). Because access is via Service Contract + Event, extraction does not touch other modules.
4. **Per-merchant lock, not global**: ticket & stock quota reductions using row locks per merchant/date — no system-wide locks.
5. **`order_type` one table** with partial indexes per active state; active orders table remains small, old orders are partitioned per month when > 1 million rows.

---

##8 — Data Model (compact)

New table (final name determined during migration; all merchant owned tables use `business_id` + `Tenantable`):

| Table | Contents | Notes |
|---|---|---|
| `guyub_merchants` | `businesses` extension: type (culinary/service/tourism), verification status, service zone, `prep_minutes`, `manual_status`, `manual_status_until`, `auto_closed_at` | 1:1 with tenants |
| `guyub_merchant_hours` | Weekly schedule: `day_of_week`, `open_time`, `close_time`, session order | **Multiple lines per day** (morning & afternoon sessions) |
| `guyub_merchant_closures` | Special holiday or time date/range + reason + type (`libur`/`sementara`/`otomatis`) | Win over weekly schedule |
| `merchant_public_profiles` | Merchant public projections | Public columns only; filled with events |
| `catalog_public_items` | Public projection of products | idem |
| `guyub_places` | List of curated places (village/hamlet/landmark, lat/lng, zone), **`kelas_medan`** (flat/uphill/difficult) | Filled in Ops after field check (§35.5) |
| `guyub_zones`, `guyub_fare_matrix` | Zone + inter-zone rate + estimated delivery minutes; parameters `harga_bensin`, `konsumsi_km_per_liter`, `perawatan_per_km`, `upah_waktu_per_jam` | Rates are **derived** from parameters (§35.3), not manually typed; mandatory within the authorized range for passenger orders (§22.4) |
| `guyub_customers` | Customer profile (1:1 `users`), name, verified cellphone | Minimum PII |
| `guyub_orders` | Vertical cross order: `order_type`, status, `business_id`, `customer_id`, `assigned_driver_id`, total server-side, `idempotency_key`, **`promised_ready_at`, `promised_delivery_at`, `ready_at_actual`, `eta_extend_count`**, **`fulfillment_mode`, `delivery_fee`, `delivery_fee_recipient`, `courier_payout`, `courier_paid_at`, `subsidy_amount`** , **`ref`** (transaction number, §32.1), **`queue_no`** (daily queue number per merchant, §32.2) | ULID as primary key. Index: (business_id, status), (customer_id, created_at); unique `idempotency_key`, unique (`order_type`, date, `ref`), unique (`business_id`, date, `queue_no`). `courier_paid_at` empty = `ongkir_tertunda` (§23.4) |
| `guyub_courier_settlements` | Weekly recap per stall: delayed postage, subsidy reimbursement, commission | The value is small but must be recorded — source of trust for drivers |
| `guyub_shopping_orders` | Buy: shopping list (text), estimate, receipt value, photo of receipt, entrust service | Connect to `guyub_orders` (`order_type = titip_beli`) |
| `guyub_driver_limits` | Bailout ceiling per driver + history of changes | Raised Ops manual, not automatic (§24.3) |
| `guyub_merchant_messages` | Merchant welcome & thank you messages: text, type, active, moderation status | Plain text ≤ 120 characters; free 1, premium 3 + order subscription (§5m) |
| `guyub_merchant_eta_stats` | Aggregate estimated vs actual per merchant | Basic advice "usually you need 22 minutes" (§5l) |
| `guyub_order_items` | Item + price **snapshot** when ordering | Prices do not change if the menu is changed |
| `guyub_order_events` | State transition history (append-only) | Source for complaints & audits |
| `guyub_drivers` | Driver profile, verification status, `can_carry_passenger`, online status, **`owner_business_id` nullable** | `null` = platform driver; filled = **merchant's courier** (§23.5) |
| `guyub_driver_vehicles` | Vehicle: plate, STNK photo, owner's name & cellphone, validity period, `is_borrowed`, owner's permission | **Max 2 active per driver**; loan motorbike accepted (§22.10) |
| `guyub_trips` | Driver journey: `driver_id`, status, created, completed. `guyub_orders.trip_id` can be empty | **Seam batching** (§33.3): v1 always 1 order per trip; Phase 3 adds a second row |
| `guyub_dispatch_offers` | Offer to driver + result (accept/reject/timeout) | For audit & dispatch metrics |
| `guyub_destinations`, `ticket_inventories`, `guyub_tickets` | Destinations, quota per date, tickets + exchange status | Quota: row key per (destination, date) |
| `guyub_payments` | Method, `status_bayar`, `unique_amount`, claim time & verification time, verifier actor, gateway reference (advanced phase) | Unique: `(business_id, unique_amount)` for active payments. Never save card data |
| `guyub_payment_claims` | Claim "I have paid" + proof (optional) + result (accepted/rejected) + reason | Append-only; dispute material |
| `guyub_merchant_cod_settings` | `cod_policy`, COD nominal limit per merchant | Tenant owned |
| `guyub_trusted_customers` | List of trusted customers **per merchant** (manual or automatic ≥ 2 successful orders) | Unique `(business_id, customer_id)`; not transmitted between merchants |
| `guyub_customer_reliability` | Count of `selesai`, `gagal_tidak_diambil`, `batal_setelah_diterima`, + `cod_blocked_until` | Explicit rules, not opaque scores (§5g) |
| `guyub_commissions` | Commission per order + weekly billing status | Calculated server |
| `guyub_ratings` | Merchant & driver ratings (👍/👎 + preset reasons) | One per order per party |
| `guyub_item_reviews` | Ratings per product: `order_item_id`, `product_id`, `business_id`, `customer_id`, `sentiment`, `reasons[]`, `editable_until` | **Unique `order_item_id`** — one assessment per item per order; only from orders `selesai` |
| `guyub_product_stats` | Aggregate per product: `likes`, `dislikes`, `sold_30d`, `badge`, `recomputed_at` | Filled with jobs every 15 minutes → copied to `catalog_public_items` |
| `guyub_subscriptions` | `business_id`, plan, status, period, price | One active subscription per merchant |
| `guyub_subscription_invoices` | Monthly billing + `unique_amount` + pay status | **Reusing the §5h mechanism**; verified Ops, not a merchant |
| `guyub_ad_slots` | Sponsored slots: type, date, `business_id`, highlighted product, status | Daily quotas are enforced here |
| `guyub_ad_daily_stats` | Daily aggregate views / clicks / orders per slot | Aggregate, not log per impression (cheap) |

**Not a table**: live driver location (Redis, TTL), cart (client + revalidation at checkout).

---

##9 — Security & Architecture (mandatory gate)

### Threat models

- **Assets** — money (order value, shipping, commission), ticket stock & quota, identity & PII (cellphone number, delivery point, driver location), authority (merchant/driver/ops role).
- **Actors** — unauthenticated public (discovery page), customers, **fake/fictitious customers**, drivers, merchant staff, **rogue merchants**, other merchant owners (neighboring tenants), Ops, former drivers/employees whose tokens are still alive, **platform owner (individual, sole holder of all credentials)**.
- **Entry point** — public endpoint discovery, customer/driver auth, order creation & transition, **payment claim & merchant confirmation**, proof upload, location delivery, ticket exchange, gateway webhook (advance phase).
- **Blast radius** — app compromise = all merchant tenants in 2 sub-districts + customer PII. Compromise of one driver account = only order data that he serves (limited by lens §6.4). **Compromise/loss of owner account = entire platform** (see finding #16).

### Architectural finds

| # | Severity | Boundary/Invariant | Findings | Exploitation | Control |
|---|---|---|---|---|---|
| 1 | High | B2/Inv. 1 | Marketplace needs cross-tenant reading — first time in this system | Merchant/customer calls endpoint discovery and pulls other internal tenant columns (COGS, stock, employee data) | **Public projection** (§6.3): public endpoint only touches `*_public_*`, fields are explicitly whitelisted in Resources, `Tenantable` is never relaxed |
| 2 | High | Inv. 2 | Clients can send prices, postage, motorbike taxi rates and commissions | Customer changes `total` on cellphone and pays IDR 1,000 for order IDR 100,000 | Client sends **intent only** (product id, qty, origin/destination id); all server calculated values ​​from `guyub_fare_matrix` + catalog prices; price snapshotted to `order_items` |
| 3 | High | Inv. 4 | Orders/payments/ticket exchanges on bad networks will definitely be retried | Double tap on bad signal → two orders, two bills, ticket quota cut twice | `Idempotency-Key` is mandatory on all POST mutations + unique constraints in the DB; state transitions are only valid from a specific origin state (idempotent by nature) |
| 4 | High | B1/Inv. 3 | State transitions can be called wrong actors | Drivers mark “done” without dropping off; customer marks order "received" to force merchant | Server-side state machine with matrix (origin state × actor) + policy per lens (§6.4); Completion requires **4 digit OTP from customer** or photo |
| 5 | High | Inv. 8 / PDP | Mobile number & point between customers exposed to driver | The driver collects the woman's number; former driver saves history | Number & address only appears **during active assignment**, disappears after completion; audit logged access; driver token revoked in inactive state |
| 6 | High | B1 | Mobile number based login is prone to enumeration & OTP waste | Bots send thousands of OTP requests (cost + distracted users) | Rate limit per number **and** per device **and** per IP; OTP only when registering/changing device/resetting PIN; daily login using 6 digit PIN + device token |
| 7 | High | B7/Inv. 5 | Money & quota change without a trace | The dispute "I have paid / the ticket has been used" cannot be resolved | `guyub_order_events` append-only + `AuditLogger` for cancellation, refund, commission change, merchant/driver verification, ticket exchange |
| 8 | Medium | B4 | Unlimited endpoint discovery | One request pulled the entire catalog of 2 subdistricts; cheap scraping | Mandatory pagination (max 50), mandatory radius, edge cache, anonymous rate limit |
| 9 | Medium | B3 | Proof of completion in the form of photos = uploaded from the public | Upload malicious file / path constructed from user file name | Presigned upload, server generated object name (UUID), type & size validated, served via CDN, never under `public/` |
| 10 | Medium | Inv. 6 | The temptation to create a second auth for the customer (cellphone number) | Two auth paths = two places authorization bug | Stay one: `users` + Sanctum + spatie. Customer = user without `business_id`, `guyub.customer.*` abilities token only |
| 11 | Medium | B1 | Merchant/driver cheating against the platform | The merchant orders himself to increase the rating; driver accepts then cancels repeatedly | Abuse metrics in Ops Console (abort rate, orders of the same number), not automatic controls in MVP |
| 12 | High | B1/Inv. 2 | Static QRIS has no callback — status `lunas` cannot be verified by server | Customer presses "paid" + uploads fake screenshot; food is cooked, money is never there | `status_bayar` **only** changes by merchant (own account mutation) or signed webhook; customer claims are separate append-only records; **unique nominal** makes mutation matching deterministic (§5h) |
| 13 | High | B7 | COD from unknown persons transfers the entire risk to the merchant | Fictitious order → merchant cooks → no one takes → full loss, and merchant stops using GUYUB | Payment gateway before merchants are notified; `cod_policy` default `pelanggan_dipercaya`; nominal limit COD; customer card + "Call first"/"Ask to pay first" button; fetch limit + `gagal_tidak_diambil` (§5g) |
| 14 | High | Inv. 4 | Unique amounts may conflict between active orders | Two orders of IDR 45,317 at the same merchant → one payment acknowledged twice | Unique constraint `(business_id, unique_amount)` for active payments + TTL 15 minutes + allocation in transactions |
| 15 | Medium | Inv. 8 / PDP | Marking `gagal_tidak_diambil` and blocking COD is a judgment on people | Merchants punish customers unilaterally; customer blocked without knowing why | Valid only from status `disiapkan`/`siap`, recorded audit; explicit & readable blocking rules for customers; objection path to Ops; **numbers are as they are, not blurry scores** |
| 16 | High | Availability / custody | Individual owner = sole holder of all credentials (hosting, DNS, DB, Play Console, account) | Phone lost / account locked / owner sick → no one can recover; the platform is permanently down even though the data is intact | All credentials in password manager + **2FA backup code printed & stored offline**; second *break-glass* account on hosting/DNS/Play Console; infra as code in git; written recovery runbook; backup DB to storage that can be accessed by trusted people |
| 17 | Medium | B7 | The owner's personal account receives a commission | Mutation of commissions mixed with order payments → looks like holding user funds (tax & regulatory risks) | One **commission only** account, never listed as payment destination for orders; QRIS orders always belong to the merchant |
| 18 | High | Inv. 2 / integrity | Product ratings can be manipulated | Merchants order their own products repeatedly in pursuit of the “Most Liked” badge; competitors topple neighboring stalls | Only from `order_item` belonging to `selesai` orders, **unique per item**, maximum 7 days; "Best Selling" uses paid transactions that cannot be faked for free; orders with merchant-related numbers/accounts are excluded; anomalies (jumps in scoring of one number) appear in the Ops Console |
| 19 | High | B1 / PDP | Broadcast premium promos touching customer data | Merchant requests export of customer number "for promotion"; customers are flooded with messages | **Merchant never received the number** — the system sent; only to customers who have ordered at that merchant; maximum 1×/week; one tap opt-out; every broadcast is recorded audit |
| 20 | Medium | B1/Inv. 3 | Premium feature rights are checked in the client | Merchant changes application/request to appear in sponsored slots without subscription | `PlanService` on the server as the sole determinant; daily slot quota enforced in DB; the client just hides the | button
| 21 | Medium | Product trust | Discovery can turn into a billboard | All top slots are sold → customers stop trusting the order → entire platform loses its use | Mandatory "Sponsored" label, maximum quota of 20% of results, popularity badge **not for sale**, closed merchants never enter slot/top sequence (§5m, §5k) |
| 22 | High | B1/Inv. 3 | Open/close status & last message limit can be determined by the client | The customer changes the clock on the cellphone or uses the old screen, then sends the order at 23.00; the merchant wakes up, or the food is cooked after closing time | Calculated **server** from `Asia/Jakarta`; **revalidated at checkout** (`422` + next opening time, cart not deleted); client open/close flags are always ignored (§5k) |
| 23 | Medium | B4 | Edge cache can display "Open" even though it is already closed | Customer places order then gets rejected at the end — bad experience, not money lost | TTL cache 60 seconds + revalidation at checkout; countdown labels ("Closing in 40 minutes") reduce surprises |
| 24 | High | B1 / fraud | The merchant's free message appears on the customer's screen | *"Just transfer to this account so it's cheap"* — transactions are withdrawn from the platform, or phishing links are sent to customers who trust the shop | Plain text ≤ 120 characters, escaped, **links & long strings of numbers blocked**, reviewed Ops on save/change, changes logged audit, violation → revoked (§5m) |
| 25 | Medium | B7 | Merchant extends estimate indefinitely | Customer waited an hour while constantly being given "+5 minutes" and couldn't get out | Maximum **2× extension**, recorded; after that customers can cancel for free; `promised_ready_at` is always server calculated (§5l) |
| 26 | High | Inv. 8 / PDP | Google indexed public stall pages forever | The shop owner's home address & cellphone number are permanently displayed in search results, beyond his control | Only public fields that **merchant approves during registration**; cell phone number does not appear by default; `noindex` on unverified pages; revocation requests handled Ops (§20.3) |
| 27 | Medium | B4 / PDP | Backup contains all platform PII | Backup copy in private storage leaked → data leak is bigger than hacking production | Dump is **encrypted**, key is kept separate from backup, second copy is treated as strictly as production, retention is limited (§19.2) |
| 28 | High | B2/Inv. 1 | The merchant's courier uses the same Driver application | Warung A's courier sees (or takes) Warung B's order — cross-tenant leakage through the newly opened door | Fourth lens (§23.5): `business_id` = his stall **and** `assigned_driver_id` = himself **and** the assignment is still active; merchant couriers never enter the platform dispatch pool; tested as a mandatory rejection path |
| 29 | Medium | Inv. 2 | Merchant shipping costs are regulated by the merchant | The merchant sends the shipping amount from the client, or changes it after the order is made | Merchant sets **rules**; server that calculates and locks the amount when the order is created (§23.2) |
| 30 | Medium | B7 | Postage changes hands outside the system (stall → driver, cash) | Stall withholds driver's fees; or the driver claims he hasn't been paid even though he has | **Two-sided confirmation** (driver presses "Delivery received"), `courier_paid_at` recorded, difference entered `ongkir_tertunda` + weekly recap + Ops list; orders **never blocked** due to this matter (§23.4) |
| 31 | High | B7 / abuse | Tip to buy: driver pays his own money | Customer orders shopping for IDR 200 thousand then disappears; driver loses one day's capital | Default ceiling IDR 50 thousand (increased by manual Ops, max IDR 200 thousand), **one active entrusted order** per driver, only for customers with a good track record (§5g), estimates above the ceiling are rejected before being offered, drivers are free to refuse (§24.3) |
| 32 | Medium | Brands / consumers | Buy tip displays non-partnered stores | People's shop menus & prices are used to attract traffic; The price we display is wrong and customers are angry at shops who don't know their name is used | **name as place** only, no logos/menus/prices/affiliate claims; customers write their own orders; name withdrawn if shop objects (§24.1) |
| 33 | Medium | B1 / abuse | Instant messages can be used to disturb | The driver/customer presses the prompt message repeatedly as a nuisance | Max 10 messages per party per order, only while order is active, closes 1 hour after completion; **no free text** so there is no surface of deception (§29.2) |
| 34 | Medium | Inv. 8 / PDP | Cell phone numbers can still be collected even though they only appear when active | The driver records the number from his own cellphone call log and uses it later | Exposure is not permanent + access is recorded audit + real sanctions; numbers are not displayed as text that can be copied. **Recognized as partial mitigation, not prevention** (§29.3) |
| 35 | High | B1/Inv. 2 | Variants, options and additions are sent by the client as id | Customer sends `addon_id` belonging to another shop's product which costs Rp. 0 (or the cheapest variant of a different product) → pays far below the actual price | The server verifies each `variant_id`/`option_id`/`addon_id` **belongs to that product** before calculating; price & name snapshotted to `order_items`; the client never sent the amount (§34.5) |
| 36 | High | B4/Inv. 7 | Hash PIN 6 digits without **pepper** | Database leaked → entire 10⁶ room hacked in a matter of hours, all accounts exposed at once | **Argon2id + pepper** (key on the server side, not in the database) + layered throttling + weak PIN deny list + device binding (§36.4) |

When the gateway enters (advanced phase), `Payment` adds two mandatory controls: **webhook signature verification** and **payment status only changes from verified webhooks, never from clients** — replacing `ManualMerchantVerifier` without changing the state machine.

### Verdict

**`PERLU PENGUATAN`** — no Critical findings, but nineteen High findings. Everything has cheap control and it is written above. Controlling findings **#1–#7, #12, #13, #14, #16, #18, #19, #22, #24, #26, #28, #31, #35, and #36** become **non-negotiable acceptance criteria**: no MVP feature can be declared complete without them. If one is skipped "to be done later", the design drops to `RENTAN` and implementation must stop.

Special note for the “individual owner” decision: technically the design remains `PERLU PENGUATAN`, but finding #16 is an **existential, not technical** risk — one lost cell phone could kill a platform whose data is fine. The controls are cheap (password manager + printed backup code + account break-glass + runbook), but should be done in Phase 0, not later.

**Out-of-scope findings**: none; GUYUB is a new surface and does not change the current Berdikari architecture.

### RBAC — new permissions

Following the `resource.action` convention (DNA §9c), defined in `IAM/database/seeders/PermissionSeeder.php`, without wildcards:

```
guyub_merchant.view/update/verify
guyub_order.view/create/accept/reject/cancel/complete
guyub_payment.view/approve          # approve = konfirmasi/tolak klaim pembayaran (merchant & Ops saja)
guyub_cod.view/update               # kebijakan COD + daftar pelanggan dipercaya
guyub_driver.view/update/verify/dispatch
guyub_courier.view/create/update      # kurir milik merchant (peran `guyub-merchant-courier`)
guyub_ticket.view/create/redeem
guyub_place.view/create/update
guyub_review.view/create                 # create hanya untuk pemilik pesanan yang selesai
guyub_subscription.view/update           # merchant: lihat; Ops: ubah status & konfirmasi tagihan
guyub_ad.view/create/update              # slot bersponsor; kuota tetap ditegakkan server
guyub_commission.view/export
guyub_ops.complaint_handle
```

**Convention note**: GUYUB adds the verbs `accept`, `reject`, `complete`, `verify`, `dispatch`, `redeem`, `complaint_handle` to the DNA action vocabulary §9c. This is **an intentional and documented expansion**, not an oversight — the `resource.action` form and wildcard ban remain in effect, and are entirely defined in `IAM/database/seeders/PermissionSeeder.php`.

Default roles: `guyub-customer` (his own order; **never had `guyub_payment.approve`**), `guyub-driver` (assigned order), `guyub-merchant-courier` (his own stall order assigned to him — fourth lens §23.5), `guyub-merchant-staff` (accept/reject/set up + confirm payment), `guyub-merchant-owner` (+ menu, COD policy, commission, reports), `guyub-ops` (verification, complaints, payment disputes), `guyub-admin`. Each feature must pass the 8-step checklist RBAC DNA §9j, including **rejection path testing** — specifically: customer calling the payment confirmation endpoint must receive `403`.

---

##10 — Contract API (outline)

New prefix: `/api/v1/guyub/*`. Existing `v1` contracts are not touched.

| Group | Example | Auth |
|---|---|---|
| Public (60 sec edge cache) | `GET /guyub/merchants?zone=&type=` (includes `is_open_now`, `last_order_at`, `next_open_at`), `GET /guyub/merchants/{slug}`, `GET /guyub/places`, `GET /guyub/destinations` | No (rate limited) |
| Auth customer | `POST /guyub/auth/register`, `/auth/otp`, `/auth/login`, `GET /guyub/me` | Sanctum |
| Orders (customers) | `POST /guyub/orders` (+`Idempotency-Key`), `GET /guyub/orders`, `GET /guyub/orders/{id}`, `POST /guyub/orders/{id}/cancel`, `GET /guyub/orders/{id}/track` | Sanctum + policy lens |
| Merchants | `GET /guyub/merchant/orders`, `POST .../{id}/accept|reject|ready|request-prepay|not-picked-up`, `GET /guyub/merchant/summary` | Sanctum + `Tenantable` |
| Fulfillment & shipping | `PUT /guyub/merchant/fulfillment` (active mode + sequence), `PUT /guyub/merchant/delivery-fee-rule`, `GET|POST|DELETE /guyub/merchant/couriers`, `POST /guyub/merchant/orders/{id}/assign-courier` | Sanctum + `Tenantable`; nominal postage is always calculated by the server (§23.2) |
| Operating hours | `GET|PUT /guyub/merchant/hours` (multi-session weekly schedule), `PUT /guyub/merchant/prep-time`, `POST /guyub/merchant/close` (required `duration`), `POST /guyub/merchant/open`, `GET|POST|DELETE /guyub/merchant/closures` (holidays/special dates) | Sanctum + `guyub_merchant.update` |
| Estimated time | `POST /guyub/merchant/orders/{id}/accept` (with `eta_minutes`), `POST .../extend-eta` (max 2×). Order response includes `promised_ready_at` & `promised_delivery_at` as **timestamp**, not remaining minutes | Sanctum + `guyub_order.accept` |
| Order merchants | `GET|PUT /guyub/merchant/messages` (welcome & thank you; validated & reviewed Ops) | Sanctum + `guyub_merchant.update` |
| Payment | `GET /guyub/orders/{id}/payment` (QR + unique nominal), `POST /guyub/orders/{id}/payment/claim` (customer, make claims only), `POST /guyub/merchant/payments/{id}/confirm|reject|amount-mismatch`, `GET /guyub/merchant/payments/pending` | Sanctum; confirm **only** merchant role |
| COD Trust | `PUT /guyub/merchant/cod-settings`, `GET /guyub/merchant/customers/{id}/summary`, `POST /guyub/merchant/customers/{id}/trust|untrust` | Sanctum + `Tenantable` |
| Assessment | `POST /guyub/orders/{id}/reviews` (all items + merchant + driver at once), `GET /guyub/merchants/{slug}/products?sort=terlaris\|disukai`, `GET /guyub/home/populer` | Create: Sanctum + order owner `selesai`. Read: public (from projection) |
| Premium | `GET /guyub/merchant/plan`, `GET /guyub/merchant/invoices`, `POST /guyub/merchant/ads` (book slot), `GET /guyub/merchant/ads/stats`, `POST /guyub/merchant/broadcast` | Sanctum + `PlanService` on server |
| Premium ops | `POST /guyub/ops/invoices/{id}/approve`, `PUT /guyub/ops/subscriptions/{id}`, `GET /guyub/ops/ads/slots` | Sanctum + Ops role |
| Drivers | `POST /guyub/driver/online`, `GET /guyub/driver/offers`, `POST /guyub/driver/offers/{id}/accept`, `POST .../orders/{id}/pickup|courier-fee-received|deliver|complete`, `POST /guyub/driver/location` (batch), `GET /guyub/driver/earnings` (daily & weekly) | Sanctum |
| Tickets | `POST /guyub/tickets`, `GET /guyub/tickets/{id}`, `POST /guyub/tickets/redeem` | Sanctum |
| Buy it | `POST /guyub/shopping-orders` (shopping list + estimate), `POST /guyub/driver/shopping/{id}/receipt` (receipt value + photo), `POST .../adjust` (items out of stock/price different) | Sanctum; ceiling & track record checked server (§24.3) |

All responses use API Resource with **explicit field list** (never `toArray()` model). The error uses the Laravel error form that has been used `berdikari-mobile` so that `ApiException` can be reused.

---

## 11 — Non-Functional Requirements & Compliance

| Aspect | Targets |
|---|---|
| Performance | API p95 < 400 ms; application cold start < 3 seconds; APK size < 30 MB |
| Data consumption | < 15 MB/day for fully active drivers; < 5 MB/customer session |
| Battery | Driver: location only when the order is active; without permanent wake-lock |
| Accessibility | Minimum text size 14 sp, contrast AA, target 44 px |
| Copy | 100% following §17; no hard strings in widgets (all in ARB); the raw API message is never displayed to the user |
| Searchability | Each error has a code `GYB-…` + `request_id`; the screen fails to display the 5 character trace code (§31) |
| Economic feasibility | Reviewed monthly via 4 points §30.6; threshold **120 orders/day** (§30.3) |
| Privacy (Law 27/2022) | Explicit consent upon registration; driver location retention **7 days** then summarized; cell phone number is never logged; the right to delete an account is available in the application |
| Legal (individual owner) | NIB via OSS + PSE Kominfo private scope on behalf of individuals; T&C + Indonesian language privacy policy that states **name of owner as data controller**; GUYUB's position is written firmly as **middleman**, not a food seller and not a transporter — **without total exoneration clause** (§22.6); **does not hold user funds** (Non-negotiable 8). Full mapping: **§22** |
| Taxes & personal finance | Commission = personal income (personal NPWP, PPh). **One special commission account**, separate from the daily personal account, and never the purpose of payment for orders (finding #17) |
| Legal responsibility | Without a business entity there is no separation of personal assets. Mitigation: small transaction value, valid T&Cs (**not total exoneration clause** — §22.6), dispute resolved between parties with Ops as mediator, `guyub_order_events` records as evidence. **Form a CV/PT before opening a travel booking, using a payment gateway, or increasing volume significantly** (§22.9) |
| Statutory compliance | Complete mapping + Phase 0 checklist in **§22**: NIB/OSS, PSE Kominfo, PDP Law, PMSE, people transport, food & halal, taxation, driver partnerships |
| Custody access | Centralized credentials in password manager, 2FA backup codes printed & stored offline, second break-glass account, recovery runbook (finding #16) |
| Backup & DR | PITR ≤ 5 minutes + encrypted daily dump + **copy on second provider**; **monthly logged restore exercises** — complete runbook in §19 |
| Freedom to change providers | No proprietary features in the critical path (standard Postgres/Redis/S3 only) — §19.5 |
| Observability | Sentry (error), external uptime monitor, 4 number dashboard: orders/hour, dispatch failure rate, p95 API, error rate |

---

## 12 — Delivery Phase

Each phase ends with: green test in CI, Indonesian copy verified, **RBAC reject path tested**, security controls §9 (#1–#7) installed, and a release tag.

**Calendar timeline, order of work within each phase, and gates between phases are in §37.**

| Phase | Results | Contents | Tags |
|---|---|---|---|
| **0 — Foundation** | Road framework | `Merchant`/`Marketplace`/`Ordering`/`Delivery`/`Payment` modules are scaffolded, customer/driver auth, Flutter monorepo + `guyub_core`/`guyub_ui`, CI, T0 infra as code, **credential custody + recovery runbook (discovery #16)**, **backup + first restore exercise (§19.3)**, **web profile §20 (home, legal, registration)**, **legal checklist §22.8 complete (NIB, NPWP, PSE, privacy policy, T&C, separate commission account)** | `v0.1.0` |
| **1 — Culinary: pick up yourself + merchant courier** | First real transaction, **can now deliver without having a driver** | Discovery + public projection, merchant catalogue, **product variants/options/additions (§34)**, basket, **multi-session operating hours + last order limit + temporary close duration (§5k)**, **payment gateway + static QRIS with unique nominal + merchant manual verification (§5h)**, **COD policy & trusted customers (§5g)**, take limit + `gagal_tidak_diambil`, Merchant application accept/reject/ask-pay-first + order alarm, **estimate ready + countdown (§5l)**, **merchant welcome & thank you message (§5m)**, **`kurir_merchant` mode + merchant shipping rules (§23.2)**, **feedback & suggestions channel (§28)**, FCM notification, **all copy follows §17** | `v0.2.0` |
| **2 — GUYUB Courier** | Complete chain | Dispatch, Driver app, **zone postage rates + payment rules §23.4**, **Quick Order (§29.2)**, completion OTP, tracking (adaptive poll), **product/merchant/driver ratings + Best Selling & Most Liked badge (§5i)** | `v0.3.0` |
| **3 — Services (motorbike taxi & courier) + Purchase and Delivery** | Second vertical | Passenger & courier orders, fare matrix in official ranges (§22.4), **Travel Directory** (licensed provider contacts, no bookings), **Tip-Purchase with bailout ceiling (§24)**, driver partnership agreement, **"7-day highlight" manual sale via Ops Console** (first revenue, no billing system) | `v0.4.0` |
| **4 — Tour ticket + Light cashier** | Third vertical + retention machine | `Ticketing` module, quota per date, signed QR, **offline scan** at gate; **Light POS in Merchant app (§18)**: record sales, daily recap, mark out-of-stock products | `v0.5.0` |
| **5 — Money, Premium & Ops** | Ready to be sustainable | Weekly commissions & billing, payment dispute handling (§5h), **Merchant Premium full: packages, `PlanService`, sponsored slots, broadcasts, ad statistics, subscription billing (§5h)**, Full Ops console (verification, complaints, *aging* payment list, reports). **Gateway + split settlement only if there is already a business entity** — if not, still QRIS merchant | `v0.6.0` |
| **6 — Hardening & release** | Ready shop | Loading/empty/failed state audit, offline resilience, light load test, practice restore, privacy policy, Play Store release | `v1.0.0` |

**Before Phase 1 is released to customers**: shop page `/w/<slug>` (§20) must be live and **≥ 15 shops verified** (§21.1). Launching on a thin supply is the quickest way to burn a one-off first impression.

Phase 1 was intentionally **driverless and cashless**: cash-out pick-up orders was the smallest vertical slice the shop had value for, and tested the hardest part (the merchant actually seeing & responding to the order) before we built anything on top of it.

**Why is Premium only in Phase 5, even though it is a source of income?** Because what premium sells is *customer attention* — and in Phases 1–2 there was no attention to sell; sponsored slots on a lonely homepage are of no value to anyone. Correct path: **sell manually first in Phase 3** (Ops puts one merchant on the "Today's Choice" card, merchant transfers IDR 15,000). If no one wants to buy manually, building a subscription system won't change anything — and save us weeks. If it sells, Phase 5 is just automating something that people have proven to pay for.

Product assessment (§5i) is in Phase 2 because the requirement is an actually completed order; showing "Most Liked" out of 3 ratings would be misleading.

---

##13 — Success Metrics

| Metrics | Target 6 months |
|---|---|
| Active merchants (≥ 1 order/week) | 40 |
| Orders per day | 150 |
| Order rate received by merchants < 5 minutes | > 85% |
| Merchants who fill operational hours | 100% (verification requirement) |
| Order completed within promised estimate | > 80% |
| Orders that require an ETA extension | < 15% |
| Merchants who fill out thank you messages | > 70% |
| Merchants who use light cashier ≥ 3 days/week (after Phase 4) | > 50% |
| `/w/<slug>` page visit → order | > 10% |
| Merchants with their own couriers who remain active at GUYUB | > 80% (indicator §23.2 successful) |
| Mode distribution: self-pickup / merchant courier / GUYUB courier | monitored monthly, without targets — determine when to add drivers |
| Monthly restore exercise completed in RTO | 12 of 12 |
| Merchant closed automatically due to unresponsiveness | < 5% per week |
| Order completed / order created | > 90% |
| Daily active drivers | 15 |
| Infra cost per order | < Rp. 100 |
| 2nd month customer retention | > 30% |
| Graded completed orders | > 35% (indicator §5i actually used) |
| Products with ≥ 5 ratings | > 100 products |
| Premium merchants | 10 of 40 (25%) |
| **Monthly revenue vs infra costs** | **> 1.5×** (sustainability point, §5h) |

---

## 14 — Risk

| Risk | Mitigation |
|---|---|
| Merchant doesn't see the order (risk number one) | High priority FCM + foreground service + repeating alarm + backup polling + automatic call from Ops on pilot |
| Bad signal in the Tegalwaru hill area | Offline robustness, small payload, scan tickets offline, all writes idempotently |
| Driver liquidity (orders exist, drivers don't) | **`kurir_merchant` mode from Phase 1** makes road deliveries completely devoid of platform drivers (§23.2); Phase 2 recruit drivers per village with a schedule; merchants always have a "self delivery" option |
| **Merchants who have their own couriers feel they are being charged for services they don't receive** | Ordering platform fees are strictly separated from delivery service fees; shipping mode `kurir_merchant` **100% owned by the merchant**, zero GUYUB deduction (§23.2) |
| **Big brands object to buying tips** | Just the name of the place, no logo/menu/prices/affiliate claims; revoked immediately upon request (§24.1) |
| **Display feels "not from here"** (AI slop) | §27: original content from sketches, palette of local objects, assisted photo Ops during onboarding, test neighbors before the screen is considered complete |
| Merchants use GUYUB for discovery and then move transactions to WA | Countered with value (auto recaps, new subscribers, badges, highlights), not with unenforceable bans |
| Wallet/balance ambition | Non-negotiable 8 — BI permission required; refuse until there is a legal entity + permission |
| **Fictitious order / food not taken** (risk number two) | Gateway payments before merchants know; COD only for trusted customers + nominal limit; customer card + "Call first" + "Ask to pay first"; `gagal_tidak_diambil` → COD blocked 30 days after 2 events (§5g) |
| **QRIS payment not received / late / wrong amount** | Unique nominal for mutation matching; status `lunas` only from merchants; not yet cooked = not yet cooked; 7 case treatment matrix in §5h; register *aging* in the Ops Console |
| **Individual owner as sole point** | Credential custody + offline backup code + break-glass account + runbook (finding #16); legal responsibility without separation of assets → form a CV/PT before increasing the volume |
| **Rates do not cover drivers' actual costs** | Rates are derived from cost per km + real distance traveled (2× distance between) + time wages, reviewed quarterly or when petrol moves >10% (§35) |
| Cafe on a hill / difficult road no one wants to deliver | Additional terrain IDR 3,000–5,000 full to the driver, marked on the offer card, driver can choose to accept the climb order (§35.5) |
| Lots of drivers but orders are thin → drivers stop | Hire 3–4 drivers first, not 5–8; order density determines income more than rates (§35.8) |
| **Drivers feel unpaid** (most damaging — word spreads a day) | Cash on delivery at pickup, not weekly disbursement; double-sided confirmation; drivers **always get paid for trips taken**, including when the customer is not there (§23.4) |
| Stall runs out of cash for postage | “Pay later” → `ongkir_tertunda` resolved in weekly recap; orders are never blocked because of this |
| Merchant rejects valid payment claims | Customer evidence is stored, rejection ratio per merchant is monitored Ops, manual sanctions; dispute has a complete trace `guyub_order_events` |
| **Merchant forgets to open status** (loses silent income, then blames the app) | Temporarily closed **mandatory duration** and self-expiration; reminder every morning at the scheduled opening time; big & clear status on Merchant app homepage (§5k) |
| A one-session schedule forces merchants to use temporary closings every day | **Multi-session** schedule since Phase 1 — open morning/close afternoon/open afternoon pattern is normal here |
| **Judgement destroys social relationships** (all know each other) | Anonymous public, no free comments, no “worst” rating, minimum threshold of 5 ratings, negative feedback only private to the merchant (§5i) |
| **Valuation manipulation** | Only from orders `selesai`, unique per `order_item`, "Best Selling" based on paid transactions, anomalies show in Ops Console |
| **Discovery turns into a billboard** | "Sponsored" label, maximum quota 20%, popularity badge not sold, merchant closed never appeared (§5h) |
| **Premium doesn't sell** | Manually tested in Phase 3 before the system is built; If it doesn't sell manually, the subscription system is canceled and the focus moves to commissions |
| **Transportation of people without permission** (travel/car charter) | Travel leaves v1, replaced by Travel Directory without bookings/commissions; motorbike taxis follow the tariff, discount and safety requirements (§22.4) |
| Driver document verification is skipped for fast | **SIM C is absolutely mandatory**; Valid STNK (may belong to someone else + owner's permission); tiered helmets according to order type — §22.10. Ops meet the driver directly during the pilot |
| **Terms too heavy → no driver** | Loan motorbikes accepted, max. 2 registered vehicles, passenger helmets only for those who want to take passenger orders (loan helmets provided), no SKCK/health certificate/deposit (§22.10) |
| "Halal" claims appear without evidence | Label only appears when certificate/self-declare is uploaded (§22.5) |
| **Launching before sufficient supply** | Threshold ≥ 15 active stalls per sub-district before promotion to customers (§21.1); before that, all the energy goes to merchant recruitment |
| **Vendor lock** makes switching providers expensive | Prohibition of proprietary features on the critical path (§19.5); restore exercise proves its portability |
| POS shifts focus from online orders | POS is intentionally light and is placed in Phase 4; Those who need complete information are directed to the Berdikari website (§18.2) |
| Revenue does not cover costs | The “revenue vs infra costs > 1.5×” metric is monitored monthly; T0 costs are indeed reduced so that this threshold is low |
| Scope creep across verticals | Phase gate: no new vertical before previous vertical reaches metric §13 |
| Costs balloon silently | Cost per order dashboard; number-based §7.2 stage-up trigger |

---

##15 — Verdict: Already Locked & Still Open

**Already decided (v0.2, no need to re-discuss):**

- ✅ **Platform owner: individual, independent, unaffiliated.** It is legal to run GUYUB as designed here — full compliance mapping in **§22**, with one mandatory scope change (car travel, §22.4) and three triggers for when this status must change (§22.9). The consequences have been carried out throughout the document: no wallet/escrow account (§2.8), direct payments to merchants (§5h), commission only account (§11), mandatory credential custody in Phase 0 (finding #16), gateway delayed until business entity exists (§12 Phase 5).
- ✅ **COD only for customers known to the merchant**, with merchant confirmation before cooking — §5g.
- ✅ **QRIS static has handling of payment not received/failed to enter** — unique nominal + merchant verification + 7 case matrix, §5h.

**Still open** (written with default recommendations; change if necessary before Phase 0):

1. **Pilot commission model** — *Default: 0% for the first 3 months, then 5% culinary / IDR 1,000 per service order.*
2. **Customer login method** — *Default: cellphone number + 6-digit PIN, OTP only when registering/changing devices.* OTP delivery: **WhatsApp Business API first, automatic SMS gateway fallback** (§36.6) if the number isn't reachable on WhatsApp within the timeout — no user-facing channel picker. Prices for both providers need to be verified at that time.
3. **Automatic COD trust threshold** — *Default: 2 completed orders per merchant, nominal limit IDR 100,000, block COD 30 days after 2 non-collections.* This figure should be reviewed after 1 month of pilot data.
4. **Payment & claim deadline** — *Default: 15 minutes before claim, 60 minutes after claim.* Adjust if interbank transfers in the field are slower.
5. **Hosting T0** — *Default: one local VPS (latency to Karawang) + Postgres managed with PITR.* Compare with Fly.io when provisioning.
6. **When to form CV/PT** — *Default: when volume is > 500 orders/day or when a gateway is needed, whichever comes first.*
7. **Premium & add-on package prices** — *Default: IDR 30,000/month, "7 day highlight" IDR 15,000.* Manually tested in Phase 3; The final price is determined from actual willingness to pay, not from a table in this document.
8. ✅ **Answered**: premium commissions are **2 percentage points lower**, not 0% (§30.5). The full application fee schedule is at §30.5; Economic feasibility threshold **120 orders/day** (§30.3).
9. **Web ordering (PWA)** — *Default: not in v1.* Determined from data: how many people opened `/w/<slug>` but did not install the app (§20.3). Full HP storage is the obvious reason for resistance here.
10. **Launch shipping subsidy budget** — *Default: IDR 1–2 million, shipping IDR 2,000 for 2 weeks, stops automatically when the budget runs out* (§21.3).
11. **Module technical name** — this document uses `Merchant`/`Marketplace`/`Ordering`/`Delivery`/`Ticketing`/`Payment`; locked during the first nwidart scaffold.
12. ✅ **Answered**: driver commission arrears — auto escalation (notification → SP1 → SP2 → SP3) within **≤ 5 days**, final removal from discovery requires manual Ops confirmation (§23.6).

---

## 16 — Checklist Before Writing GUYUB Code

1. Read this document + `.agents/skills/project/berdikari.md` (§2, §9) + `docs/16-mobile-implementation-plan.md`.
2. Which module has this task? (§6.2 — don't create new modules for no reason)
3. Does this task touch the value of money/stock/quota? → mandatory: compute on server, idempotent, audit.
3b. Can this task change `status_bayar`? → only verified merchants or webhooks, **never customers** (§2.13).
3c. Could this task cause the merchant to cook? → ensure payment/trust gateway passes (§2.14, §5g).
3d. Does this assignment touch the discovery sequence? → paid slots must be labeled "Sponsored", maximum 20%, popularity badge must not be affected by package (§5h).
3e. Does this task entitle premium features? → resolved `PlanService` on the server, not the client (finding #20).
3f. Does this task create a new order? → open/close status & last message limit **revalidated on the server at checkout**, not just when the screen is opened (§2.15, §5k).
4. Does this task read cross-tenant data? → mandatory through public projection (§6.3), not a relaxation of scope.
5. Have the new permissions been defined in the IAM seeder and mapped to roles? (DNA §9j)
6. All Indonesian copies, touch target ≥ 44 px, is there a loading/blank/failed state?
7. Is this behavior still correct when the signal is lost midway?
8. Does any new text pass §17? → greeting "you", short sentences, no blame, errors always offer the next step.
9. Is this a design job? → §27: start from the original content, one accent, the effect must have a reason, and pass the neighbor test before it is considered complete.
10. Will it be released? → §26.5 Go/No-Go criteria, with no exceptions for blocker classes (§26.6).

---

##17 — Tone & Copy Guide (required attachment)

Applies to **all** text that users see: buttons, titles, notifications, confirmation dialogs, and failure messages — across all three apps and the Ops Console. This is not a style suggestion; copies that don't pass these guidelines are considered defective, just like buttons that don't work.

### 17.1 Principles

1. **"You", not "you".** GUYUB is a neighbor, not a bank.
2. **Short sentences.** One idea per sentence. 360 dp screen does not fit paragraphs.
3. **Never blame the user.** Not *"You entered the wrong data"*, but *"The number doesn't seem complete"*.
4. **Each failed message must offer a next step.** If there is no step, state who is taking care of it.
5. **No jargon.** No "escrow", "settlement", "sync", "timeout", "server", "token".
6. **Maximum one emoji, and never** messages about money, cancellation, or failure.
7. **Say the name, not the number.** *"Warung Bu Siti"*, not *"Merchant #48"*.
8. **Don't make uncontrolled promises.** "Approximately", "usually" — not "definitely".

### 17.2 Pitch calibration (the part that goes wrong most often)

Casual **does not apply equally across screens.** There are three levels:

| Level | Used for | Example |
|---|---|---|
| **Cheerful** | Good news: order received, ready, delivered, completed | *"Great, your order has arrived!"* |
| **Soothing** | Waiting, delays, minor technical problems | *"Just a little longer, your order is being sorted out."* |
| **Warm but straightforward** | Money, failed payment, cancellation, rejection, sanctions | *"Payment has not yet entered the stall's account. If you have transferred it, send proof of it — we will help with the check."* |

**"Oops" should not be used on screens involving people's money.** For someone who has just sent Rp. 45,000, a joking tone feels dismissive. Cheerful for good news; for the money, keep it warm but clear.

### 17.3 Copy dictionary (implementation reference)

| Situation | Don't | Use |
|---|---|---|
| Waiting to pay | "Waiting for payment" | "Just pay. Scan the QR, I'll let you know when it's in." |
| Claim paid sent | "Verification in progress" | "Okay, I'll continue to the shop to check. Just a moment." |
| Merchant accepts | "Order confirmed" | "Great, your order is being prepared! It'll be ready in about 15 minutes." |
| Under preparation | "Status: preparing" | "Wait a moment, OK, another order will be prepared." |
| Delay in estimates | "Order late" | "Just a little longer, your order is being sorted out." |
| Ready to be delivered | "Order ready for pickup" | "Great, order ready to be delivered!" |
| Road Driver | "Courier on the way" | "It's on its way! Kang Ujang is on his way again, around 19.25." |
| Done | "Transaction completed" | "Order accepted, enjoy!" |
| Technical obstacles | "An error occurred (500)" | "Oops, there's a problem. I'll check first — try again in a moment." |
| Merchant closed | "Merchant not available" | "Well, Warung Bu Siti is closed. Open again tomorrow at 06.00 — want me to remind you?" |
| Past the message limit | "Exceeded the order limit" | "The kitchen has been tidied up. Order again tomorrow morning, okay?" |
| Payment rejected by merchant | "Payment failed" | "The payment hasn't been entered into the stall's account. If you have transferred it, send the proof, OK? We'll help you with the check." |
| COD not yet available | "You do not meet the requirements of COD" | "For now, pay first via QRIS. If you have ordered several times here, you can pay on the spot." |
| Not taken | "You failed to pick up the order" | "The order wasn't taken. Next time, let the shop know if you're not available." |
| New orders (merchants) | "There is an incoming order" | "New orders have come in! Wait, don't take too long." |
| Check mutation (merchant) | "Payment verification" | "Let's check the transfer: IDR 45,317 from Mrs. Siti. Has it come in?" |

### 17.4 Technical rules

- **All copies live in the ARB file** (`guyub_core/l10n/app_id.arb`). There are no hard strings in the widget — including failure messages.
- The failure message from API is mapped to the Language copy on the client; **never display raw** Laravel/HTTP messages to users.
- Merchants may write their own messages (§5m) — with applicable content fences there.
- **Every feature's Definition of Done includes a copy review.** A quick way to check: read the sentences out loud. If it sounds like an official letter, rewrite it.

---

##18 — Light Cashier (POS) in Merchant Application

**Short answer: yes, it is necessary — but not as a selling feature, and not in the MVP. Enter Phase 4.**

### 18.1 Why this is a real differentiator

GoFood Merchant only handles orders that come from GoFood. In fact, at the Pangkalan/Tegalwaru stall, **90% of transactions are direct buyers**. This means that apps that only handle online orders are only opened 2–3 times a day — and that's where the biggest problems for small platforms begin:

> few online orders → merchants rarely open the application → orders are responded to late → customers are disappointed → fewer orders.

The cashier broke the circle. Merchants open the application **50 times a day** because every buyer is recorded there — so when an online order comes in, their cellphone is actually in their hand.

So the value of POS is not "additional features", but rather three things at once:
1. **Merchant retention** — reasons to open the app every day.
2. **Other feature accuracy** — stock runs out automatically, busy hours are detected, ETA (§5l) estimates are more realistic because the system knows the queue is offline.
3. **Value that competitors don't have** — GoFood isn't interested in building bookkeeping for this class of stall, and other small platforms don't have ERP behind them.

And the costs are low because **the backend already exists**: the modules `Sales`, `Catalog`, `Inventory`, and `Finance` in `berdikari-api` are already running and already used by `berdikari-web`. GUYUB Merchant **is** an Independent tenant (§3) — so this is turning on something that is already installed, not building from scratch.

### 18.2 Scope — intentionally light

| Entry (Phase 4) | Not logged in |
|---|---|
| Record sales quickly: select product → quantity → total → save | Cashier shift open/close |
| Pay cash or QRIS (mark paid) | Multi-cashier, access rights per cashier |
| Daily recap: today's sales, number of transactions | Stock valuation, COGS, profit and loss statement |
| Mark products out of stock (directly affects online catalogue) | Purchases to suppliers, stock cards |
| Export monthly recap (premium) | Receipt printing, cash drawer, Bluetooth printer |

Merchants who need complete information are directed to **Berdikari web** — it's available, free, and a reasonable entry point for upscale stalls. It's also a healthier long-term monetization path than cramming ERP into HP applications.

### 18.3 Free vs premium split

Track sales + daily recap **free forever** — if retention is the main reason, locking these features behind a fee defeats the purpose. The premium: monthly recap, CSV export, and history over 30 days.

### 18.4 Why Phase 4, not now

Before there was a running online order flow, POS simply shifted the team's focus to problems that weren't the reason people signed up. The sequence should be: online order goes (Phase 1–3) → merchant finds GUYUB useful → then offers cashier as a reason to open the app every day. Reversing this order results in a bookkeeping app that happens to have a delivery feature, and that's a different product.

---

## 19 — Backup, Migration & Disaster Recovery

This section is a **runbook**, not a discourse. The targets are set in §7.1: **RPO ≤ 5 minutes, RTO ≤ 60 minutes** in the pilot stage.

### 19.1 Classification of data (determining how to protect it)

| Class | Contents | RPO | How to |
|---|---|---|---|
| **Critical** | Postgres: orders, payments, tickets, subscriptions, IAM | 5 minutes | Continuous PITR/WAL + daily dump |
| **Important** | Object: evidence photos, product photos | 24 hours | Object storage replicated + weekly copy |
| **May be lost** | Redis: cache, queue, live location | — | Not backed up; the system should remain correct without Redis |
| **Code & infra** | IaC, migration, configuration | — | Git (remote + owner's local copy) |
| **Secret** | Credentials, ticket signer keys | — | Password manager + backup code **printed, offline** (finding #16) |

### 19.2 Backup scheme

- **PITR** active in Postgres managed (continuous WAL) → restore to specific minute.
- **Daily dump** (`pg_dump`) at 03.00 WIB, **encrypted**, uploaded to object storage.
- **Retention**: 7 daily · 4 weekly · 3 monthly. Enough to discover the damage only to be noticed a week later.
- **2 provider rule** (simplified version of 3-2-1): one copy on main provider, **one copy on different provider** (e.g. owner's Google Drive or external hard disk, refreshed weekly). The reason is specific to individual owners: if the provider's account is locked, the backups that were only there are lost along with the system.
- **Encryption keys are stored separately from backups** — not on the same server, not in the same bucket.
- Backups contain PII; treat it like a production database (finding #27).

### 19.3 Restore exercise (which makes it all real)

**Once a month, scheduled, logged.** DR that has never been tested is not DR — it is an assumption.

Practice checklist: take latest dump → restore to new database → run API on it → check 5 things (number of yesterday's orders, one order can be opened, login works, commission balance matches, photos can be accessed) → **note how long** → keep a record. If it's time to go through the RTO, that's a finding, not just a note.

### 19.4 Scenarios & steps

| Scenario | Detection | Step | RTO |
|---|---|---|---|
| App dies/crashes | Uptime monitoring | Automatic restart; if it fails, redeploy the last good image tag | 15 min |
| Bad release | Error rate increases | **Rollback to previous tag** (image versioned); DB migration is non-destructive (§19.5) so rollback is safe | 15 min |
| Deleted/incorrect data `UPDATE` | Ops Report | PITR to a point before the event **to a new database**, fetch the necessary rows, paste — not overwrite the entire production | 60 min |
| Database corruption | Healthcheck failed | Failover managed (T1) or restore last dump + WAL (T0) | 60 min |
| Provider down | Provider status page | Wait if < 1 hour; if more, restore to backup provider from dump + change DNS (Cloudflare, low TTL) | 2–4 hours |
| **Provider account locked / owner loses access** | Can't log in | Break-glass account + printed backup code; backup copy at a second provider; IaC in git | 4–8 hours |
| Leaked credentials / ransomware | Anomalous activity, audit | Revoke all tokens & keys, change credentials, restore from backup **before** time of compromise, mandatory reporting as per PDP Law if PII is impacted | 4–8 hours |
| Disruption during rush hour | Merchant calls | **Non-technical plan**: Ops broadcast to merchant WhatsApp group, shop returns to direct/telephone service, ongoing orders are completed manually | soon |

The last scenario is often forgotten even though it occurs most often. For stalls, "system down" is not a disaster as long as someone tells them and they know what to do.

### 19.5 Migration

**Schema migration (every release):**
- **expand → migrate → contract** pattern: add nullable columns first, fill in data, then use; **never** delete/rename a column in the same release as the code that uses it. This is what makes rollback safe.
- Automatic backups run **before** `migrate` on every production deployment.
- Migrations that touch > 100K rows are run in batches, outside peak hours (06.00–22.00 avoided).

**Migration between providers:** everything is Docker + Postgres + S3-compatible storage, so move = restore dump + copy objects + change DNS. So that remains true, there is one binding architectural rule:

> **Do not use provider proprietary features on the critical path** — no Supabase Realtime/Edge Functions, no vendor-specific queues, no exotic Postgres extensions. Only standard Postgres, standard Redis, standard S3 API are used.

The price of freedom is cheap to pay now; it's expensive to pay when providers raise prices or close accounts.

**User data portability (PDP Law):** merchants can export their business data (products, orders, recaps) in CSV; Customers can request account deletion — historical orders are anonymized (name & number removed), not completely deleted, because the merchant's financial records must remain intact.

---

## 20 — GUYUB Profile Web

Lightweight public site on **Cloudflare Pages** — built as part of `berdikari-web` (Nuxt) on a separate subdomain/route, so **zero overhead**.

### 20.1 The four tasks of this site

1. **Trust** — people search for “Base GUYUB” before installing the app. If there is nothing, they doubt.
2. **Shareable page** — this is the largest acquisition channel in the village (§21).
3. **Registration gate** merchants & drivers.
4. **Compliance** — privacy policy, T&Cs, data controller identity, contact. PSE terms and Play Store terms.

### 20.2 Page map

| Page | Contents | Notes |
|---|---|---|
| `/` Home | One sentence proposition, download button, "3 steps to order", list of currently open stalls (directly from public projection), service area | Live data, not screenshots |
| `/w/<slug>` **Stavern profile** | Menu + prices, opening hours, "Best Selling" badge, "Order in app" button (deep link) | **Most important page** — this is what the merchant shares in WA status |
| `/daftar-warung` | Merchant registration form → Ops verification queue | Simple: name, address, photo, cellphone number |
| `/gabung-driver` | Driver registration form | idem |
| `/bantuan` | FAQ + WhatsApp Ops button | Language follows §17 |
| `/privasi`, `/ketentuan` | Privacy policy (names data controller), T&C, info PSE | Mandatory |
| `/status` | Simple service status | Used during disturbances (§19.4) |

### 20.3 Design principles

- **Consistent with app**: same color tokens, typography, and components — a site that feels different from the app actually decreases trust.
- **Mobile-first and lightweight**: target < 100 KB per page, WebP images, no heavy frameworks, no carousels. Many open it with a small quota.
- **Language following §17**, including on legal pages — T&Cs can be precise without sounding like court papers.
- **Local SEO**: title mentions "Pangkalan" & "Tegalwaru", `schema.org/LocalBusiness` on each shop page, automatic sitemap from public projection.
- **Only public data** is displayed. The shop owner's cellphone number is **not** displayed unless the merchant explicitly agrees during registration (finding #26) — this page is indexed by Google forever.
- Site **does not accept reservations** in v1; the button opens the application.

**Strong candidate for advanced phase: web ordering (PWA).** The reasons are real in the field — cheap phones often run out of storage, and "can't install any more apps" is an often-heard objection. Since the API is the same and the stall page already exists, adding message flow on the web is a medium job, not a big one. It was decided after seeing how many people opened `/w/<slug>` but didn't install the app.

---

## 21 — Strategy to Get Known (Go-to-Market)

This is a market in 2 sub-districts. Broadly targeted digital advertising wastes money; what works is **existing social networks**.

### 21.1 First rule: do not advertise until supply is ready

Launching with 5 stalls means customers come, don't find what they are looking for, and don't come back. In the village, first impressions only last once and bad news travels faster than in the city.

**Launch threshold: ≥ 15 verified and active stalls in one sub-district** before promotion to customers begins. Before that, all energy was directed at the merchant, not the buyer.

### 21.2 Channels, in order of most successful in this context

| Channel | Shape | Cost |
|---|---|---|
| **Self-merchant** | QR stickers on display cases & tables, small cards tucked into wrappers, stalls share `/w/<slug>` links to WA status | Rp. 300–500 thousand print |
| **WhatsApp** | RT/RW/village group, PKK group, youth group, WA status. What is shared is **shop page link**, not an invitation to download | Rp 0 |
| **Driver as running board** | Vest/helmet says GUYUB; seen every day = trust | IDR 50 thousand/person |
| **Business point** | Banners at village gates, near markets, schools, health centers; market day | Rp. 500 thousand |
| **Local Facebook** | Group "Info Pangkalan / Tegalwaru" — posting daily menus, not product advertisements | Rp 0 |
| **Meta/TikTok Ads radius 10 km** | Only if you want to be measurable; small budget IDR 20–50 thousand/day, target radius, not interest | IDR 500 thousand/month (optional) |
| **Institutional** | BUMDes, PKK, youth organizations, Islamic boarding schools, village offices — official announcements have different weight in villages | Rp. 0, takes time |

**Not done**: influencers, national Google Ads, celebrity endorsements. The coverage is wrong and the money is more useful for postage subsidies.

### 21.3 First try trigger

Just one incentive, simple, time-limited and budget-limited: **postage IDR 2,000 for the first 2 weeks** (the difference is borne by the platform, maximum budget IDR 1-2 million, stops automatically when the budget runs out). Postage is the biggest psychological barrier to the distance that can be covered by a 10 minute walk.

Avoid product discounts — they hurt merchant prices and attract people who only come when it's cheap.

### 21.4 Sequence of execution

| Stage | Focus | Successful size |
|---|---|---|
| **T-6 weeks** | Recruit merchants one by one, approach them directly; help with menu photos | 15–20 stalls ready |
| **T-2 weeks** | Hire **3–4 drivers** (not 5–8 — §35.8: better few but busy); print stickers, banners, vests | Device ready |
| **Launch** | Announcement via village + WA group + banner; postage subsidies start | 30 orders in the first week |
| **Months 1–3** | Merchants share their own links; post daily menu in FB group; added second sub-district | 150 orders/day (§13) |

### 21.5 Measuring without expensive equipment (go to §22 for legal limitations)

One optional question when registering: **"Do you know where GUYUB is from?"** with 5 choices. That's enough to know which channels are worth continuing — much more useful than an analytics dashboard you'll never have time to read.

---

## 22 — Indonesian Legal Compliance (individual owner, independent)

**Note**: this section is design-based compliance mapping, **not legal advice**. Some things that change over time — the KBLI code in OSS, online motorcycle taxi fare decisions, PMSE liability thresholds — must be verified before commercial operations, and one consultation with a notary/legal consultant before launch is worth the expense.

The good news: **the intention of helping local MSMEs does not provide any legal relief**, but the architecture that has been chosen in this document happens to cover most of the biggest risks — especially the decision to never hold user funds.

### 22.1 Status summary

| Areas | Basic | Design status | Action |
|---|---|---|---|
| Business legality | PP 5/2021 (risk-based licensing), OSS | Individuals **may** have NIB as a micro business | File NIB at OSS; proper KBLI verification for commercial digital portals/platforms |
| Registration PSE | Minister of Communication and Information Regulation 5/2020 jo. 10/2021 | Already planned (§11) | List of PSE Private Scopes **before** public release. Late penalties: termination of access |
| Personal data | **Law 27/2022 (PDP)** | Powerful: PII minimization, 7-day location retention, rebuttable rules-based decisions, audits | Designate yourself as Data Controller in the privacy policy; set up flow **leak notification ≤ 72 hours**; provide access/correction/delete rights |
| Payment system | PBI PJP (23/6/2021) | **Secure by design** — funds are never held, no wallets, merchant-owned QRIS | Never hold order funds in a personal account (§22.3) |
| Electronic trading | PP 80/2019, Minister of Trade Regulation 31/2023 | Partial | Include the identity of the business actor, T&C, complaint mechanism, price in Rupiah; save transaction data |
| **People transport** | Law 22/2009, PM 12/2019, PM 118/2018 | **Scope changes required** | See §22.4 — car travel out of v1 |
| Food & halal | Law 8/1999, Law 33/2014 | Merchant's responsibility | Declaration of compliance upon registration; do not claim halal without a certificate (§22.5) |
| Consumer protection | Law 8/1999 Article 18 | **T&C correction required** | The “not responsible for anything” clause is **null and void** — see §22.6 |
| Taxation | HPP Law, PP 55/2022 | Safe by design | personal NPWP, report SPT; **gross turnover = commission**, not order value (§22.3) |
| Driver partnership | Law 13/2003 jo. Law 6/2023 | Documents required | Written partnership agreement; avoid elements that constitute an employment relationship |
| User content | ITE Law | Strong: no free text reviews, merchant messages are moderated | Provide a means of reporting content |
| Brand | Law 20/2016 | Not yet | Check "GUYUB" on PDKI; register in the name of an individual (UMK rate) |

### 22.2 Which is already safe due to previous design decisions

Three decisions were taken not because of the law, but apparently covered the biggest legal risks:

1. **Never holds user funds** (§2.8) → GUYUB is not a payment service provider, does not need BI permission, and is not exposed to the risk of third party funds.
2. **Customer claims are not proof of payment; merchants who confirm their own transfers** (§5h) → payment disputes are a matter between the customer and the merchant, with GUYUB as the recorder and mediator, not the party holding people's money.
3. **PII minimization + limited retention + rules-based decisions** (§5g, §11) → meets PDP Act principles without the need for expensive devices.

### 22.3 Money: a line that should not be crossed

- The owner's personal account **only** accepts commissions and subscriptions. It was never the purpose of paying for the order — even "just once to help a merchant whose QRIS was having problems." Once ordered funds flow into the owner's account, two things happen at once: the activity resembles an unauthorized payment service, and the entire flow can potentially be counted as personal gross turnover for taxes.
- For taxes, **GUYUB's gross turnover is commission**, not transaction value (GMV) — because the order money never passes through. At this scale, the MSME final PPh scheme for individual taxpayers is very likely to apply; Verify the latest thresholds and rates when registering a business NPWP.
- Keep neat commission records since the first transaction. The `Finance` module already records it; Monthly exports are sufficient for SPT.

### 22.4 Transport of people — the only part that must be changed

This is the most important finding in this section, and it changes the scope of the product.

**Motorbike taxis (allowed, with conditions).** Motorbikes are not public transportation according to the LLAJ Law, but online motorcycle taxis are accommodated through ministerial regulations regarding protecting the safety of motorbike users for the benefit of the community. Consequences that bind GUYUB:
- **Tariff** must be within the lower–upper limit range set for this regional zone. The zone matrix (§6.7) must be calibrated to that range, not arbitrary.
- **Application deduction** has a maximum limit (range of tens to 20 percent; check the latest decision). GUYUB's 0–5% plan is safe well below the limit.
- **Safety**: drivers must have an active SIM C, the vehicle has a valid STNK, SNI helmet, must not carry more passengers than capacity. Ops flow login verification — not optional. **Details (including loan motorbike cases) in §22.10.**
- **Written partnership** with every driver.

**Travel / car charter (out of v1).** Special rental transportation requires the organizer to be a licensed legal entity, a licensed vehicle that has passed periodic tests, and a driver with a general driver's license. Individuals cannot organize them, and apps that book passenger cars without permits facilitate illegal transportation. The risk is not just a warning: Dishub's action against vehicles, and much more severe — **if an accident occurs, private vehicle insurance generally does not cover commercial use, and the lawsuit leads to the individual owner of the platform who has no separation of assets**.

Replacements in v1, which remain useful for citizens:

> **Travel Directory** — list of licensed travel providers in Pangkalan & Tegalwaru: name, route, hours, telephone keypad. GUYUB **doesn't** place orders, **does** not set rates, **does** not charge commissions, and **does** accept payments. Pure information board.

The path to full booking is open through two doors: (a) GUYUB is a legal entity **and** partners with a licensed transportation company as its fleet provider, or (b) GUYUB remains as an application and a licensed transportation company is the organizer. Both need a business entity first.

**Delivery of food & goods by motorbike** does not include transportation of people and is not subject to these restrictions — GUYUB's main vertical is safe.

### 22.5 Food: the responsibility lies with the merchant, the platform's obligation remains

Halal certification, distribution permits for processed food, and food safety are merchant obligations. GUYUB's obligations:
- During registration, the merchant **certifies** that he complies with the food business provisions that apply to him (one check box + date, saved).
- **Never display claims that are not proven.** The "halal" label may only appear if the merchant uploads proof of a valid certificate/self-declaration. Presenting it without evidence is misleading information under consumer protection law — and here, also a serious breach of trust.
- Provide a problem food complaint line and Ops capabilities to disable products/merchants quickly.

### 22.6 Terms & Conditions: one mandatory correction

The previous plan (§11) said the T&C positioned GUYUB as an intermediary who was not responsible for the quality of the food. **Such formulations need to be corrected**: consumer protection law declares standard clauses that transfer all responsibility to business actors **null and void** — including them does not protect anything, and actually indicates bad faith.

The correct formulation and still protects:
- GUYUB is a **middleman** who brings together buyers with stalls and drivers; Food quality and safety is the responsibility of the stall as the seller.
- GUYUB **provides** a complaint, mediation and deactivation mechanism for violating merchants — and actually implements it.
- The limitation of liability is stated to be reasonable and specific (e.g. not covering indirect losses), not a total write-off.
- Written in §17 language: precise without sounding like a court letter.

### 22.7 Driver partnerships

Written partnership agreement (one page is sufficient) which states: the partnership relationship is not an employment relationship, drivers are free to determine working hours and may refuse orders, there are no mandatory targets, income from fares is reduced by application deductions, and procedures for terminating the partnership. Avoid things that characterize an employment relationship: mandatory hours, unilateral financial sanctions, or orders beyond the execution of orders.

Suggest (don't require) drivers to register with BPJS Employment as non-wage earners — the fees are small and it's real protection in the event of an accident, while reducing the pressure of claims on platform owners.

### 22.8 Legal checklist Phase 0 (before a single line of code is released to the public)

1. NIB via OSS in the name of an individual; appropriate KBLI verification.
2. NPWP and commission recording since the first transaction.
3. Registration **PSE Private Scope**.
4. Privacy policy + T&C (§22.6) displayed on the web profile (§20), mentioning the name of the data controller & contact.
5. User consent flow in the app (not hidden ticks) + data subject rights page.
6. Data leak notification procedure ≤ 72 hours, written in runbook §19.
7. **Commission only** account, separate from daily personal account.
8. Driver & merchant partnership agreement template.
9. Check and (if appropriate) register the "GUYUB" mark.
10. One legal consultation session to validate items 1–9 and the scope of §22.4.

### 22.9 When should an individual's status change

Three triggers — whichever comes first:
- **Want to open a travel/car charter booking** (§22.4) → required legal entity + partnership with licensed organizer.
- **Want to use a payment gateway with split settlement** → generally only for business entities.
- **Volume and exposure increases** (> 500 orders/day, or daily transaction value that makes one large dispute dangerous) → separation of personal assets becomes a necessity, not a luxury.

Until either happens, individuals are **sufficient and legal** to run GUYUB as designed in this document.

### 22.10 Driver partner verification — mandatory, flexible, and non-required

In the sub-district, many prospective drivers use **brothers or borrowed motorbikes**. If the conditions were the same as the national platform, there would be no drivers at all. But the three conditions are not equal — only one is truly inherent to the person.

| Terms | Attached to | GUYUB Attitude |
|---|---|---|
| **SIM C** | **The person** | **Absolutely mandatory, without exception** |
| **STNK** | **The vehicle** | Must be **valid and available** — **does not have to be in the driver's name** |
| **SNI Helmet** | Usage | Mandatory for drivers; passenger helmet only when taking passenger orders |

**Why SIM C is non-negotiable.** Riding without a driver's license is an offense on every trip, and if an accident occurs while delivering a GUYUB order, two things happen at once: insurance coverage is lost, and the lawsuit can go to the **personal assets of the platform owner** who do not have separate legal entities (§22.9). This is the only condition that should not be relaxed for any reason — including "just a quick food delivery."

**STNK: the vehicle is checked, not the ownership.** The STNK is attached to the motorbike, not the rider, and the law requires that the vehicle **be equipped with a valid STNK** — not a STNK in the driver's name. So a loan motorbike is **permissible**, with a light flow:

- Upload photo of STNK; The system matches **number plates** with vehicle photos.
- If the name on the STNK ≠ driver's name → fill in **owner's name & cellphone number** + check the statement *"I use this vehicle with the owner's permission."*
- Ops calls the owner **one time** during verification. One minute, and that also covers the risk of vehicle problems.
- Drivers can register **maximum 2 vehicles** and choose which one to use today — because in the village motorbikes do change.
- **Expired tax/STNK**: note, drivers are notified and given a **60 day** deadline, not immediately blocked. Our goal is safety, not to be a tax enforcer - but motorbikes whose taxes are off run the risk of being held up by a raid in the middle of delivery, and that's our problem too.

**Helmet: two levels, so it doesn't get in the way.**

| Level | For | Helmet requirements |
|---|---|---|
| **Courier** (food & goods) | the majority of drivers at the start | SNI helmet for yourself |
| **Passenger** (motorcycle taxi) | if the driver wants | + **second SNI helmet** for passengers |

Drivers can start as **courier only** and move up to ordering passengers whenever they have a second helmet. This removes an unnecessary barrier to entry — someone who just wants to deliver food doesn't need to buy a second helmet first.

**Practical suggestion**: provide 5 SNI helmets belonging to GUYUB (± Rp. 750 thousand total) which are **lent** to drivers who want to pick up passenger orders, returned when they stop. It's cheap, and eliminates the last excuse not to participate.

**What is deliberately NOT requested**: SKCK, health certificate, vehicle test, diploma, deposit, or paid uniform. It all costs potential drivers money and time for near-zero benefits on a two-district scale — and most just copy the habits of the big platforms for no reason.

**The strongest verification is not a document.** During the pilot, Ops recruits drivers **by meeting them in person** (§21.4): seeing the person, the motorbike, and the helmet all at once. In a community this size, one face-to-face meeting is more convincing than a pile of posts — and social reputation takes care of the rest.

**Data**: `guyub_driver_vehicles` (`driver_id`, `plat`, vehicle registration photo, `stnk_owner_name`, `stnk_valid_until`, `is_borrowed`, `owner_phone`, `owner_consent_at`, active) — max 2 active rows per driver; `guyub_drivers.can_carry_passenger` marks the helmet level.

---

## 23 — Postage, Couriers, and Merchants who Have Their Own Couriers

This section covers two things that were previously only mentioned in passing: **how postage is calculated and divided**, and **what happens to stalls that already have their own delivery person**.

### 23.1 Three fulfillment modes — merchant chooses

| Fashion | Who delivers | Postage goes to | GUYUB discount on postage |
|---|---|---|---|
| `ambil_sendiri` | — | — | — |
| **`kurir_merchant`** | The stall's delivery man | **100% merchants** | **Zero** |
| `kurir_guyub` | Platform drivers | Driver — **handed over cash booth upon pick-up** (§23.4) | 0% in pilot → max 10% later |

Merchants can activate more than one, and set the **order**: many stalls will choose *"use my courier first; if he's delivering, then offer it to the GUYUB driver"*. It's the most realistic hybrid mode and is supported from the start.

### 23.2 Answer directly: stalls that already have their own delivery person

**Don't fight it. Serve.** A shop that already has an introduction means it already has volume — exactly the most valuable merchants. Forcing them to use GUYUB drivers (or charging fees that aren't ours) is the quickest way to return them to messaging-via-WhatsApp.

GUYUB's position for merchants is like this: **we are the ordering platform, the delivery person is still your person.**

What they got, and the honest reason:

| Value | Why is it real |
|---|---|
| Structured order | No more incorrectly recording orders from long WA chats |
| New customers | Appears on discovery & shareable `/w/<slug>` pages (§20) |
| Neat payment | QRIS + unique nominal + automatic recap (§5h) — no need to check one by one |
| Neat menu & prices | Online catalogue, change price once, no resend menu list |
| Recap & cashier | Daily recap + cashier light (§18) |
| **Full postage** | 100% shipping costs belong to the merchant, GUYUB doesn't touch a penny |
| Clear costs | Since we don't provide delivery, the commission is **booking platform fee only** — and 0% during the pilot |

**Primary separation**: *booking platform fees* and *delivery service fees* are two different things. Merchants who deliver themselves **never** pay the second one. Combining the two into a single "commission" is a mistake that leaves merchants feeling like they are being charged for services they did not receive.

**Merchant courier in the app.** The stall deliveryman gets an account with the role `guyub-merchant-courier` — uses the same Driver app, but **only sees orders for the stall he is registered for**. For stalls where the delivery person does not want to use the application, the merchant can mark the status "being delivered" and "completed" themselves from the Merchant application. Both are valid; The important thing is that customers still see the status and estimates (§5l).

**Merchant postage rules.** Merchants set their own rules: flat rate (eg IDR 5,000 per village), per zone, or **free above a certain nominal**. The one who sets the rules is the merchant, but **the server still calculates** — the client never sends the shipping amount (Invariant 2).

**Beneficial side effect**: this mode makes delivery possible **since Phase 1, without GUYUB having a single driver**. This also minimizes the driver liquidity risk noted in §14.

### 23.3 GUYUB courier rates

Calculated from **zone matrix** (§6.7), not GPS per kilometer — it's cheaper, can't be cheated, and can be explained to drivers without argument.

**Fee figures and how to reduce them are in §35** — including fuel, uphill terrain and actual mileage. In summary: **Rp. 8,000 within villages · Rp. 13,000 between villages · additional Rp. 3,000 for climbs**, and between sub-districts culinary services are not served.

*Revision note: the previous version listed IDR 5,000 / 8,000 / 12,000. That figure is too low — §35's calculations show it doesn't cover drivers' real costs after taking pick-up distance and maintenance into account.*

**Share during pilot: 100% shipping for drivers, 0% GUYUB cut.** Attracting drivers at the start is much more important than revenue from shipping, and platform revenue already has its own path (§5m). Once stable, the maximum cut is 10% — well below regulatory limits.

**Postage is always displayed separately** from the food price on the screen and in the recap. Apart from price transparency requirements, this also makes customers understand that shipping costs belong to the delivery person.

**Not in MVP**: rain/night surcharges (complicated and protest-provoking), multi-purpose bulk orders, and tips through the system — just cash the tip directly to the driver.

### 23.4 Money flow: one payment, two recipients

**The problem is real**: the customer pays **once** for one order, but the money has to go to **two parties** — the stall (food) and the delivery person (postage). On large platforms, it's the app that accommodates and then divides. GUYUB **can't** do that: holding other parties' funds is a payment service activity that requires permission, and the owner is an individual (§2.8, §22.3).

**The answer: the stall is the money collection point, not the application.**

```
Customer  ──── bayar SEKALI (makanan + ongkir) ────►  WARUNG
                                                        │
                                    saat driver menjemput pesanan
                                                        │
                                                        ▼
                                                     DRIVER  ← ongkir tunai, di tempat

GUYUB tidak berada di jalur mana pun di atas. Komisi ditagih terpisah, mingguan.
```

So the driver **is paid by the shop**, in cash, when he comes to pick up the order — not waiting for weekly disbursement, not chasing customers for postage. The money is already in the shop drawer because the customer paid first.

This works because the order is guaranteed by the previous design: orders never enter the cooking queue before `lunas` (§2.14), so when the driver arrives, the stall **already** holds the customer's money.

**Per scenario:**

| Scenario | Customer pays | The stall accepts | Drivers accept |
|---|---|---|---|
| Take it yourself | Once: QRIS **or** cash on pick up | Everything | — |
| Merchant courier | Once: QRIS **or** cash to the stall courier | Everything (postage is also his) | Internal affairs of the stall |
| **GUYUB COURIER** | **Once: QRIS to the stall, total food + postage** | Total, then **hand over cash delivery to the driver at pick-up** | Cash delivery, on site |
| Passenger motorcycle taxi | Once: cash to driver | — | All rates |
| Tourist tickets | Once: to the destination manager | Manager | — |

**Unique amount (§5h) is calculated from the total including postage** — one QR, one number, one payment. The details still appear separately on the screen ("Food Rp. 40,000 · Postage Rp. 5,000 · Pay Rp. 45,317") so that customers know the postage belongs to the delivery person.

**Two-sided confirmation during pick-up.** The driver presses **"Delivery received"** in the application when the stall hands over the money. If he doesn't press it, the order **still goes** — the customer must not be a victim of internal affairs — but it is recorded as `ongkir_tertunda`, appearing in the stall's weekly recap and in the Ops list. Stalls that are in arrears on postage are repeatedly downgraded manually by Ops, not automatically.

**If the shop doesn't have cash**: mark "pay later", postage goes to `ongkir_tertunda` and is completed in the weekly recap. The value is IDR 5,000–12,000 per order, so the risk is small and measurable — not a reason to block orders.

**Why isn't the driver the one who charges everything to the customer?** Because that makes the driver hold large amounts of **money belonging to the stall**, and gives birth to a driver's debt book→stall, daily deposits, and "I have deposited / not received" disputes. That's the kind of chaos that kills a small, one-person-run platform. In the scheme above, what changes hands is only the postage — small, instant, and confirmed by two parties.

The consequence: **Full COD (pay everything on the spot) is not available for GUYUB couriers.** For self-pickup and merchant couriers, COD still exists according to §5g — there the cash really goes to the owner himself.

*Advanced phase route if many stalls request it*: COD with GUYUB courier is permitted **per merchant**, with a ceiling (maximum 1 active COD order per driver, max value IDR 100,000) and driver→stall deposit recorded in the application. Open only if the request is real, not before that.

**Launch postage subsidy** (§21.3): customer pays IDR 2,000 postage, the stall still hands over the full postage to the driver, and **the difference is reimbursed by the platform to the stall** on the weekly recap (not to the driver — so the driver always receives the same figure, whatever the promotion). Recorded as a marketing expense with a ceiling that stops automatically when the budget is exhausted.

**Who suffers what when failure:**

| Incident | Customers | Warung | Drivers |
|---|---|---|---|
| Cancel before the shop receives | Full money back (stall returns) | — | — |
| Cancel after cooking, at customer's request | According to the shop agreement | Bearing materials | Postage is still paid when you pick up |
| The stall canceled after the driver picked up | Full money back | Cover shipping costs that have been submitted | Still getting paid |
| `gagal_tidak_diambil` (customer does not exist) | Money not returned | No money loss | Still getting paid |

The principle is one: **the driver is always paid for the journey he has taken.** A deliveryman who has not been paid will not take the next order, and in the village the news spreads within a day.

### 23.5 Impact to data & access lenses

- `guyub_merchants`: `fulfillment_modes[]`, priority order, `own_courier_fee_rule` (average/zone/free over X), `own_delivery_zones`.
- `guyub_drivers`: `owner_business_id` **nullable** — `null` means platform driver, filled means the merchant's courier.
- `guyub_orders`: `fulfillment_mode`, `delivery_fee`, `delivery_fee_recipient` (`merchant`/`driver`), `courier_payout`, `platform_delivery_cut`, `subsidy_amount`.
- `guyub_driver_payouts`: weekly recap of subsidies & deductions (the value is small, but must be recorded).
- **Fourth lens** completes §6.4: merchant courier sees orders with the conditions `business_id` = his shop **and** `assigned_driver_id` = himself, only during active assignment. He never saw orders from other stalls, and never entered the dispatch platform pool.

### 23.6 Driver commission arrears

Drivers owe the platform the same kind of commission merchants do — the fixed per-service-order fee and the postage cut (§30.5) — billed through the **same mechanism as §5e**: weekly, unique nominal, manual verification (no gateway). This is a different debt from `ongkir_tertunda` (§23.4, stall owing the driver cash) — here the driver owes GUYUB.

**Escalation is automatic, the final action is not.** Reminders can run on a timer because they carry no risk; removing a driver from the dispatch pool can wrongly punish someone who already paid but whose transfer hasn't been manually verified yet (§5h payment verification is manual by design — the system never has certainty of non-payment on its own). So the ladder auto-fires, but the last step only **flags Ops for a one-click confirm**, never executes unattended.

| Day | Action | Trigger |
|---|---|---|
| 0 | Weekly bill issued (`GET /guyub/settlements/summary`) | Automatic |
| +1 late | In-app notification to driver | Automatic |
| +2 late | SP1 | Automatic |
| +3 late | SP2 | Automatic |
| +4 late | SP3 | Automatic |
| +5 late | Driver flagged in Ops *aging* list, pre-filled "remove from discovery" action | Automatic flag, **manual confirm by Ops** |

Total window: **≤ 5 days** from bill due date to the point Ops can act — deliberately shorter than the merchant's 2-week window (§5e) because the amounts owed per driver are much smaller and easier to reconcile weekly; not because drivers are held to a stricter standard.

- "Removed from discovery" means the driver stops appearing in the dispatch pool for **new** order matching — it never touches orders already assigned or in progress, consistent with the "orders are never blocked" principle used throughout §23.4.
- The moment payment is verified (by Ops, same manual check as §5h), the driver is restored immediately — no re-application, no waiting for the next billing cycle.
- Audited like every other money/status change (`AuditLogger`, B7): each SP step and the final flag/confirm/restore is logged, so a disputed removal has a trace.
- Data impact: `guyub_driver_payouts` gains `arrears_stage` (`notified`/`sp1`/`sp2`/`sp3`/`flagged`) and `discovery_status`; Ops Console *aging* list (already used for payment verification, §5h) gains a driver-commission tab.

---

## 24 — Buy ​​Tip (for stores that cannot partner)

**The cases are real**: franchise chicken stalls, bakery outlets, or shops whose managers answer *"must get central permission first"*. They will never become merchants in the near future, even though residents still want to order from there. The inspiration for the shape: GoShop.

**The answer: yes — as long as GUYUB doesn't pretend to be the seller.**

### 24.1 Valid form

Customer **writes down himself** what he wants to buy and from which shop; The driver acts as an errand person who is entrusted to buy. What has changed is not just the technical, but the legal position: GUYUB sells **entrustment services**, not the shop's products.

The fences that keep this clean — and shouldn't be breached for a neater look:

- **No logos, menus, product photos or price lists** from non-partnered stores. The only thing that can appear is **the name as the place** (already in `guyub_places`) — the same as saying "Alfamart in front of the market" as a benchmark address.
- **No claims of affiliation.** There are no "partners", "available on GUYUB", or badges of any kind. If someone asks, the answer is: residents entrust, drivers buy.
- **No commission from the shop.** GUYUB's income is only from entrustment services paid by customers.
- If the shop objects and asks it to stop, **stop** — the name is removed from the list of places to buy. This is cheap to do and avoids unnecessary disputes.

Displaying a dissident's menu and prices is another thing entirely: it's using someone's brand to attract traffic, and the prices you display are bound to be wrong one day — and then customers get angry at the store that didn't even know its name was used.

### 24.2 Flow

1. Customer selects **"Purchase Delivery"** → selects a shop from the list of places → writes a shopping list (free text, max 500 characters) → estimates the total expenditure → selects a delivery point.
2. The server calculates **postage** (zone matrix) + **delivery service** and displays the estimated total. Clearly marked: *"The price of the goods follows the original receipt — may differ from the estimate."*
3. Orders are offered to drivers whose bailout ceiling is sufficient**; drivers are free to refuse.
4. Driver buys, **photographs receipt** (mandatory), then marks shopping complete. The shopping value is filled in from the receipt.
5. The goods are not available / the price is much different → the driver calls the customer; Customers can **cancel the remaining amount** or **cancel the entire order** (drivers are still paid for entrustment services + postage when they have shopped).
6. Driver delivers; customer pays **once, in cash**: receipt value + postage + entrustment service.
7. A photo of the receipt is saved in the order history as proof — this is what prevents "why is it expensive" disputes.

### 24.3 Money & bailout ceiling

Drivers bail out first, so this is the only place in GUYUB where drivers bail out capital. Therefore the fence is tight:

- **Default ceiling IDR 50,000** per driver, increased by Ops manually based on track record (max IDR 200,000).
- **Only one active buy-to-buy order** per driver.
- Only for customers with a good track record — **reused §5g reliability score**, not a new mechanism. New customers cannot use purchase orders.
- Estimated spending above the ceiling → order rejected by the system before being offered.
- The difference between the receipt and the estimate is above 20% → the driver must call first before paying.

**Delivery services**: IDR 5,000 for purchases up to IDR 100,000, IDR 8,000 above. Flat, easy to explain, no calculator needed.

The money remains a one-time payment and remains cash to the driver — consistent with §23.4, and **the platform still does not touch the funds**.

### 24.4 What should not be entrusted

Hard and prescription drugs, alcoholic beverages, cigarettes for underage buyers, gold/jewelry, items of value above the ceiling, live animals, and anything illegal. The list appears on the screen before the customer writes the order, and **drivers can always refuse** without penalty — refusals for this reason do not lower their acceptance ratio.

### 24.5 Side effects for merchant acquisition

When a store sees that people's orders keep pouring in via drop-in, the conversation with the manager changes: from "will you try the new app" to "last month there were 40 orders to your place from this app." That's proof of demand, and proof is more convincing than presentation.

Use it as **data to persuade**, not as pressure. If they still refuse, the delivery service will continue and residents will still be served.

**Phase 3**, with the services vertical — because it requires drivers that are already running and customer reliability scores that already have data.

---

## 25 — Early Stage Infrastructure Specifications (T0)

Concrete, not directive. This is what was installed on the first day.

### 25.1 Machines

| Components | Specifications | Notes |
|---|---|---|
| **VPS** | 2 vCPU · 4 GB RAM · 80 GB NVMe · Ubuntu 24.04 LTS | Choose a provider with a Jakarta/Singapore location — latency to Karawang < 30 ms |
| **Postgres** | **Managed**, smallest tier with **PITR** | May be slightly more expensive than self-host; what was purchased was PITR + failover, not CPU |
| **Object storage** | S3-compatible, 10 GB free quota | Product photos, proof, purchase receipt |
| **CDN/proxy** | Free Cloudflare | Cache, basic rate limit, DNS TTL 60 seconds (for fast switching, §19.4) |
| **Push** | FCM | Free |
| **Tracking error** | Free Sentry tier | |
| **Uptime monitor** | Free service **outside VPS** | Monitors that die along with the server are useless |

Domain + renewal: ± IDR 200 thousand/year.

### 25.2 Container arrangement (one `docker-compose.yml`)

| Services | Image | Sizing notes |
|---|---|---|
| `nginx` | `nginx:alpine` | TLS Termination in Cloudflare; nginx simply serves HTTP |
| `api` | `php:8.3-fpm-alpine` | **4 workers** PHP-FPM (`pm=static`) — enough for 5–10 req/sec peak |
| `worker` | same image, `queue:work` | **1 process**; dispatch, notifications, aggregate popularity |
| `scheduler` | same image, `schedule:work` | 15 minute aggregate job, daily recap, backup |
| `redis` | `redis:7-alpine` | `maxmemory 512mb`, `allkeys-lru` — cache, queue, live location |

Postgres is **not** running on this VPS at T0 (used the managed one). If the budget is very tight and Postgres is self-hosted, it is mandatory to install WAL archiving to object storage — without it, the 5 minute RPO in §7.1 is not achieved and the numbers are a lie.

### 25.3 Basic sizing calculations

300 orders/day concentrated in two peaks (lunch & evening hours) ≈ **5–10 requests/second** at peak, including active order status polling. One PHP process handles requests in ± 80 ms → 4 workers give a theoretical capacity of ± 50 req/sec. The margins are wide, and that's intentional: it's not the CPU that's expensive, it's the nights spent to increase capacity during peak hours.

The largest read traffic (discovery, stall pages) does not touch PHP at all because it is served by the edge cache of the public projection (§6.3).

### 25.4 Estimated monthly costs

| Post | Estimate |
|---|---|
| VPS 2 vCPU / 4 GB | Rp. 120–200 thousand |
| Postgres managed + PITR | IDR 0–350 thousand (depending on the applicable free tier) |
| Object storage | IDR 0 (in free quota) |
| Cloudflare, FCM, Sentry, uptime | Rp 0 |
| Domain (divided by 12) | Rp. 20 thousand |
| **Total** | **Rp 140–570 thousand** |

Still within the hard limit of IDR 500 thousand (Non-negotiable 11) if Postgres managed is in the free tier; otherwise, this is the only post that should cross the line — because what is being purchased is recoverability, not convenience.

### 25.5 Which is intentionally NOT installed in T0

Kubernetes, service mesh, Prometheus + Grafana, ELK/Loki, paid APM, 24 hour permanent staging, second CDN, and load balancer. They all have a place later — in T0 they just add costs, failure surfaces, and things to learn when you should be visiting the stall.

Monitoring T0 is just four numbers (§11): orders/hour, dispatch failure, p95 API, error rate — viewed from one simple page.

### 25.6 Object storage & retention budget

Concerns about input audio (§28) are reasonable, so let's calculate — not guess.

**Audio: Opus mono 16 kbps, 16 kHz, limited to 60 seconds** → maximum **± 120 KB** per recording, and in fact most voice messages are 15–25 seconds ≈ 40 KB. Recording is done directly in that format **on cell phone**; the server never does transcoding (that would eat up the CPU we paid for).

Estimated pilot volume (150 orders/day, 40 merchants):

| Object type | Volume/month | Size/month | Retention |
|---|---|---|---|
| Photo proof of handover | ± 900 (20% orders) | ± 72 MB | **90 days** |
| Photo of purchase receipt | ± 300 | ± 24 MB | **90 days** |
| Product photos | slow growing | 80–400 MB total | as long as the product lives |
| Input image | ± 80 | ± 6 MB | 90 days |
| **Input audio** | **± 120** | **± 12 MB** | **90 days** |
| Photo proof of **payment** (§5h) | ± 450 (30% orders QRIS) | ± 36 MB | **12 months** — proof of dispute & tax records |

**Audio is about 3% of total storage.** What really swells are **photos** — receipts and product photos, 10–30 times larger. So his worries were right in the direction, just misdirected; and with retention above, the first year total remains **under 1 GB** — still within the 10 GB free quota.

**Installed controls (all automated, not manual discipline):**

1. **Lifecycle rules in object storage per prefix** — `feedback-audio/`, `feedback-images/`, `proofs/`, `receipts/` are automatically deleted at the age of 90 days. No manual work, no crons you can forget to run.
2. **Audio is a conveyance, not a record.** When Ops listens, he writes a 1–2 sentence summary to `guyub_feedback.text`. The summary lasts 12 months; the audio is not necessary.
3. **Hard limit in recorder**, not in server validation: 60 seconds, mono, Opus. Users cannot send larger ones.
4. **Quota 5 posts/day** per user (§28.4).
5. **Photo compression on mobile**: max 1024 px, WebP, ≤ 80 KB. One photo per proof — not a gallery.
6. **Free egress** (R2 or equivalent). This is important: on storage that charges egress, the real cost is not storing photos, but displaying them over and over again.
7. **One number in the Ops Console**: GB used, with warning at 60% free quota.
8. Orphaned objects are cleaned up when products/orders are deleted — don't wait for storage to be full to find them.
9. **Media is excluded from the second backup copy** (§19.2). What is mandatory to have two copies on different providers is the database; photos and audio are just one copy away — losing them hurts, but isn't as platform-killing as losing order data.

**What not to do**: paid automatic transcription. At 30 recordings/week, listening alone took ± 15 minutes/week and the results were better than transcripts. If the volume becomes hundreds per week, run a local transcription model on the VPS during off hours — rather than sending people's voices to a third-party service.

### 25.7 When to upgrade to T1

Triggers are numbers, not feelings (§7.2): CPU > 60% for 15 minutes in peak hours, p95 > 400 ms for 3 consecutive days, or DB connection > 70% pool. The first step up is always **adding RAM/vCPU on the same machine** — not directly adding a machine, as one larger machine is much cheaper and simpler than two machines and a load balancer.

---

## 26 — Pre-Go-Live Testing Scheme

The goal is not "all green tests", but **no money, data, or trust lost in the first week**.

### 26.1 Test layers

| Layers | Contents | When |
|---|---|---|
| **Units & features (API)** | Per module in `berdikari-api/tests/Feature/` follows an existing pattern | Every PR |
| **Units & widgets (Flutter)** | ViewModel, repository, main widget for each feature | Every PR |
| **Integration (Flutter)** | Full flow: register → order → pay → receive; merchant accept → ready; delivery driver → done | Before each tag |
| **Contract** | The client model is tested against the API response seeded from the local Docker | CI daily |
| **Light load** | k6/artillery: 50 concurrent users, 10 minutes, target p95 < 400 ms | Before go-live & each phase |
| **Recovery** | Restore exercise §19.3 with time recording | Before go-live, then monthly |

### 26.2 Tests are mandatory because this involves money & trust

This is not a "nice to have" — failure here blocks the release:

1. **Rejection path RBAC** (DNA §9j.8): `viewer`/customer/driver/merchant courier tries to access data to which he has no rights → 403. Includes **fourth lens** (finding #28): Stall A courier tries to open Stall B's order.
2. **Idempotency**: send `POST /orders` twice with the same `Idempotency-Key` → one order. Repeat for payment, ticket exchange, and `accept`.
3. **Value authority**: send fake `total`, `delivery_fee`, and `subtotal` from client → server ignores them completely.
4. **Paid status**: customer tries to mark `lunas` → rejected (finding #12).
5. **Operation hours**: checkout at 20.45 for stalls with an order limit of 20.40 → 422 with the correct order, **the basket is not lost** (finding #22).
6. **Unique nominal**: two active orders at the same shop cannot have identical nominal amounts.
7. **Shipping**: An empty `courier_paid_at` does not prevent the order from running, but appears in the recap (finding #30).
8. **Merchant message**: attempted to save link and account number → rejected (finding #24).

### 26.3 Field testing — what the emulator cannot replace

- **Native low-end device**: Android 10–12, 2–3 GB RAM, 360 dp screen. If it's smooth here, it's smooth everywhere.
- **Bad signal**: airplane mode in the middle of checkout, network limited to 2G, switching from WiFi to cellular when sending orders. What to check: no duplicate orders, no white screens, countdown continues.
- **On-site test**: one real loop in Pangkalan and Tegalwaru — including points where the signal was poor. Maps and listings are verified in the field, not from a screen.
- **Order alarm**: Merchant's phone in pocket, screen off, silent mode → is the order still audible? This is the most important test on the entire list (risk number one in §14).
- **Battery**: 4 hours online driver → reasonable battery drain and no hanging wake-lock.

### 26.4 Closed pilot (2 weeks, before any promotion)

3 stalls · 2 drivers · 10–15 known residents, using **real production** for real money but no promotions. The goal is to find things that don't show up on the test: confusing language, missed steps, unexpected habits.

Collect just three things every day: failed orders and why, questions asked by merchants/drivers, and how long it took merchants to respond. Daily fix. **The input channel (§28) should be on from day one of the pilot** — this is where it is most useful.

### 26.5 Go / No-Go Criteria

Public release only if **everything** is met:

- [ ] All tests of §26.2 pass.
- [ ] Restore exercise completed **within** RTO, recorded.
- [ ] Pilot closed for 2 weeks without money incident (wrong billing, double order, money didn't arrive).
- [ ] ≥ 15 verified & active stalls (§21.1); all of them fill operating hours.
- [ ] Legal checklist §22.8 complete.
- [ ] Copy reviewed against §17 — read aloud, nothing sounds like an official letter.
- [ ] Credential custody + printed backup code (finding #16).
- [ ] Tested release rollback plan: one true rollback to the previous tag in staging.

### 26.6 Bug bars

| Class | Example | Rules |
|---|---|---|
| **Blocker** | Wrong money, cross-tenant leaks, lost data, duplicate orders, orders not heard by merchants | Not released. Point. |
| **Seriously** | Dead end flow with no way out, wrong status, notification not arriving | Release only when there is a known detour Ops |
| **Normal** | Display misses, stiff copy, rough animations | Can be released, enter the repair list |

---

##27 — Visual Design Guidelines (so it doesn't look AI-generated)

These concerns are justified: the “AI slop” look isn't just a matter of taste — it makes the app feel **not from here**, and citizens immediately feel distant.

### 27.1 Characteristics to avoid

Which makes an interface directly read as generator output:

- **Purple–blue** (or purple–pink) gradient across heroes, cards and buttons at once.
- **Glassmorphism and shadows everywhere** for no functional reason.
- **All angles `rounded-2xl`**, all cards the same size, uniform spacing — no hierarchy, everything shouts equally loud.
- **Emoji as illustration** and icons from several different families mixed.
- **Generic 3D illustrations** (faceless people, floating boxes) that can be used by any application in the world.
- **Stock photo** food from abroad for stalls in Pangkalan.
- **Five accent colors** are used together because they "make life".
- **Default typography** chosen for no reason, size is only two levels.
- Example content is *lorem ipsum* or "Product 1, Product 2".

### 27.2 Principles that make it feel like people make it

1. **Start from the original content, not the layout.** Use the original stall name, original menu, original prices, original village name from the first sketch. The design born from "Nasi Uduk Bu Encum · Rp. 8,000 · Dusun Cikutra" looks different from the one born from "Product Name · Rp. XX.XXX".
2. **Rooted in place.** The palette is taken from things that are actually there — the colors of stall tarpaulins, carts, banana leaves, motorcycle taxi uniforms — not from a trend palette. One strong accent color, not five.
3. **Bold hierarchy.** One dominant element per screen. Big prices, big stall names, the rest gives way. Uniformity is a characteristic of generator output; decisiveness is a characteristic of human decisions.
4. **Every effect must have a reason.** Shadows indicate something floating on top of another — not decoration. If you can't explain why a gradient is there, delete it.
5. **Self-drawn blank illustrations**, simple, one style — empty plate, motorbike, shopping bag. Better one typical clunky image than a generic perfect 3D illustration.
6. **Human imperfections** are allowed: angles that are not all the same, one card that is deliberately larger, greetings that change according to the hour. That's a handprint.

### 27.3 Photos — the biggest determinant, and often overlooked

This application will look as expensive or as cheap as **food photos uploaded by merchants**. No matter how good the design is, it doesn't save a catalog containing dark and slanted photos.

Therefore, photos are the product's work, not the merchant's own business:
- One page guide in the Merchant app: **daylight near the door, plain background (tray/wood), shot from above, one shot only, no filter**.
- During registration (§21.4), Ops **helps photograph** the main menu of each stall. One hour per stall, and the results are felt throughout the application.
- Ratio and cropping are forced to be uniform by application; merchants don't need to think about it.
- No photos → show neatly designed typography cards, **not** gray placeholders or stock photos.

### 27.4 Process

- Run design tasks via **`design`** mode in `.agents/` — the pipeline requires **cited inspiration sources** (real images/URLs), which exactly prevents designs from being born out of average internet style.
- Moodboard from real references: Indonesian applications that are used daily, shop packaging, shop signs in Pangkalan. Not from the "UI inspiration" collection.
- Set tokens (color, typography, spacing, radius) **once** in `guyub_ui`, then stick to them. Consciously constructed consistency looks different from unintentional uniformity.
- You can learn from GoFood about flow patterns, **don't copy the appearance** — imitations always read as imitations.

### 27.5 Test "neighbors"

Before a screen is considered complete, show it to 5 citizens who are not heavy app users. Three questions:

1. What is this application for?
2. Try ordering fried rice from here.
3. Which person do you think this was made by?

If the third answer is "it looks like it's from the outside" or "it looks like a big application", the design hasn't taken root yet. If they say the name of their own place — that's a sign that it's correct.

---

## 28 — Feedback & Suggestions Channel

In pilots, user feedback is the most valuable source of information we have — more useful than any dashboard, because what goes wrong at the start is almost always something we don't think about. **Entering Phase 1**, not the hardening phase: in fact in the first weeks the most things need to be repaired.

### 28.1 Two channels should not be mixed

| Channel | For | Handling |
|---|---|---|
| **Order complaint** (already available, §5f) | Tied to one order: wrong food, didn't arrive, money problems | There is a deadline, there is evidence, there is a decision Ops |
| **Feedback & suggestions** (this section) | Confusing app, some errors, feature suggestions, general complaints | There is no deadline, but **must read and answer** |

Mixing the two makes complaints money sink among the proposed features — and that's a costly mistake.

### 28.2 Forms — designed for people who don't like typing

One screen, opened from anywhere via the **"Input"** menu and from a link on each screen failed.

1. **Quick choice in the form of a sentence** (not a technical category): *There's something that makes you confused · There's an error · I have a suggestion · About stalls or drivers · Others*. Selecting one of them is enough to send — the text box can be empty.
2. **Free story box**, max 1,000 characters, with sample content as a placeholder.
3. **Record voice, max 60 seconds.** This is not a complement — here people are much more comfortable talking than typing, just like voice messaging habits on WhatsApp. This feature will likely generate more useful input than its text box counterpart.
4. **Attach screenshot** (optional, 1 image).
5. Check box **"No need to contact, just want to let you know"**.

**Technical context is also sent automatically** and does not need to be asked: application version, cellphone model, Android version, last screen, and `order_id` when the form is opened from the order screen. This is what differentiates actionable reports from "application errors".

**One line warning** above the text box: *"Don't write your PIN or account number here."*

### 28.3 Closing the loop — the part that fails most often

Feedback that is never answered makes people stop giving feedback, and after that we are blind.

- **Humanized automatic reply** when sent: *"Thank you, we've received it. We read everything."*
- **Visible status** in the app: Accepted → Read → Actioned / Closed (with short reason).
- **"News from GUYUB"** — short announcement in the app every time there is a change born from user input: *"Some of you said the pay button was too small. Now it's bigger. Thanks!"* Cheap to make, and in a community this small the effect is big: people know the sound is coming through.
- For feedback from merchants & drivers, follow up via **phone or WhatsApp Ops** — faster and more appreciated than in-app replies.

### 28.4 Limits & protections

- Maximum of **5 posts per user per day**; audio ≤ 60 seconds / 1 MB; image ≤ 1 MB, compressed on cellphone.
- **Input is never displayed to other users.** It is only read by Ops. This avoids the need for public moderation as well as liability for third party content.
- Uploads use the same path as proof of order: presigned, object name server generated, type & size validated (finding #9).
- Technical context **should not** contain tokens, phone numbers, or cart contents — only version, device, screen, and order id.
- **Audio & images: 90 day retention** with automatic deletion (§25.6). What survived the 12 months were **text summaries** that Ops wrote while listening — audio is a conveyance, not notes. After that the summary was deleted (PDP, §11).
- Recordings are made directly in **Opus mono 16 kbps** on the cellphone, limited to 60 seconds by the recorder; the server never performs transcoding.

### 28.5 Side Ops

Input list in Ops Console with role filters (customer/merchant/driver), quick selection, status, and search. Each entry can be tagged (`bug`, `usul`, `bingung`, `mitra`) and have its status changed. Those marked `bug` and involving money **move automatically** to the priority list — instead of waiting to be read one by one.

A realistic rhythm for one person: **read everything every day, answer what is necessary, and once a week write one "News from GUYUB"**.

### 28.6 Data & API

- `guyub_feedback`: `user_id`, `role`, `quick_choice`, `text`, `audio_path`, `image_path`, `context` (JSON), `no_contact`, `status`, `tags[]`, `handled_by`, `resolved_at`.
- `guyub_feedback_replies`: Ops + channel reply (in-app / WhatsApp / phone).
- API: `POST /guyub/feedback`, `GET /guyub/feedback/mine`, Ops: `GET /guyub/ops/feedback`, `PUT /guyub/ops/feedback/{id}`, `POST /guyub/ops/feedback/{id}/reply`, `POST /guyub/ops/announcements`.
- Permission: `guyub_feedback.create` (all authenticated users), `guyub_feedback.view` & `guyub_feedback.handle` (Ops).

### 28.7 Measures of success

| Metrics | Targets |
|---|---|
| Incoming entries per week (pilot) | ≥ 10 |
| Used object storage (year 1) | < 1 GB (§25.6) |
| Feedback read within 24 hours | 100% |
| Answered entries (excluding "do not contact") | > 80% |
| "News from GUYUB" published | 1×/week during pilot |

---

## 29 — Communication while the order is in progress

**Short answer: necessary — but not free text chat. What is installed is "Quick Message".**

### 29.1 Why not full chat (at least not now)

Chats like GoFood solve real problems: cellphone numbers don't need to be revealed, communications are recorded for disputes, and users don't switch apps. All of that is true. But for GUYUB, the costs are not worth the results:

- **Driver is driving.** Typing while dropping off is slow and dangerous. In the field, drivers will call — chats that have been painstakingly created will only gather dust.
- **Chat creates hope of being answered.** Chat sent and then left behind is more damaging than no chat at all. For a platform whose Ops is one person, that's a self-growing service debt.
- **Realtime is a cost.** Good chat requires realtime transport; on a PHP monolith that means tighter polling or additional pub/sub — exactly the kind of expense that §7.4 avoids.
- **Free text chat is a new fraud surface** — same as merchant messaging (finding #24), but harder to moderate because the conversation is live.

### 29.2 Installed: Quick Messages (Phase 2)

Ready-made replies, one tap, per role — no free text box:

| From | Example message |
|---|---|
| **Driver → Customer** | "I'm already in front" · "Which house is it?" · "I'm taking orders" · "There's a bit of traffic jam, please wait" · "Please pick up the phone" |
| **Customer → Driver** | "How far are you now?" · "Leave me at the post" · "I'm out now" · "Please call me" |
| **Merchant → Customer** | "Ready, being made" · "This material is out of stock, can I replace it?" · "A little longer huh" |

This solves almost all communication needs while the order is in progress, and is actually **better** than chat for this context: it can be sent with a tap while driving, no typing required, no moderation required, and cannot be used to offer transfers to other accounts.

**Zero additional cost**: instant messages are saved as events on the order and appear on the status screen — using existing FCM + polling lines. Multiple lines of text per order, meaningless for storage.

**Limit**: only while the order is active, maximum 10 instant messages per order per party, automatically closed 1 hour after order completion.

### 29.3 Phones are here to stay — and be honest about their limits

The **Phone** button remains available while the assignment is active, and the number remains lost after the order is completed (§6.4). Two cheap little hardeners:

- Numbers **are not displayed as text** that can be copied; there is only a button that calls the dialer.
- Every time a number is opened, an audit is recorded.

**Mask calling** (intermediate number) is the only way to truly hide a number, but it costs per minute through the phone provider — not reasonable for individual owners today. Enter the waiting list, opened if GUYUB has become a business entity **or** there are repeated reports of disturbances, whichever comes first.

But we have to be honest: the hardening above **doesn't** make it impossible to collect numbers — the call log on the driver's cellphone still stores them, and people with bad intentions will still ask for WhatsApp numbers in chat even if we have chat. So what really protects is not technical concealment, but rather: **impermanent exposure, recorded access, and real sanctions for abuse** — plus the fact that in these two sub-districts everyone knows each other, which makes abuse much more expensive for the perpetrators than in the city.

### 29.4 When is full chat considered

Open free text chat only when data shows instant messages are not enough: more than 20% of orders end in phone calls **and** there is a steady stream of "unreachable" complaints. When that happens (after v1.0 at the earliest), the form is restricted:

- Only while the order is active; Closes automatically 1 hour after completion.
- No attachments, no voice calls inside the app.
- **Same content controls as finding #24**: links and long strings of numbers are blocked.
- History is kept 90 days for dispute resolution, then deleted.
- No chat between customer and merchant outside the context of the order — that's the door to moving transactions off the platform.

---

##30 — The Platform Economy: Does It Benefit Creators?

This section is written in numbers, including ominous numbers. The owner and creator of GUYUB are the same person, so **the biggest cost of this project isn't the servers — it's the time itself**, and that has to be accounted for.

### 30.1 Actual costs

**Development to v1.0** (solo, with `berdikari-api` which already provides IAM, tenancy, Catalog, Finance):

| Phase | Estimated hours |
|---|---|
| 0 — Foundation | 80–120 |
| 1 — Culinary (pick up yourself + merchant courier) | 200–280 |
| 2 — GUYUB Courier + Driver application | 200–250 |
| 3 — Services + Purchase | 120–160 |
| 4 — Ticket + Light cashier | 150–190 |
| 5 — Money, Premium & Ops | 130–170 |
| 6 — Hardening & release | 90–120 |
| **Total** | **± 1,000–1,300 hours** |

At a reasonable freelance rate for this capability (Rp. 75–150k/hour), that's **Rp. 75–195k opportunity cost**. That number doesn't appear in any accounts, but it's real.

**Monthly operating costs** (on 150 orders/day): infra IDR 140–570 k (§25.4) + **Ops time 40–50 hours/month** — partner verification, complaints, reading feedback, weekly commission billing, manual highlight. It's the equivalent of a part-time job, not a casual side job.

### 30.2 Income, three stages

Assumptions: average order value IDR 35,000; **80% commission billing rate** (because commission is billed, not automatically deducted — §5e; this is a weak point that must be acknowledged).

| | Pilot (months 1–6) | Growth (months 7–12) | Established (2nd year) |
|---|---|---|---|
| Orders/day | 150 | 200 | 400 |
| GMV/month | IDR 157 million | IDR 210 million | IDR 420 million |
| Commission applies | **0%** | 3% → 5% | 5% |
| Commission received (80%) | Rp 0 | ± IDR 8.4 million | ± IDR 16.8 million |
| Premium + add-ons | ± Rp. 600 thousand | ± Rp. 700 thousand | ± IDR 1.2 million |
| Postage discounts & entrustment services | Rp 0 | ± Rp. 500 thousand | ± IDR 1.5 million |
| Infra | −Rp 500 thousand | −Rp 1.5 million | −Rp 3 million |
| **Net/month** | **± Rp. 100 thousand** | **± IDR 8.1 million** | **± IDR 16.5 million** |

### 30.3 The answer, without wrapping

**During the pilot: unprofitable, and that was by design.** The first six months were practically volunteer work — 0% commission (§5e) was an acquisition decision, not an oversight. If this is not accepted from the start, the project will feel like a failure even though it is proceeding according to plan.

**After commission is on: yes, comparable — subject to volume requirements.** At 200 orders/day, net IDR 8 million/month for ± 45 hours Ops equals **IDR 180 thousand/hour**, above the average freelance rate. The opportunity cost of development (take the middle, IDR 130 million) is returned within **± 16 months from the commission on** — around the 22nd month from the first line of code. That's a normal schedule for a real venture, not a bad sign.

**What makes it not comparable**: if the volume is stuck below **100 orders/day**. At 80 orders/day with 5% commission, revenue is ± IDR 3.4 million/month for almost the same Ops load — and the development costs never really come back. **Economic viability threshold: 120 orders/day.** Below that, GUYUB is a social project with server bills, and that's a valid choice — but one that must be chosen consciously, not realized later.

### 30.4 Paths that truly benefit the creator

One district will never make you rich. What makes this 1,000 hour job worth much more is the **code that is used repeatedly**: GUYUB for other sub-districts, other districts, operated by BUMDes, cooperatives, or other people — with the code owner as the provider.

The calculation changes completely: 10 operators × IDR 1 million/month subscription = IDR 10 million/month **on top of shared infrastructure**, without increasing the daily Ops burden (local operators who manage their area).

**What needs to be done now to open that path — and only this:** don't build multi-carriers now (it's wasteful), but **don't close the path**. All of the following must be **data, not constants in code**: platform name & brand, zone & venue list, rate matrix, commission & package figures, Ops contact number, and legal text. If these six things have been data since Phase 0, adding layers of operators later is a medium task. Otherwise, it becomes a rewrite.

### 30.5 Application fee schedule

Announced to merchants **30 days before** it takes effect, via direct visit — not in-app notification.

| When | Order commission | Postage deductions | Entrustment services | Premium |
|---|---|---|---|---|
| Months 1–6 (pilot) | **0%** | 0% (driver 100%) | 0% (driver 100%) | IDR 30 thousand/month, sold manually since Phase 3 |
| Months 7–9 | **3%**, max IDR 3,000/order | 0% | Rp. 1,000 | IDR 30 thousand/month |
| Month 10+ | **5%**, max IDR 3,000/order | max 10% | Rp. 1,000 | IDR 30 thousand/month |

**The limit of IDR 3,000 per order** is intentional: on orders of IDR 150,000, the 5% commission feels like a punishment for stalls that have just received large orders. The upper limit means merchants never feel penalized for success.

**Correction to §5j** — the previous premium plan promised *0% commission*. That is wrong and must be changed: a merchant with 20 orders/day generates a commission of ± IDR 1 million/month, while his subscription is only IDR 30 thousand. The truth: **premium provides 2 percentage points lower** commissions (3% when the typical rate is 5%), not zero. Stay attractive to high-volume merchants, without hurting your best customers the most.

### 30.6 What must be monitored every month

Four numbers, one page: orders/day, net revenue, **Ops hours used**, and revenue per Ops hour. That fourth number is the most honest — once it drops below your freelance rate for three months in a row, something has to change: automation, price, or scope.

---

## 31 — Codification of Error Codes & Error Traces

The goal is one: when someone calls and says *"the application has an error"*, you can find the cause in minutes — not hours.

### 31.1 Code form

```
GYB-<AREA>-<KELAS><NNN>
```

**AREA** (3 letters, following module §6.2):

| Code | Areas |
|---|---|
| `AUT` | Auth, PIN, OTP, token |
| `MKT` | Marketplace, discovery, public projection |
| `MRC` | Merchant, operating hours, menu, packages |
| `ORD` | Order & status machine |
| `PAY` | Payments, unique amounts, commissions, bills |
| `DLV` | Dispatch, driver, courier, postage |
| `SHP` | Buy it |
| `TKT` | Tourist tickets |
| `FBK` | Feedback & suggestions |
| `INF` | Infra: storage, FCM, DB, cache |
| `APP` | Client side (Flutter) |

**CLASS** (first digit) determines how to respond:

| Class | Meaning | Response |
|---|---|---|
| `1xx` | Invalid input | Friendly message to users, not logged as an error |
| `2xx` | Authorization denied | Noted; **rises in priority** when touching cross-tenant |
| `3xx` | Business rules reject | Friendly message + explanation; this is **not** damage |
| `4xx` | External integration fails | Auto retry; note if it repeats |
| `5xx` | Unexpected / bug | Sentry + alert to owner |
| `6xx` | Data mismatch | **Always** warning — this is the most dangerous class |

**Examples that are directly used:**

| Code | Meaning |
|---|---|
| `GYB-ORD-301` | The shop is currently closed |
| `GYB-ORD-302` | Past the last message limit (§5k) |
| `GYB-ORD-303` | Invalid state transition for this actor |
| `GYB-ORD-304` | Product out of stock |
| `GYB-PAY-301` | Unique nominal clashes, recreated |
| `GYB-PAY-302` | Payment claims from unauthorized actors (finding #12) |
| `GYB-PAY-303` | Payment deadline exceeded |
| `GYB-DLV-301` | The bailout ceiling was exceeded (finding #31) |
| `GYB-DLV-302` | No drivers available after 5 rounds |
| `GYB-DLV-601` | `courier_paid_at` is empty even though the order is complete (§23.4) |
| `GYB-MRC-201` | Merchant courier tries to open another stall's order (finding #28) |
| `GYB-AUT-101` | Wrong PIN |
| `GYB-AUT-401` | OTP sending failed |
| `GYB-INF-401` | Object upload failed |
| `GYB-APP-501` | Render failure / unexpected condition on client |

**Rules that keep this codification useful:**
- Code **never changes meaning**. Codes that are no longer used are archived, **not recycled**.
- Single source of truth: `berdikari-api/config/guyub-errors.php`, and the Dart constants in `guyub_core` are **generated from that file** — not retyped.
- Each code has one line of explanation and one line of language copy for the user (§17). Without it, the code isn't finished.

### 31.2 Request trace (what makes this code traceable)

Code alone is not enough — it must be able to be linked to a real event.

- Middleware creates **`request_id` (ULID)** on every request, returned as header `X-Request-Id`.
- **The last 5 characters displayed to the user** on the failure screen: *"Oops, there's a problem. If you want to report it, call this code: **7F3K2**."* This is the bridge between friendly copy (§17) and searchability — the user doesn't need to know what it is, just say it.
- `request_id` logs **every log line** on that request, and becomes a tag in Sentry.
- Input channels (§28) **attach automatically**, so user reports point directly to the correct log.

### 31.3 Log form

One JSON line per event, with fixed fields:

```json
{"ts":"2026-07-30T13:05:11+07:00","level":"error","code":"GYB-PAY-302",
 "request_id":"01J...7F3K2","user_id":1183,"role":"guyub-customer",
 "business_id":42,"order_type":"kuliner","order_ref":"260730-847293","route":"POST /guyub/orders/{id}/paid",
 "msg":"klaim lunas dari customer ditolak","ctx":{"status":"menunggu_verifikasi"}}
```

**What is not allowed to log in, without exception**: cellphone number, PIN, OTP, token, message body, full address, and entire request body on the auth/payment route (§11, Medium findings on `security.md`). What is recorded is **id**, not the person.

### 31.4 Which one wakes the owner

| Priority | Code | Treatment |
|---|---|---|
| **Soon** | any `6xx`, `GYB-MRC-201`, `GYB-PAY-5xx` | Notification to owner's cell phone — money, tenant leaks, data mismatch |
| Daily | `5xx` else, repeated `4xx` | Checked when reading input |
| Not at all | `1xx`, `3xx` | This is normal behavior, not a malfunction. Only counts as a metric |

The threshold is intentionally loose: only **four classes** are allowed to wake people up. A system that beeps too often will be ignored, and that is more dangerous than no alerts.

---

## 32 — Transaction Number & Queue Number

### 32.1 Transaction number — required, and specific reasons

**Necessary.** Not because of the neatness of the database (ULID already handles that), but because humans have to **reference** the order without spelling out a ULID: an Ops phone call, matching the weekly commission recap, a log lookup. UUID cannot be typed or read back reliably.

**It is not shouted out loud.** That job belongs exclusively to the queue number (§32.2) — the transaction number only ever appears on a screen or in a recap/log, so it doesn't need a letter alphabet chosen to survive being spoken over a counter. Plain digits are simpler to generate and free of any letter-confusion concern.

**Form:**

```
<YYMMDD>-<6 digit angka>
```

Example: `260730-847293` · `260730-104857` · `260730-556209`

**No type prefix (`ORD`, `OJK`, `TTP`, `TKT`, `TAG`, or any letter).** Nothing about this number is ever read aloud — only the queue number (§32.2) is — so there is no reason to spend characters distinguishing order type in the string itself; `order_type` already exists as its own column.

**Formation rules:**
- **Numeric only (0-9)**, 6 digits, randomly generated.
- Unique per (type, date); created with `unique constraint` + retry if conflicting. The space is 1,000,000 combinations per day per type — far more than enough for two sub-districts.
- Because the type prefix is gone, the same 6-digit string can legitimately appear on both a culinary order and an ojek order on the same day (they're different rows, disambiguated by `order_type`). Any screen that lists orders across verticals together (Ops recap, log) must show `order_type` alongside the number — never the bare number alone — to stay unambiguous.
- **ULID remains the primary key**; This number is a separate indexed column for humans.

**Where it appears**: order status screen, merchant order card, notifications, completion summary, commission & shipping recap, log (`order_ref`, §31.3), and Ops page.

**This is different from the unique nominal (§5h) and does not replace it.** The unique nominal solves the bank statement reconciliation; Transaction numbers solve human communication. Both remain.

### 32.2 Queue number — necessary, but different form

**Required**, and the correct **not** transaction number. When someone comes to the shop to take an order, what he says is *"order number seven"* — not "O-R-D two-six-zero-seven-three-zero-K-seven-Q-M".

**Form**: **daily sequence number per merchant**, starting from 1 each day of the first open session.

- Awarded when the merchant **receives** the order (not when the order is created) — so that canceled orders don't leave holes in the order.
- **One sequence for all channels.** This is the important part: once the Light Cashier (§18) lights up, incoming buyers immediately **pick up numbers from the same sequence**. Two parallel numbering systems in one kitchen is a surefire source of chaos.
- Displayed **large** in three places: the customer order status screen, the order card in the Merchant application, and the "order ready" notification.
- Useful for the kitchen too: the merchant cooks based on the order of the numbers, instead of guessing which one comes first.

**What was intentionally not created**: "number being served..." board, queue screen, or ticket printing machine. That's for restaurants with waiting areas — in a coffee shop, numbers on two screens solve the problem.

**Reset**: daily, on first open session (§5k). Past numbers are still stored in the history along with the transaction number.

**Phase 1**, along with pick-up orders — that's where it's needed most.

---

## 33 — Multiple Merchants & One Driver Multiple Orders

Two questions that are often combined even though they are different: **can one basket contain several stalls**, and **can one driver carry several orders**. The answer: the first is no, the second is yes.

### 33.1 Multi-merchant baskets: no — and the reason is architectural

Not because it's less important, but because it **violates the money rule that underpins this entire design**.

In our model, the customer pays **directly to the shop** via the shop's QRIS, and the platform never holds funds (§2.8, §23.4). One basket containing two stalls means that one payment has to be split between two accounts — and the only way to do that is a **accommodating and dividing platform**, which is precisely an activity that requires permission from Bank Indonesia and cannot be carried out by individual owners (§22.3).

The solution that seemed attractive was closed: having Warung A charge for Warung B meant that Warung A was holding Warung B's money — the same problem, plus bookkeeping that would never match up.

**New multi-merchant baskets are possible** if payments go through a licensed gateway with *split settlement* — and that requires a business entity first (§22.9). Until then, the answer is no, and that is a final decision, not one that is postponed due to running out of time.

### 33.2 What replaces it — two existing roads

**Way 1 — Buy-In (§24), for small and mixed cases.**
*"Buy rice at Warung Bu Encum, as well as ice next to it"* is the list of items to buy. The driver bails, the customer **pays once, in cash**, and the shop doesn't even need to be a partner. The cost for the customer: one postage + entrustment service IDR 5,000. It's the simplest path to mixed shopping, and **doesn't require any new features at all**.

**Way 2 — Separate orders, one trip (§33.3).**
Customer orders from Warung A and Warung B as **two orders**; each is paid to its own stall (two QRIS, "Pay 1 of 2" screen). If both are in the same direction, the system offers the **same driver** to pick up both. The stall still accepts structured orders along with queue numbers, and customers only wait for one driver.

Cost comparison for customers, so they can choose consciously:

| Road | Pay | Postage | Stalls can have structured orders? |
|---|---|---|---|
| Tip Buy | 1× cash | 1 postage + IDR 5,000 entrustment service | No |
| Two orders | 2× QRIS | 2 postage | Yes |

For small purchases, Titip Beli is cheaper and more concise. For food orders that need to be cooked, two orders are better.

### 33.3 One driver multiple orders (batching)

**Yes, and it is useful** — especially during peak hours when one stall is issuing several orders almost at the same time.

**Requirements for a batch** (all mandatory, server checked):

1. **Maximum 2 orders** per trip on v1. Not 3 — motor capacity is limited and food is cooling.
2. Pick up points are **same**, or are in **the same zone**.
3. Interpoints in **the same zone or in the same direction**.
4. Ready time difference **≤ 10 minutes**.
5. **No passenger orders** in the batch — one passenger per trip, no exceptions (capacity & safety, §22.4).
6. Buyers may only participate if the total bailout remains within the driver's ceiling (§24.3).

**How ​​to offer it** — this is what determines whether to use it or not: when the driver is on his way to or at a stall, an offer appears **"There is another one from the same stall. Do you want one?"** with a short countdown and a **Skip without penalty** button. Offering at the time felt natural; offering before he arrives only adds to the burden of the decision.

**Shipping when batching: driver receives both in full, customer pays the same rate as promised.** No deductions for anyone. There are two reasons: our rates are already low (Rp. 5,000 per village), and cutting postage will make batching unattractive precisely at the time when it is most needed. **Batching is an efficiency bonus for drivers, not a discount tool** — and no promises are changed once a customer orders.

**Implementation rules:**

- **Confirm postage per order** — the driver presses "Shipment received" twice if there are two orders, because each order has its own postage (§23.4).
- **OTP per order** upon handover; there is no collective solution.
- **The second customer's ETA is automatically added** to the first delivery time, and **notified from the moment the batch is formed** — instead of being left to watch the countdown run its course (§5l). Copy: *"The driver stopped at one place first, so it took a little longer."*
- **System recommended delivery order** (nearest first), drivers may change.
- **Failure is not contagious**: one customer is not there → the order is `gagal_tidak_diambil`, other orders are proceeding normally.
- **Merchant couriers** (§23.2) may carry some of the shop's own orders without this rule — that's an internal matter for the shop, and the merchant sets the order.

**When built: Phase 3, not Phase 2.** Phase 2 sends single-order dispatch first, so we see **how often** two orders are actually ready at the same time in the same stall. Building batching before looking at the numbers risks solving a problem that doesn't exist.

**But the seams are installed now** (Phase 2), because adding them later will change the flow of the driver:

- Table **`guyub_trips`** (`driver_id`, status, created, completed) and column **`guyub_orders.trip_id`** which can be empty.
- In v1, one trip always contains one order. Later batching simply adds a second row to the same ride — not reshaping the model.

### 33.4 Summary of decision

| Needs | v1 | Later |
|---|---|---|
| Shop from several stalls at once | **Purchase Tip** or two separate orders | Multi-merchant basket, **only after** gateway split settlement + business entity |
| One driver multiple orders | One order per trip (Phase 2), `trips` stitching in place | **Max batching of 2 orders** (Phase 3), conditions §33.3 |
| Passenger orders | Always one per trip | Unchanged — safety |

---

## 34 — Variants, Options, and Add-ons to Products

It wasn't in the previous document, and that's a real loophole: without this the merchant would write *"spicy, a little ice, separated chili sauce"* in the free notes box — then the kitchen would misread it, and the customer would blame the stall.

The key is separating three things that are often mixed into one complicated feature:

| Type | Example | Changing prices? |
|---|---|---|
| **Options** | spicy · hot/cold · with ice / without ice · separate chili sauce | **No** — instructions to the kitchen |
| **Variants** | Regular portion / Jumbo portion | **Yes** — prices vary |
| **Additional** | + egg · + rice · + crackers | **Yes** — adds price |

The large platform unites everything into a "modifier group" with a multilevel configuration. For a shop owner with a cellphone of IDR 1.5 million, that's too much. So these three mechanisms are **intentionally not equally complicated**.

### 34.1 Options — selected from a ready-to-use list, not written

Merchant **doesn't write anything**. It simply ticks the groups that apply to that product:

| Ready-to-use groups | The choice |
|---|---|
| Spicy | Not spicy · Medium · Spicy · Very spicy |
| Temperature | Hot · Cold |
| Ice | Use ice · Little ice · No ice |
| Sugar | Normal · Little · No sugar |
| Sambal | Mixed · Separated |

**Use words, not numbers.** “Levels 1–5” doesn't mean anything to first-timers — and no two stalls define level 3 the same way. "Very spicy" is understood by everyone.

Each group can be marked **required** (e.g. temperature for coffee) or optional. Merchants can add **maximum 1 self-made group** (max 4 choices), but the preset is pushed — empty boxes stop people from filling in.

### 34.2 Variants — one dimension only

A simple list with individual prices, **not a matrix**:

> Fried Rice — Regular portion **Rp 12,000** · Jumbo portion **Rp 17,000**

One valuable dimension per product. If a merchant needs two (size × taste), aim to create **separate products** — it's clearer to him and to the buyer than a matrix that must be filled in completely. Variants can be marked **out of stock** individually; Stock figures are not tracked per variant in v1.

### 34.3 Addendum — flat list, may select multiple

> + Eggs IDR 5,000 · + Rice IDR 5,000 · + Crackers IDR 2,000

You can choose several, with a limit on the number that can be set by the merchant.

### 34.4 Fence so that the screen does not turn into a form

Per product: **maximum 3 choice groups, 5 variants, 8 additions**. If a product needs more than that, what's wrong is not the limit — the product needs to be broken down.

### 34.5 Non-negotiable rules

1. **All prices are server calculated.** The client sends `product_id`, `variant_id`, `option_ids[]`, `addon_ids[]`, and the amount — **never** nominal (Invariant 2).
2. **Variants, options and add-ons must be verified as belonging to that product** (finding #35). This is a classic IDOR door: sending `addon_id` belonging to another stall's product which costs IDR 0.
3. **Price & name are snapshot** to `guyub_order_items` when order is created. Merchant increases prices tomorrow without changing orders today.
4. **Assessment remains at product level, not variant** (§5i). If you break it down per variant, the threshold of 5 ratings will never be reached and the badge will be useless. The same for the “Best Selling” count.
5. **Light Cashier (§18) uses the same variants & options.** Otherwise, the kitchen receives two different formats for the same item — and that's a sure source of errors.

### 34.6 How to appear

- **Product details (Customer)**: option groups as pill buttons, variants as value options, additions as checklist. Copy follows §17: *"How spicy do you want?"* — not "Choose the level of spiciness".
- **Order card (Merchant)**: one line that can be read at a glance by the person holding the frying pan —
`1× Nasi Goreng (Jumbo) — Pedas banget, sambal dipisah, +Telur`
- **`/w/<slug>` shop & web page**: if there are variants, display **"starting from IDR 12,000"**, not a misleading single price.
- **Free notes still exist** (max 100 characters) for things not covered — but after §34, they become the exception, not the mainstream.

### 34.7 Data

Uses the **variant** structure that already exists in the `Catalog` module (DNA Berdikari §3). The new ones are just additional tables — no old schema has been changed:

| Table | Contents |
|---|---|
| `guyub_product_option_groups` | `product_id`, group name, `preset_key`, required/optional, order |
| `guyub_product_options` | `group_id`, label, sequence |
| `guyub_product_addons` | `product_id`, label, price, max select |
| `guyub_order_item_options` | Snapshot of options & additions per order line: labels, current price |

`guyub_order_items` adds `variant_id`, `variant_name_snapshot`, `unit_price_snapshot`.

**Phase 1.** This isn't perfection — rice stalls without spicy options and coffee shops without hot/cold can't sell properly from day one.

---

## 35 — How to Determine Courier Rates (gasoline, terrain, eligibility)

The question *"Is Rp. 8–10 thousand worth it?"* cannot be answered with taste. This section derives it from the real costs, then admits the part where the results are unfavorable.

### 35.1 Actual cost per kilometer

What is often wrong: just counting petrol. What actually comes out of the driver's pocket:

| Post | Calculation | Per km |
|---|---|---|
| Gasoline | IDR 10,000/liter ÷ 40 km/liter | ± Rp. 250 |
| Oil, tires, chains, brake linings, service | ± Rp. 100/km in normal use | ± Rp. 100 |
| **Pocket fee** | | **± Rp. 350** |
| *(Motorcycle depreciation — real but rarely felt)* | *Rp 18 million ÷ 100,000 km* | *± Rp. 180* |

All numbers above **must be configuration data, not constants in the code** (§30.4) — because gasoline prices will change.

### 35.2 Actual distance traveled ≈ 2× distance between

This is what makes the old rates too low. A "2 km" delivery actually contains:

```
posisi driver → warung (jemput)   ± 1–2 km
warung → customer (antar)         ± 2 km
reposisi setelah selesai          ± 1 km
```

So a 2 km delivery = **± 5 real km**. Calculating postage from the delivery distance alone means the driver covers half the journey himself.

### 35.3 The formula

```
ongkir = (jarak_antar × 2 × biaya_per_km) + (menit × upah_waktu) + tambahan_medan
```

With **time wages of IDR 25,000/hour** — below the Karawang minimum wage per hour (± IDR 30,000), but reasonable for part-time flexible work, and far above the informal village wage.

| Reach | Distance between | Real | Cost | Time | Time wages | **Postage** |
|---|---|---|---|---|---|---|
| In the village | 2 km | 5 km | Rp. 1,750 | 15 min | Rp. 6,250 | **Rp 8,000** |
| Between neighboring villages | 5 km | 11 km | Rp. 3,850 | 25 min | Rp. 10,400 | **Rp 13,000** |
| Inter-district | 12 km | 26 km | Rp. 9,100 | 45 min | Rp. 18,750 | *Rp 28,000* |

### 35.4 Unpleasant conclusions, and their consequences

**Between sub-districts is not feasible for culinary.** Rp. 28,000 postage for Rp. 15,000 fried rice will never be ordered, and lowering it means the driver is subsidizing the platform out of his pocket. So:

- **Culinary is only served within the village and between neighboring villages.** Between sub-districts it is still available for **goods couriers & passenger motorbike taxis** (IDR 28,000+), which is worth it.
- **Between villages requires a minimum order of IDR 40,000**, so that postage of IDR 13,000 does not exceed one third of the order value. Below that: just pick it up yourself, or order from a stall in the village itself.

This changes one product priority: **what is being pursued is stall density per village, not coverage area.** Twenty stalls in three villages is much more useful than twenty stalls spread across ten villages — and that clarifies the threshold of §21.1.

### 35.5 Uphill terrain — case of cafe on a hill

A flat zone matrix cannot represent an incline. Loaded hills increase consumption by 40–50%, slow travel and accelerate wear of the lining, chain and clutch.

The solution is **fixed addition per place**, not a multiplier — so it can be explained to both parties in one sentence:

| Terrain class | Additional | Defined |
|---|---|---|
| Flat | — | default |
| **Uphill** | **+Rp 3,000** | Ops, after **checking directly** the location |
| **Difficult** (sharp inclines, damaged/rocky roads) | **+Rp 5,000**, and **driver may refuse without penalty** | Ops |

The rules:
- **All additional terrain goes to the driver**, no platform cuts.
- Displayed separately and as is: *"Postage Rp. 8,000 + ramp Rp. 3,000"*. Customers who order from cafes on the hills do know that the road is uphill — honesty here doesn't lower the order, but hiding it will make the driver stop accepting it.
- Places marked uphill/difficult are **marked on the bid card** before the driver accepts, not after.
- **Drivers can choose**: setting *"I want to accept ramp orders"*. Those with strong motorbikes took them, those without weren't offered. This solves the problem without forcing anyone.
- Terrain classes are set **per place** in `guyub_places`, not per zone — a village can have flat roads and hill roads at the same time.

### 35.6 Waiting time at the stall

There are no waiting fees in v1 (charging customers for stall delays is unfair, charging stalls triggers disputes). Instead: **after waiting 15 minutes, the driver may cancel and still receive the postage from the stall.** The stall bears the consequences of its own delay, and that is consistent with §23.4 where the stall is indeed the party delivering the postage.

### 35.7 If petrol prices rise

The mechanism is installed, not patched later:

- `harga_bensin_per_liter`, `konsumsi_km_per_liter`, `perawatan_per_km`, `upah_waktu_per_jam` are **configuration data**; rates are calculated from all four.
- **Reviewed every quarter**, or immediately when gasoline prices move **> 10%**.
- Tariff changes **announced 14 days in advance** to drivers and customers. Drivers whose rates change without notice will stop — and they'll tell their stories.
- For **passenger orders**, the calculated results must still be within the official online motorcycle taxi rate range for this regional zone (§22.4). For goods & food couriers, there is no mandatory range.

### 35.8 So, Rp. 8,000 is worth it?

**Per delivery: yes.** Rp. 8,000 − Rp. 1,750 cost = **Rp. 6,250 net** for 15–20 minutes.

**Hourly: depends on something that is not the rate.**

| Orders/hour | Net/hour | Worthy? |
|---|---|---|
| 1 | Rp. 6,250 | No |
| 2 | Rp. 12,500 | Marginal |
| **2.5** | **Rp 15,600** | Reasonable for part time |
| 3 + batching | ± IDR 25,000 | Good |

**What determines a driver's income is not the rate, but the density of orders.** Fair rates with low orders still make drivers stop. Two direct consequences:

1. **Don't hire a lot of drivers at the start.** It's better to have **3 busy drivers** than 8 idle drivers — and this revises plan §21.4 which calls for 5–8 drivers.
2. **Batching (§33.3) increases priority.** It is the only way to increase hourly earnings without increasing shipping costs. If Phase 2 data shows that there are often two orders ready at the same time, batching is done earlier than planned.

---

## 36 — PIN or Password? (authentication decision)

**Answer: 6-digit PIN for all roles — but only valid if the five hardenings in §36.4 are installed.** Without it, the PIN is indeed worse. With that said, PINs are more secure *in practice* than passwords for GUYUB users.

### 36.1 Compare threats, not secret lengths

| Threat | 6 digit PIN | User selected password |
|---|---|---|
| **Try it online** | 10⁶ space, but **limited throttling** → practically impossible | Both limited throttling → practically the same |
| **Crack offline after database leak** | **Weak** — 10⁶ can be broken in an hour without pepper | More resistant, if strong |
| **Reused from another service** | Risk: same as **ATM PIN** | **Worse** — Facebook/WhatsApp passwords are reused, and have been leaked elsewhere |
| **Seeing people (shoulder surfing)** | Easier to see | A little better |
| **Forgot → reset** | Rare | **Often** → OTP volume rises, and OTPs are a more dangerous attack surface (§36.6) |
| **Written on paper near the cellphone** | Rare | **Often** |

Decisive point: **PIN weaknesses can only be exploited via offline or online attacks without restrictions.** With proper throttling, 1 million will likely never be touched from the outside. And offline attacks are answered by pepper, not by secret length.

### 36.2 Why the password is actually worse here

Not because of theory, but because of who the user is:

- The password that non-technical users in the village actually choose will be name + year of birth, `12345678`, or **the same password as their Facebook** — which may have been leaked years ago. The actual entropy is often **below** a random 6 digit PIN.
- The merchant types it **dozens of times a day** on the shop's cellphone which is used by two or three. Long passwords on the cellphone keyboard will end up as `warung123` or stuck on the wall.
- Difficulty remembering → more frequent resets → **OTP volume increases**, and that moves risk to a much more fragile path (§36.6) while increasing costs.

Security that cannot be used by people will be violated by the people themselves. That's not a reason to be loose — that's a reason to choose a suitable mechanism and then stiffen it.

### 36.3 What limits the downside: customer accounts do not hold money

This is a good consequence of §2.8. A hijacked customer account gives the attacker: order history, cellphone number, favorite places, and the ability to order COD in his name — **not balance, not card, not wallet**. There is no money to take because there is no money saved.

**merchant** and **driver** accounts are different: the merchant has the authority to mark `lunas` (§5h) and change the price; Drivers have a bail limit and access to customer PII as long as the order is active. Hence both receive additional hardening (§36.5) — not different mechanisms.

### 36.4 Five mandatory hardenings (without this, the PIN is not valid to use)

1. **Argon2id + pepper.** Pepper is a server-side secret key that is **not stored in the database**. Without pepper, 6-digit PIN hashes could be completely compromised within hours of the database leak (finding #36). With pepper, the database thief still can't do anything unless he also steals the application key.
2. **Layered throttling, calculated on the server**: 5 wrong → wait 5 minutes · 10 wrong → wait 1 hour · 15 wrong → must reset via OTP. Calculated per account **and** per device **and** per IP (finding #6).
3. **Weak PIN reject list**: repeating numbers (`111111`), sequential (`123456`, `654321`), 4-digit year of birth + 2, and 100 most common PINs. Rejected when created, with friendly explanation.
4. **Explicit warning when creating a PIN**: *"Don't use your ATM PIN."* This is important — the same PIN as the ATM makes the leak at GUYUB spread to something much more dangerous.
5. **Device binding**: PIN only applies to known devices. New device → OTP required, and account owner **notified** ("Someone has logged in from a new cellphone"). Sessions are long-lived so the PIN is rarely typed.

Recommended additions: **biometrics (fingerprints) as a layer of convenience** on devices that support it — reducing the frequency of PIN typing, while reducing the risk of being seen. Not a replacement for a PIN; The PIN is still the way back.

### 36.5 Tiered according to loss, not according to role

| Role | Daily login | Additional |
|---|---|---|
| Customers | 6 digit PIN | Device binding |
| **Drivers** | 6 digit PIN | Device binding **mandatory** + OTP when increasing the bailout ceiling |
| **Merchant (staff)** | 6 digit PIN | Mandatory device binding; cannot change payment data |
| **Merchant (owner)** | 6 digit PIN | Mandatory device binding + **additional-step OTP** for: changing QRIS/account, adding/removing couriers, transferring ownership |
| **Ops / Admin** | **Strong password + 2FA (TOTP)** | This account can touch all tenants — here the password is indeed the correct answer |

Payment confirmation (`lunas`) **doesn't** have any extra steps: it happens dozens of times a day, and asking for an OTP each time will make the merchant stop using it. It is maintained in other ways: device binding, auditing of every decision (§5h), and monitoring of the rejection ratio in the Ops Console.

### 36.6 The weakest point isn't the PIN — it's the recovery path

This is the part that is most often overlooked. Guessing the PIN from outside is practically impossible; **taking over a cellphone number is not.** SIM swapping, numbers being forfeited and then recycled by operators, or OTPs read over the phone by fraudsters claiming to be "GUYUB officers" — these are the routes that are actually used in Indonesia.

Because of that:
- OTP **only** for registration, device change, and PIN reset — not for daily login (§3.1).
- Every device replacement **notifies the old device**, and records audits.
- For **merchant owners**, device replacement + change of payment data within the same 24 hours → **hold and verify Ops by phone**. The value is great enough to be worth waiting for one call.
- Copy on the OTP screen: *"This code is only for you. Don't give it to anyone, including those who claim to be from GUYUB."*
- PIN and OTP **never** enter any logs, analytics or messages (§11).
- **Delivery channel is chosen by the server, not the user.** Try **WhatsApp Business API** first (cheaper, and most drivers already have it for group coordination); if the send fails or the number isn't registered on WhatsApp, fall back automatically to **SMS gateway** after a short timeout (~10–15s). This matters most for **drivers**: SMS fallback exists precisely for the driver without WhatsApp installed, while WA-first keeps cost down for the driver without phone credit. Same principle as §36.7 — don't make the user pick a delivery mechanism, that's a second bug surface and most drivers can't judge which one will actually reach them. `GYB-AUT-401` fires only once **both** channels in the chain have failed.

### 36.7 Decisions

**6-digit PIN for customers, drivers, and merchants** — with five hardenings of §36.4 as a requirement, not a suggestion. **Strong password + 2FA only for Ops/Admin**, because there are technical disadvantages across tenants and users.

Don't offer users the choice of "PIN or password." Two authentication paths means two authorization bug sites, and that violates Invariant 6 (one authority path).

---

## 37 — Timeline & Work Order

Compiled from hour estimates in §30.1. What makes these plans go awry is usually not the code — it's the field and legal work that people forget to start early (§37.2).

### 37.1 Assumed speed

| Speed ​​| Hours/week | Up to v1.0 |
|---|---|---|
| While working elsewhere | 12 | ± 20–24 months |
| **The basis of this plan** | **20** | **± 12–15 months** |
| Full | 35 | ± 7–9 months |

All dates below use **20 hours/week**, starting **August 2026**. If your pace is different, multiply the weeks — the order doesn't change.

### 37.2 Three paths are running simultaneously — and two of them should start this week

This is the part that most often ruins the schedule: waiting for the application to be completed before taking care of the field and legal matters. Even though both have a waiting time that cannot be accelerated by typing faster.

| Path | Start | Contents | Why should it be early |
|---|---|---|---|
| **Code** | Week 1 | Phase 0 → 6 | — |
| **Field** | **Week 1** | Survey **list of places** (villages/hamlets/benchmarks), **zone**, **terrain class** (§35.5), data collection on prospective stalls | Without a list of places, checkout cannot be tested at all. Surveying two sub-districts takes weeks to walk, not a day |
| **Legal & administrative** | **Week 1** | NIB (OSS), NPWP, **PSE Kominfo**, privacy policy & T&C, special commission account (§22.8) | There are processing times beyond your control. Public release should not wait for it |

**Rule**: every Monday, set aside **one field/legal day** before touching code. In six months you will be grateful.

### 37.3 Timeline per phase

| Phase | Sunday | Calendar forecast | Results | Gate pass |
|---|---|---|---|---|
| **0 — Foundation** | 1–6 | Aug–Sep 2026 | Road framework, auth, CI, infra T0, legal checklist §22.8 complete | Vertical spikes §37.5 green; First recorded restore exercise |
| **1 — Culinary: pick up yourself + merchant courier** | 7–20 | Sep–Dec 2026 | Customer & Merchant Application that **can be used for sales** | 8 mandatory tests §26.2 passed; ≥ 15 stalls ready; **2 week closed pilot with no money incidents** |
| → **Public launch** | **21–22** | **Dec 2026** | Promotion §21 starts | Go/No-Go Criteria §26.5 (8 items) |
| **2 — GUYUB Courier** | 23–35 | Jan–Mar 2027 | Driver + dispatch + fare application §35 | Test shipping & handover; 3–4 active drivers |
| **3 — Services + Purchase Deposit** | 36–43 | Apr–May 2027 | Motorbike taxi, courier, buy-to-buy, travel directory | Tested bailout ceiling; "7 day highlight" manual sold ≥ 3× |
| **4 — Ticket + Light Cashier** | 44–53 | Jun–Aug 2027 | Tourist tickets + light POS | Scan QR **offline** tested at the gate |
| **5 — Money, Premium & Ops** | 54–62 | Aug–Oct 2027 | Commission on, full premium, Console Ops | The first commission is due; ≥ 10 premium merchants |
| **6 — Hardening & release** | 63–68 | Oct–Nov 2027 | v1.0 store ready | Empty/failed state audit; light load; restore drill |

**Commission on in the 7th month since public launch** (§30.5) — around July 2027, not the 7th month since starting coding. Don't get confused; revenue follows the user, not the code.

### 37.4 Order of work — starting with the most risky

The principle: **do the thing first which, if it turns out wrong, cancels out the rest.** Not the easiest, not the most pleasing to look at.

**Phase 0, sequentially:**

1. **Repo + CI + Docker + `config-as-data`.** Six things must be data from the first row: brand, zone & location, rate matrix, commission & package figures, Ops contact, legal text (§30.4). Cheapest now, most expensive later.
2. **Auth**: PIN + Argon2id + **pepper** + throttling + device binding (§36.4). All other features ride on this.
3. **`Merchant` module + tenancy + operating hours** (§5k).
4. **Flutter monorepo framework**: `guyub_core`, `guyub_ui`, design token, l10n, `ApiClient`, `go_router`.
5. **Merchant notification**: high priority FCM + foreground service + recurring alarm.
6. **Vertical spikes** (§37.5).

**Phase 1, sequential — money line first, view later:**

1. Catalog + **variants/options/additions** (§34) — without this the merchant writes in a free note and the kitchen reads it wrong.
2. Cart + checkout with **server calculated price** + `Idempotency-Key`.
3. **Payment gateway**: QRIS unique nominal + merchant verification (§5h). *This is the heart. If this part is not correct, there is no point in continuing.*
4. **COD Trust** + ask-pay-first (§5g).
5. State machine + **queue number** (§32.2) + **error code & request_id** (§31).
6. **ETA + countdown** (§5l).
7. **merchant courier** mode + merchant shipping rules (§23.2).
8. Welcome & thank you message (§5m).
9. **Public projection + discovery + web `/w/<slug>`** — required for public launch, not for private pilot (in pilot, merchant shares the link directly).
10. **Input channel** (§28) — must be on **before** the pilot starts, not after.

Number 9 is deliberately behind. Discovery is a huge undertaking that feels like progress, and that's the pitfall: it doesn't prove anything about whether stores will use this system.

### 37.5 Vertical spikes — week 5 goal

Before building anything neat, prove risk number one (§14): **are orders actually heard by the stall owner?**

> One stall · one product · one customer · no payment · no discovery.
> Customer presses Message → **merchant's cell phone in pocket, screen off, silent mode, beeps** → merchant presses Accept → customer sees the status change.

Test on a real cheap Android phone, not an emulator. If this doesn't work reliably by week 5, **stop other work and finish this** — the entire product depends on it, and no other feature can make up for its failure.

### 37.6 Interphase gates

A phase isn't finished until **everything** is fulfilled — here's what keeps the schedule honest:

- Green phase test in CI, including **rejection path RBAC** (§26.2).
- All new copies are read aloud against §17.
- No remaining **blocker** class bugs (§26.6).
- Release tag created; change notes are written.
- For phases that touch money: idempotency & authority test pass value.

### 37.7 How to stay on track

**Simple weekly rhythm**: Monday determines **3 deliverables** to complete that week (not 10). Friday: tag, then **show it to one stall owner** — not to yourself. Feedback from people who will wear it is quicker to correct course than reflection alone.

**One number to monitor**: current week vs planned week. If you miss > 3 weeks in one phase, don't speed it up with overtime — **cut the scope of the next phase**.

**What can be shifted when left behind**: Tourist tickets (Phase 4), Light Cashier (Phase 4), Full premium (Phase 5), Buying Tip (Phase 3).
**What should not be moved, whatever the reason**: payment gateway (§5h), mandatory security controls (§9 verdict), legal checklist (§22.8), restore practice (§19.3), and input channel (§28).

The three things that most often cause this schedule to slip are mentioned so that it can be maintained: **surveying the list of postponed places**, **refining the display before the money line is finished**, and **recruiting new stalls starting from Phase 2 even though the first 15 stalls are not actually active**.
