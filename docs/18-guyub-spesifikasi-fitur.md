#18 — GUYUB — Feature Specifications per App

**Derivative of** `docs/17-guyub-prd.md` (Project DNA / PRD). This document answers *"what screens, what contents, what buttons"*. All **rules** (money, security, law, tone) remain in PRD — here they are only referenced, not repeated. If there is a conflict, **PRD wins**.

**Status**: v1.0-draft, following PRD v1.0-draft.

---

## 0 — How to read

Each screen is written with a fixed format:

> **Purpose** — one sentence, from the user's perspective.
> **Content** — what appears.
> **Action** — the button and its consequences.
> **Rules** — what the server guarantees (reference PRD).
> **State** — loading / empty / failed / offline.

Three things apply to **every** screen without needing to be rewritten:

1. All copy follows **PRD §17** (casual tone, "you", fail message always offers next step).
2. Each screen has states **loading, blank, failed + retry button** — no white screen (PRD §2.10). The display fails to display **5 character trace code** ("call this code: 7F3K2") which comes from `X-Request-Id` (PRD §31.2).
3. Touch target ≥ 44 px, designed at 360 dp, text at least 14 sp.

---

## 1 — Shared components & patterns (`packages/guyub_ui`)

| Components | Used in | Notes |
|---|---|---|
| `AppButton` | all | Minimum height 44 px; primary/secondary/danger variants |
| `RupiahText` / `RupiahField` | all | `id_ID` format, no decimals |
| `StatusChip` | Customer, Merchant, Driver | Color per order status, label Language |
| `MerchantCard` | Customer, Web | Photo, name, open/close status, zone distance, badge |
| `ProductCard` | Customers, Merchants | Photo, price (**"starts from IDR ..." if there is a variant**), badge *Best Selling* / *Most Liked* / *New* |
| `OpenStatusBadge` | all | "Open" · "Closed in 40 minutes" · "Closed · Open again 06.00" (PRD §5k) |
| `CountdownTile` | Customers, Merchants | Counting down from `promised_ready_at` **locally** (PRD §5l) |
| `EmptyState` | all | Own hand illustration + one sentence + one action (PRD §27.2) |
| `ErrorState` | all | "Oops, there's a problem..." + Try again |
| `PhotoTipsSheet` | Merchants | Guide to photographing menus (PRD §27.3) |
| `SponsoredLabel` | Customer, Web | Required on every paid slot (PRD §5j) |

**Navigation pattern**: `go_router` + bottom navigation maximum 4 items + "Other". Items appear according to permissions (PRD §9 DNA Berdikari, pattern `nav.ts`).

---

## 2 — Web Profile (`guyub.<domain>`)

Nuxt on Cloudflare Pages, static/edge-rendered, target < 100 KB per page. Reference: PRD §20.

### 2.1 `/` Home

> **Goal** — convince citizens this is real, then direct them to the app.
> **Content** — one sentence proposition; **Download app** button; "3 step messages"; **list of currently open stalls** (directly from public projection, 60 second cache); simple map of service area (Pangkalan & Tegalwaru); number of stalls & active drivers; Register link to become a partner.
> **Action** — Download · View all stalls · List of stalls · Join driver.
> **Rule** — public data only (PRD §6.3); labeled sponsored slots; stall lid not lifted upwards (PRD §5k).
> **Condition** — if the projection fails to load, displays a page without a stall list, not a failed page.

### 2.2 `/w/<slug>` Warung profile — **most important page**

This is what the merchant shared on WhatsApp status; it should stand alone without an application.

> **Fill** — shop name & photo; open/closed status + today's time + "Open again..."; hamlet-level addresses (not precise points); grouped menu list with prices & badge; note "Prices may change"; **Order in app** button (deep link to shop screen, fallback to Play Store).
> **Rules** — only fields that **merchant** approves during registration; **cellphone number does not display by default** (PRD finding #26); `noindex` if the merchant has not been verified.
> **SEO** — `schema.org/LocalBusiness`, title contains shop name + village + sub-district, automatic sitemap from public projection.
> **Condition** — shop closed: page still appears complete, message button replaced "Open again tomorrow 06.00".

### 2.3 `/wisata/<slug>` Destination

> **Contents** — photos, opening hours, ticket prices, remaining quota today, how to get there.
> **Action** — Buy ​​tickets in the app.

### 2.4 `/daftar-warung` & `/gabung-driver`

> **Fill in** — short form: name, cellphone number, village, type of business / type of vehicle, upload 1–3 photos. Driver: statement of having SIM C & active STNK.
> **Action** — Submit → enter Ops verification queue.
> **Rules** — public form → rate limit + simple anti-spam; registrant data is PII (PRD §11).
> **Condition** — successful: "Thank you! We'll contact you via WhatsApp within 2 working days."

### 2.5 `/bantuan`, `/privasi`, `/ketentuan`, `/status`

| Page | Contents |
|---|---|
| `/bantuan` | FAQ 10–15 questions (how to order, how to pay, order not arriving, how to become a partner) + WhatsApp Ops button |
| `/privasi` | The privacy policy mentions **name of owner as data controller**, data type, retention, user rights (PRD §22) |
| `/ketentuan` | Intermediary position T&Cs — **no total exoneration clause** (PRD §22.6) |
| `/status` | Service status + interruption history; worn during an incident (PRD §19.4) |

---

## 3 — Mobile Customer (`guyub_customer`)

Bottom nav: **Home · Orders · Notifications · Account**.

### 3.1 Login & register

| Screen | Content & action | Rules |
|---|---|---|
| Opener | 3 short slides, Start button | Location & notification permissions **requested when needed**, not at the start |
| Sign in | Mobile number + **6 digit PIN**; **fingerprint** if the device supports | Layered throttling 5/10/15 attempts, server count, per account + device + IP (PRD §36.4) |
| Register | Mobile number → **OTP** → create PIN → nickname | **Weak PIN rejected** (repeated, sequential, year of birth, 100 most common PINs) + warning *"Don't use your ATM PIN."* (PRD §36.4) |
| New device | **OTP** required; old device **notified** | The PIN is only valid on known devices; long-lived sessions so that the PIN is rarely typed |
| Forgot PIN | Mobile number → OTP → new PIN | Noted audit. Copy OTP screen: *"This code is only for you. Don't give it to anyone, including those who claim to be from GUYUB."* (PRD §36.6) |

> **Copy**: "Enter your cellphone number, we'll send a code later." — not "Please enter your phone number."
> **Channel**: chosen automatically by the server (WhatsApp first, SMS fallback if not reachable on WhatsApp — PRD §36.6). No "send via WA/SMS" picker in the UI.

### 3.2 Home

> **Fill** — greeting according to the hour ("Good afternoon, Mrs. Ratna"); search box; **categories**: Food · Drinks · Motorbike taxis · Buy and sell · Tourist Tickets · Travel (directory); **active orders** card (if available, always top, with countdown); **Today's Pick** (max 3, labeled *Sponsored*); **Open now near you**; **Most liked this week**.
> **Action** — select category · open stall · continue active order.
> **Rules** — maximum 20% sponsored proceeds; stall lid not lifted (PRD §5j, §5k).
> **Condition** — empty (no stalls open yet): "The stalls are closing. Try again at 6 am." + list to open.

### 3.3 Register & search for stalls

> **Content** — filter: category, open only, zone/village; order: **closest · best selling · most liked **. Stall card: photo, name, badge, open status, estimated time.
> **Rules** — max pagination 50 per page (PRD finding #8); Closed stalls appear below with labels.

### 3.4 Stall profile

> **Contents** — header photo + name + `OpenStatusBadge` + time of day + estimate ±20–30 minutes; **merchant welcome message** if any; group menu per category; `ProductCard` with badge; floating cart button.
> **Action** — add item · open details · share link `/w/<slug>`.
> **Rules** — out of stock products appear grayed out and cannot be added; past last message limit → all add buttons turn off with explanation (PRD §5k).

### 3.5 Product details

> **Fill in (order)** — large photo, name, price, description, badge, "% likes" if ≥ 5 ratings; then (PRD §34):
> 1. **Value variant** if available — single choice with price: *Ordinary portion IDR 12,000 · Jumbo portion IDR 17,000*.
> 2. **Select group** as pill button, max 3 groups: *"How spicy do you want?"* → Not spicy · Medium · Spicy · Very spicy. Groups must be clearly marked.
> 3. **Additional** as valuable checklist, max 8: *+ Eggs IDR 5,000*.
> 4. Notes for stalls (max 100 characters) — for things not covered by options, not main roads.
> 5. Set the amount + total which **changes** when the selection is changed.
>
> **Action** — Add to cart.
> **Rule** — client sends `variant_id`/`option_ids`/`addon_ids`, **not nominal**; the server verifies everything belongs to that product then calculates and snapshots the price (PRD finding #35). The finished variant appears gray.
> **Copy** — use words, not numbers: "Very spicy", not "Level 4".

### 3.6 Cart & checkout — the most important screens

> **Contents (in order from top)** —
> 1. List item + change quantity + note.
> 2. **How ​​to receive**: Self-pickup · Delivered (available modes follow merchant settings, PRD §23.1).
> *One basket = one stall.* Adding items from another stall offers two paths: **separate orders** (one way → possibly one driver) or cheaper **Purchase Tip** for small purchases (PRD §33.2).
> 3. **Delivery point**: select from the list of places (village → hamlet → benchmark) + additional benchmarks max 120 characters.
> 4. **Payment method**: options permitted by the server only (PRD §5g) — QRIS pay first, or cash if the customer is trusted & the mode is not a GUYUB courier.
> 5. **Cost details**: Food · Postage (**+ additional charges if any, referred to as is**) · **Total paid** (one figure, PRD §23.4, §35.5). For between neighboring villages, **minimum order IDR 40,000** applies (PRD §35.4).
> 6. **Message** button.
>
> **Rules** — all values ​​are server calculated; client only sends product id, quantity, place id (PRD Inv. 2). `Idempotency-Key` is mandatory. Server **revalidates** opening hours & message limits when pressing Message; if late → message Language + next opening hours, **cart not deleted** (PRD finding #22).
> **Condition** — merchant closed unexpectedly: banner above cart, Order button off, offer "Remind me when open".

### 3.7 Payment QRIS

> **Fill** — merchant QR; **large unique nominal** ("Pay exactly **Rp 45,317**") + copy button; a one-line explanation of why the number is unique; 15 minute countdown; **I've paid** button; upload proof (optional).
> **Action** — I have paid → status `menunggu_verifikasi`, screen moves to Order Status.
> **Rule** — pressing the **no** button changes the status to paid; only merchants can (PRD §2.13). Expired → auto cancel, nothing cooked.

### 3.8 Order status (most frequently opened screens)

> **Fill** — **large queue number** if self-pickup ("Order number **7**", PRD §32.2) + small **transaction number** below (`260730-847293`, no letter prefix — PRD §32.1); vertical status timeline; **countdown / ETA** (PRD §5l); stall card; driver card when assignment is active (name, photo, license plate, telephone keypad); **Quick Message** (§3.15); cost breakdown; Cancel button (appears according to the rules); Help button.
> **Rules** — driver & customer numbers only appear during active assignment, **as Phone buttons — not text that can be copied**, and each press is recorded in an audit (PRD §29.3). When the estimate is missed, the countdown changes to a calming sentence — **never a minus number** (PRD §5l). After the second renewal, the **Cancel for free** button appears.
> **State** — offline: show last status + "Not connected, we'll try again…".

### 3.9 Completion & assessment

> **Done** — summary + **merchant thank you message** (PRD §5m) + "Rate" button + "Order again".
> **Assessment** — one screen: each item 👍/👎, optional preset reason, then merchant & driver. Can be skipped. Valid for 7 days, can be changed 24 hours (PRD §5i).

### 3.10 Motorbike taxis & couriers

> **Fill** — pick up & destination point from the list of places; type (between people / between goods); notes; **fixed rates from zone matrix** displayed before ordering; How to pay: cash to driver.
> **Rule** — rate within the official range (PRD §22.4).

### 3.11 Buying Tip

> **Content** — select store from list of places (**name only, no logo/menu/price** — PRD §24.1); shopping list box max 500 characters; estimated total expenditure; interpoint; details: estimated shopping + postage + delivery service; **list of items that cannot be entrusted**.
> **Rules** — only for customers with a good track record; estimates above driver ceilings are rejected before they are offered; final price follows the receipt (PRD §24.3).
> **Continuation screen** — "Driver is shopping" → photo of receipt & actual value appears → total updated with explanation.

### 3.12 Tourist tickets & Travel Directory

| Screen | Contents |
|---|---|
| Destinations | Photos, hours, prices, **remaining quota as of date** |
| Book tickets | Date, amount, total, payment method |
| My tickets | **Signed QR**, valid offline; status *not used / already used* (PRD §5c) |
| Travel Directory | List of licensed providers: name, route, hours, **phone key**. No bookings, no rates, no commission (PRD §22.4) |

### 3.13 History, Notifications, Account

| Screen | Contents |
|---|---|
| History | Order list + status + "Order again" button |
| Notifications | List + unread mark; FCM & in-app sources; loading **"News from the GUYUB"** (PRD §28.3) |
| Account | Name, phone number, favorite places, **Feedback & suggestions**, help, privacy policy, **delete account** (PRD §19.5), log out |

### 3.14 Feedback & suggestions (available in all three apps)

The same screen is used by Customers, Merchants, and Drivers — only the quick choices differ per role. Reference: PRD §28.

> **Purpose** — let GUYUB know if something is confusing, has an error, or could be better.
> **Fill** —
> 1. **Quick choice in the form of a sentence**: *There's something that makes you confused · There's an error · I have a suggestion · About the stall or driver · Others*. (Merchant: *…about incoming orders · about payment · about applications*. Driver: *…about order offers · about postage · about applications*.)
> 2. Free story box with a maximum of 1,000 characters, with a one-line warning: *"Don't write your PIN or account number here."*
> 3. **Record voice button, max 60 seconds** — large button, aligned in importance with the text box. Recorded **Opus mono ~16 kbps** (± 120 KB per 60 seconds), not WAV (PRD §25.6). Recorded directly as **Opus mono 16 kbps** (≈ 40–120 KB), limited on the recorder, without transcoding on the server (PRD §25.6).
> 4. Attach screenshot (optional, 1 image).
> 5. Check **"No need to contact, just want to let you know"**.
>
> **Action** — **Send** (active even if the text box is empty, as long as there is a quick selection / sound / image).
> **Rules** — technical context (app version, cellphone model, Android version, last screen, `order_id` when opened from the order screen) **follows automatically** and never contains a token or cellphone number; max 5 shipments/day; upload via the same presigned line as the order proof (PRD §28.4).
> **Condition** — sent: *"Thank you, we've received it. We read everything, really."* · offline: the post is queued and resent automatically.

**There are three entrances**, and the third is most frequently used:
1. Account Menu → Feedback & suggestions.
2. Help Page.
3. **The small link on each screen failed** — "Tell us what happened" — with the quick option *Something went wrong* selected and the screen context filled.

**My input** (from the Account menu): own list of posts + their status (Accepted → Read → Actioned / Closed) + Ops reply if any.

### 3.15 Quick Messaging (Customer · Merchant · Driver)

Not chat. One tap ready reply, appears on the active order status screen. Reference: PRD §29.

> **Destination** — communicate while the order is in progress without switching to WhatsApp and without typing.
> **Contents** — a row of message buttons according to the role (full list in PRD §29.2), the message history of this order in sequence, and the **Call** button.
> **Action** — tap a message → sent instantly, appears as a notification to the other party.
> **Rules** — only while the order is active; max 10 messages per party per order; automatically closed 1 hour after completion; **no free text box**; the telephone number is only behind the keypad (cannot be copied) and each opening is recorded in an audit (PRD §29.3, findings #33 & #34).
> **State** — offline: message is queued and sent automatically; no "read" marks (avoiding expectations that cannot be guaranteed).

For drivers, the instant message button must be able to be pressed **without reading** — fixed position, large icon, unchanged sequence — because it is often pressed while on a stopped motorbike.

---

## 4 — Mobile Merchant (`guyub_merchant`)

Bottom nav: **Home · Orders · Menu · Others**.
The app **requires** to use foreground service + high priority notifications + repeating alarms for new orders (PRD §6.5) — silent orders are the same as lost orders.

### 4.1 Home

> **Fill** — **large Open/Close switch** with running status ("Open · close 21.00 · last order 20.40"); top **new order** card (if any); today's summary: incoming orders, turnover, pending orders; shortcuts: Payment verification, Menu, Opening hours; warning when there is `ongkir_tertunda` or subscription billing.
> **Action** — Open/Close (choose the duration when closing) · open order · shortcut.
> **Rules** — temporarily close **required duration** and self-expire (PRD §5k).

### 4.2 Incoming orders (defining screen)

> **The item line is skimmed** by the person holding the frying pan: `1× Nasi Goreng (Jumbo) — Pedas banget, sambal dipisah, +Telur` (PRD §34.6).
> **Contents** — full-screen card: **large queue number** (given when Accept is pressed, one order with the buyer directly — PRD §32.2) + transaction number, item + note, customer's first name + **trust marker** ("New customer" / "5 orders completed" / "1 time not picked up"), payment method & payment status, method of receipt (pick it up yourself / delivered / whose courier), order value.
> **Action** —
> - **Accept** → select ready estimate: 10 · 15 · 20 · 30 · 45 minutes (PRD §5l).
> - **Ask to pay first** → for customers who have not been trusted with cash orders (PRD §5g).
> - **Reject** → select reason (out of stock, too busy, out of reach, other).
> - **Customer telephone** → number appears from the confirmation stage.
> **Rules** — response limit 5 minutes then auto-cancel; 3 misses in 30 minutes → auto close (PRD §5k).

### 4.3 Register & order details

> **Tab** — New · Prepared · Delivered · Completed · Cancel.
> **Details** — item, notes, cost, payment status, status history, **Quick Order** (§3.15), buttons according to stage: **Ready** · **+5 minutes** (max 2×) · **Hand to courier** (choose your own courier / wait for GUYUB driver) · **Mark not picked up**.
> **Rule** — server validated state transition; extension noted (PRD finding #25).

### 4.4 Verify payment

> **Contents** — list of orders `menunggu_verifikasi`: name, **unique nominal**, time of claim, proof (if uploaded), age of claim.
> **Action** — **Already entered** (→ paid off) · **Not yet entered** (→ failed + reason) · Request assistance Ops.
> **Copy** — "Check the mutation: **Rp. 45,317** from Ratna. Has it been entered?"
> **Rules** — only the merchant role can; every decision is recorded audit (PRD §5h).

### 4.5 Menu & products

> **Content** — product list per category, *out of stock* marker, popularity badge, 30-day sales quantity.
> **Action** — add/change product (name, price, category, description, photo), **mark out of stock** (auto recover next session), set order, manage categories.
> **Variants & options (PRD §34)** — three separate things, deliberately different levels of complexity:
> - **Options**: the merchant only **checks the ready-to-use group** (Spicy · Temperature · Ice · Sugar · Sambal) — doesn't write anything. You can add a maximum of 1 group yourself.
> - **Value variants**: list one dimension with prices each, max 5. Need two dimensions → create separate products.
> - **Additional**: value average list, max 8, can choose multiple.
>
> **Rules** — limits per product: 3 selection groups · 5 variants · 8 additions. The same variants & options are automatically used by Light Cashier (§4.11) so that the kitchen does not accept two formats.
> **Rules** — 1 photo (free) / 5 photos (premium); photos compressed on HP ≤ 80 KB (PRD §7.4); `PhotoTipsSheet` appears when uploading the first photo.

### 4.6 Operational hours

> **Content** — weekly schedule with **multiple sessions per day**; ready time (default 30 minutes) with preview "last order 20.40"; temporary closure duration; holiday date.
> **Rules** — PRD §5k; changes take effect immediately in discovery (60 second cache).

### 4.7 How to deliver & my courier

> **Content** — active mode (pick up yourself / my courier / GUYUB courier) + **priority order**; own shipping rules (average / per zone / free above nominal); list of **my couriers** (name, number, status).
> **Action** — add courier (create `guyub-merchant-courier` account), deactivate courier.
> **Rules** — merchant sets rules, **server calculates** shipping (PRD finding #29); the courier only saw this stall's order (PRD finding #28).

### 4.8 Customers & trust

> **Contents** — list of customers who have ordered: quantity completed, quantity not taken, trusted status.
> **Action** — Trust / Revoke trust · set stall COD policy (closed / only known / open) + nominal limit.
> **Rules** — PRD §5g; manual decisions, not automatic.

### 4.9 Messages to customers

> **Content** — welcome & thank you messages, with ready-to-use examples; preview of the display on the customer's cellphone.
> **Rules** — plain text ≤ 120 characters, **long links & numbers disapproved**, reviewed by Ops (PRD finding #24). 1 message free; premium 3 rotating + subscription customer messages.

### 4.10 Recap & finances

> **Content** — today / this week: orders, turnover, average value; **delayed shipping**; subsidy replacement; outstanding commission; export button (premium).
> **More Menu** also contains **Feedback & suggestions** (§3.14) — for merchants, follow-up via phone/WhatsApp Ops, not in-app reply (PRD §28.3).
> **Rule** — number from server; Weekly recap is the basis for settlement of fees & commissions (PRD §23.4).

### 4.11 Light cashier (Phase 4)

> **Content** — product grid → quick cart → total → **Cash / QRIS** → save; daily recap of offline + online sales; *mark expired* button directly from the grid.
> **Rules** — intentionally no shift, no valuation, no printer (PRD §18.2). Free forever; the premium one is only monthly recap & export.

### 4.12 Premium

> **Contents** — active package & end date; **bill** with unique amount + "I have transferred" button; sponsored slots: select highlighted dates & products; **ad statistics** ("views 340 · clicked 28 · made 6 orders"); broadcast promo (1×/week) with preview.
> **Rule** — feature rights resolved `PlanService` on server (PRD finding #20); broadcast never provides customer numbers to merchants (PRD finding #19).

---

## 5 — Mobile Driver (`guyub_driver`)

Bottom nav: **Home · Order · Income · Account**.
Foreground services when online; **location sent only when there is an active order**, 15 second batch (PRD §7.4, §11).

### 5.1 Login & verify

> **Fill in** — log in like a customer (HP + PIN, **required device binding** — PRD §36.5), then **verify** in three short steps (PRD §22.10):
> 1. **Self** — KTP photo, self photo, **C SIM photo**. Absolutely mandatory.
> 2. **Vehicle** — photo of STNK + photo of motorbike with visible plate. Question: *"Do you own your motorbike?"* → if **no**: fill in the owner's name & cellphone number + tick *"I use this vehicle with the owner's permission."* You can register **a maximum of 2 vehicles**, and choose which one to use today from the Homepage.
> 3. **Type of order** — *Delivery of food & goods only* (just own helmet) **or** *Including delivery of people* (needs a second SNI helmet; there is a note "don't have one? Can borrow one from GUYUB").
>
> **Rules** — SIM C cannot be passed for any reason; STNK **does not have to be in the driver's name**; Ops calls the vehicle owner once during verification; Expired vehicle registration → approved with **warning + 60 day deadline**, not denied (PRD §22.10). Not requested: SKCK, health certificate, vehicle test, deposit.
> **Condition** — status: waiting · approved · rejected (with clear reasons and how to fix it) · **needs to be completed** (eg. passenger helmet is not yet available → can still work as a courier).
> **Copy** — "Do you own your motorbike or borrow it? Both are fine, really."

### 5.2 Home

> **Content** — **large Online/Offline switch**; **today's vehicle owner** if 2 motorbikes are registered (PRD §22.10); today's summary: completed orders, revenue, active hours; **purchase bailout ceiling** and the remainder; warning of STNK documents/taxes that will expire and the remaining deadlines.
> **Rules** — online without an active order **doesn't** send location.

### 5.3 Order offer

> **Contents** — full screen card + voice: order type, name of stall & pick up zone, destination zone, **postage accepted** (detailed if additional: "Rp. 8,000 + uphill Rp. 3,000"), **terrain markers** (Flat · Uphill · Difficult roads — PRD §35.5), estimated distance, countdown **30 seconds**.
> **Action** — **Accept** · **Skip** (without penalty if the reason is safety/prohibited items).
> **Rules** — sequential bids, max 5 rounds (PRD §5a); Buying tips are only offered if the ceiling is sufficient. Orders marked **uphill/difficult are only offered to drivers who activate the "I want to accept uphill orders"** setting; rejecting hard road orders **does not decrease acceptance ratio** (PRD §35.5).
> **All in one offer (Phase 3)** — when the driver goes to/at the stall: *"There is another one from the same stall. Do you want some?"* + short countdown + **Pass without penalty**. Max 2 orders/trip, without passenger orders, both postage is accepted in full (PRD §33.3).

### 5.4 Active orders — step by step

One screen, one big button per stage:

Each stage includes **Quick Message** (§3.15) and a Call button.

| Stage | Display | Button |
|---|---|---|
| Towards the stall | Stall name & address, Navigation & Telephone buttons | **Arrived at the shop** |
| At the stall | Order details + **shipping to be accepted** | **Postage accepted** (PRD §23.4) |
| Take orders | List of items to check | **Orders taken** |
| Towards customers | Intermediate points + benchmarks, Navigation & Phone buttons | **Arrived at destination** |
| Handover | The **4 digit OTP** column from the customer, or the *Take photo* button if the customer is not there | **Done** |

> **Rule** — customer number & address appears **only** during active assignment and disappears after completion (PRD finding #5). If "Shipping received" is not pressed, the order continues and is recorded as `ongkir_tertunda` (PRD finding #30).
> **State** — offline: order details saved locally; status changes are queued and resent automatically.

### 5.5 Buying Tip

> **Contents** — customer shopping list, destination store, estimate, **remaining ceiling**; after shopping: receipt value column + **photo of receipt (required)**; *No item / different price* button → call the customer.
> **Rules** — differences > 20% must be confirmed by the customer before paying; drivers are free to refuse prohibited items without penalty (PRD §24.4).

### 5.6 Revenue

> **Contents** — today & this week: number of orders, total postage received, details per order (cash on delivery), `ongkir_tertunda` notes that have not been paid by the stall, subsidy reimbursement.
> **Rules** — transparent per order; this is what maintains driver confidence (PRD §23.4).

### 5.7 Accounts & settings

> **Contents** — profile & vehicle, documents + effective date, bid sound (volume & pitch), **"Accept ramp orders" settings** (PRD §35.5), **Feedback & suggestions** (§3.14), help (WhatsApp Ops), privacy policy, exit.

---

##6 — Notification map

| Events | To whom | Channel | Priority |
|---|---|---|---|
| New Order | Merchants | High priority FCM + repeating alarm + foreground | **Highest** |
| Order accepted / rejected | Customers | FCM | Height |
| Pay-in claims | Merchants | FCM | Height |
| Payment confirmed | Customers | FCM | Height |
| Extended estimates | Customers | FCM | Medium |
| Order ready / delivered / completed | Customers | FCM | Medium |
| Order offer | Drivers | FCM + sound | **Highest** |
| Postage delayed | Merchants & Drivers | In-app + recap | Low |
| The stall is open again (customer requested) | Customers | FCM | Low |
| Broadcast promo (premium) | Selected Customers | FCM, max 1×/week | Low |
| Subscription billing | Merchants | In-app + FCM | Low |
| **Quick message** from the other party | Customer / Merchant / Driver | FCM | High (only when the order is active) |
| Reply to input | Input sender | In-app (+ WhatsApp/phone for partners) | Low |
| **News from GUYUB** | All users | In-app, 1×/week during pilot | Low |

**Backup**: Merchant & Driver app still polls lightly every 20 seconds as long as there are active orders — FCM is an acceleration, not the only path (PRD §7.3).

---

##7 — Per-screen permission matrix (compact)

| Screen | Role | Permissions |
|---|---|---|
| Cart & order | `guyub-customer` | `guyub_order.create` |
| Assessment | `guyub-customer` (order owner completed) | `guyub_review.create` |
| Accept/reject orders | `guyub-merchant-owner`, `guyub-merchant-staff` | `guyub_order.accept` |
| Payment verification | `guyub-merchant-owner` | `guyub_payment.approve` |
| Menu & prices | `guyub-merchant-owner` | `guyub_merchant.update` |
| My courier | `guyub-merchant-owner` | `guyub_courier.create` |
| Order active driver | `guyub-driver` | assigned orders only |
| Order active by merchant courier | `guyub-merchant-courier` | `business_id` his stall **and** assigned to him |
| Advertising & broadcast slots | `guyub-merchant-owner` + active subscription | `guyub_ad.create` |
| Feedback & suggestions | all authenticated roles | `guyub_feedback.create` |
| Partner verification, complaints, feedback | `guyub-ops` | `guyub_ops.complaint_handle`, `guyub_feedback.view/handle` |

Every new screen must pass the 8-step checklist RBAC (DNA Berdikari §9j), including **rejection path test**.

---

##8 — Bad offline & network behavior

| Application | Who continues to work | Those in line | Which is blocked |
|---|---|---|---|
| Customers | Recent history & status, local countdown | — | Creating an order (requires server validation) |
| Merchants | List of local saved active orders, details & items | Accept/reject, mark ready | Payment verification (requires latest data) |
| Drivers | Active order details, address, OTP | All status changes, photos | Receive new offers |

General rule of thumb: every queued post uses the same `Idempotency-Key` when retransmitted (PRD Inv. 4), and users see a "not yet connected" marker — not a failure screen.

---

## 9 — Screen per phase

| Phase | Web | Customers | Merchants | Drivers |
|---|---|---|---|---|
| **0** | Home, legal, partner registration, status | framework + login/register | framework + enter | — |
| **1** | `/w/<slug>` | homepage, stall list & profile, cart, QRIS, order status, history, **feedback & suggestions** | homepage, incoming orders, payment verification, menu, opening hours, delivery method & my courier, customer messages, **feedback & suggestions** | — |
| **2** | — | driver card in status, **instant message (§3.15)**, assessment | hand it over to the courier, +5 minutes, **fast order** | entire application (§5.1–5.4, 5.6) + **instant messaging** |
| **3** | — | motorbike taxi, buying and selling, travel directory | — | entrust purchase (§5.5) |
| **4** | `/wisata/<slug>` | tourist tickets | light cashier, scan ticket | — |
| **5** | — | — | premium, billing, advertising statistics, broadcast | — |
| **6** | enhanced status page | empty/failed state audit | empty/failed state audit | empty/failed state audit |
