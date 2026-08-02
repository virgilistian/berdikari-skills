# Phase 1 — Culinary: self-pickup + merchant courier · per platform

**Week 7–20 · Sep–Dec 2026 · tag `v0.2.0`** (+ public launch week 21–22)
References: PRD §12, §37.3, §37.4 (Phase 1 sequentially — **money track first, view later**) · doc 18 §2.2, §3, §4 · doc 19 §3.
Index: [`00-indeks.md`](00-index.md)

**Phase pass gate** (PRD §37.3, §26.2, §26.5):
- **8 mandatory tests §26.2** passed (#7 GUYUB courier postage to follow in Phase 2).
- **≥ 15 verified stalls** with live `/w/<slug>` page.
- **Pilot covered 2 weeks with no money incidents.**
- Practice restore in RTO · copy read aloud against §17 · real rollback to previously tested tag in staging.

---

## 1 — Summary per platform

| Platforms | Those born in this phase |
|---|---|
| **API** | Variant/choice/additional catalogue, cart→checkout server price, unique nominal QRIS payment gateway, COD & trust, state machine + queue number + error code, ETA, merchant fulfillment & courier mode, merchant message, public projection + discovery, input channel |
| **WEB** | `/w/<slug>` (**most important pages**), JSON-LD + sitemap, public homepage comes to life; Minimum Ops console: merchant verification, payment aging, place list, message moderation, feedback |
| **CUS** | Home, discovery & search, shop profile, product details, basket & checkout, QRIS, order status, history/notifications/account, assessment following F2, feedback & suggestions |
| **MER** | Home + Open/Close switch, incoming orders, order list & details, payment verification, menu & variants, operating hours, delivery method & my courier, customers & trust, customer messages, feedback & suggestions |
| **DRV** | — (Phase 2). Merchant couriers in Phase 1 are marked **via the Merchant application**, not the Driver | application
| **SHR** | `CountdownTile`, `MerchantCard`, `ProductCard`, `OpenStatusBadge`, `StatusChip`, `PhotoTipsSheet`, `feedback_sheet`, `voice_recorder`, error code regeneration |

---

## 2 — Critical path & parallelization

**Required order** (PRD §37.4 — money path first):

```
F1.1 katalog → F1.2 checkout → F1.3 PEMBAYARAN → F1.4 COD → F1.5 mesin status → F1.6 ETA
                                                                  → F1.7 kurir merchant
                                                                  → F1.8 pesan merchant
                                                                  → F1.9 discovery (sengaja di belakang)
                                                                  → F1.10 masukan (sebelum pilot!)
```

**F1.3 is the heart.** If this part isn't right, there's no point in continuing.

**F1.9 is deliberately behind**: discovery feels like progress, but doesn't prove anything about whether stalls will use this system. In closed pilots, merchants share the link directly.

**May run in parallel** — WEB and MER loads are not interlocked:

| Parallel | Contents | Why is it safe |
|---|---|---|
| F1.0 ⊕ (MER homepage & opening hours) ‖ F1.1 (API catalogue) | The merchant UI uses ready-made F0.3 contracts | Don't touch `Ordering` |
| F1.11 (Console Ops) ‖ F1.9–F1.10 | Store `guyub.ts` is separate from the existing store | No file collision |
| F1.12 ⊕ (CUS history/account) ‖ F1.8 | Read only existing endpoints | — |

---

## F1.0 ⊕ — Merchant Home & operating hours (UI)

**Week 7, parallel F1.1** · doc 18 §4.1, §4.6 · PRD §5k
⊕ **Addition from dock 18**: The API finishes at F0.3, but dock 19 has no line for the screen. Without this, doc 18 §9 ("Phase 1 · Merchant · opening hours") is not fulfilled.

| Platforms | Engage | Sequence |
|---|---|---|
| MER | ✅ | 1 |
| API | it is finished at F0.3 | — |

### MER

- `lib/ui/features/home/home_page.dart` `+` — **large Open/Close switch** with running status ("Open · close 21.00 · last order 20.40"); today's summary (incoming orders, turnover, pending); Shortcuts Payment verification · Menu · Opening hours.
- `lib/ui/features/hours/{hours_page,close_duration_sheet,closures_page}.dart` `+` — weekly schedule **multi-session**, ready time (default 30 minutes) with preview "last orders 20.40", temporarily closed **mandatory duration**, holiday dates.
- `lib/data/repositories/merchant_repository.dart` `+` — `GET|PUT hours`, `PUT prep-time`, `POST close|open`, `closures`.
- `guyub_ui/src/widgets/open_status_badge.dart` `+` (SHR) — "Open" · "Close in 40 minutes" · "Close · Open again 06.00".

**Done when** — closing stall **always** asks for duration; the status that appears comes from the server (the client never calculates open/close itself).

---

## F1.1 — Catalog: variants, options, additions

**Week 7–8** · PRD §34, finding #35 · doc 18 §3.5, §4.5 · doc 19 F1.1

| Platforms | Engage | Sequence |
|---|---|---|
| API | ✅ heavy | 1 |
| MER | ✅ | 2 |
| SHR | ✅ light | 2 |
| CUS | consumption at F1.2 | 3 |

### API

- Migration `+`: `…_create_guyub_product_option_groups_table` (`product_id`, name, `preset_key`, required/optional, sequence), `…_create_guyub_product_options_table`, `…_create_guyub_product_addons_table`; `…_add_guyub_fields_to_product_variants` `~` (`is_sold_out` per variant — variant uses the **existing** `Catalog` structure).
- Models `+` `Tenantable`: `ProductOptionGroup`, `ProductOption`, `ProductAddon`.
- `config/guyub-option-presets.php` `+` — ready-to-use groups Spicy · Temperature · Ice · Sugar · Chili (§34.1) — **words, not numbers**.
- `ProductOptionService.php` `+` — hard limit **3 groups · 5 variants · 8 additions**; max 1 group created by merchant.
- `Contracts/ProductPricingContract.php` `+` — `resolve(productId, variantId, optionIds[], addonIds[])` → price + **ownership verification** (finding #35).
- `ProductOptionController.php` `+` · `GuyubProductResource.php` `+` — explicit field, "from Rp ..." if there is a variant.
- Test `ProductOptionOwnershipTest` `+` — `addon_id` belongs to another product → **rejected**.

### MER

- `lib/ui/features/menu/{menu_page,product_form_page,option_group_sheet,variant_editor,addon_editor}.dart` `+` — merchant **checked preset group, did not type**; variant costs max 5; max additional 8; mark finished.
- `lib/data/repositories/menu_repository.dart` `+`.
- Photos: 1 free / 5 premium, compressed on HP ≤ 80 KB (§7.4).

### SHR

- `guyub_ui/src/widgets/{product_card,photo_tips_sheet}.dart` `+` — *Best Selling* / *Most Liked* / *New* badge; `PhotoTipsSheet` appears on first photo upload (§27.3).

**Done when** — rice stalls can set the spiciness & portion, coffee stalls can set hot/cold, and **3/5/8 limits cannot be exceeded by clients**.

---

## F1.2 — Cart, place list, checkout with server prices

**Week 8–10** · PRD Inv. 2 & 4, §5a, §5k, finding #22 · doc 18 §3.4–3.6 · doc 19 F1.2

| Platforms | Engage | Sequence |
|---|---|---|
| API | ✅ heavy | 1 |
| CUS | ✅ heavy | 2 |
| MER | — | — |

> **Waiting** `guyub-places.csv` from field survey (F0.9). Without a list of places, checkout cannot be tested at all.

### API

- Marketplace `+`: `…_create_guyub_zones_table`, `…_create_guyub_places_table` (village/hamlet/benchmark, lat/lng, zona, **`kelas_medan`** flat/uphill/difficult), `database/data/guyub-places.csv`, `GuyubPlacesSeeder`, `PlaceController` (`GET /guyub/places` — village → hamlet → benchmark).
- Ordering `+`: `…_create_guyub_orders_table` (ULID PK; `order_type`, two status fields, `business_id`, `customer_id`, `ref`, `queue_no`, `idempotency_key` unique, total server-side, `promised_ready_at`, `promised_delivery_at`, `ready_at_actual`, `eta_extend_count`, `fulfillment_mode`, `delivery_fee`, `delivery_fee_recipient`, `courier_payout`, `courier_paid_at`, `subsidy_amount`; index `(business_id,status)`, `(customer_id,created_at)`), `…_create_guyub_order_items_table` (**snapshot** price & name), `…_create_guyub_order_item_options_table`, `…_create_guyub_order_events_table` (append-only, source dispute & audit).
- `OrderPricingService.php` `+` — subtotal + shipping + commission **all from the server**.
- `CreateOrderAction.php` `+` — transaction: revalidate opening hours & message limits → calculate → snapshot → unique nominal allocation.
- `CreateOrderRequest.php` `+` — only `product_id`, `variant_id`, `option_ids[]`, `addon_ids[]`, `qty`, `place_id`, records ≤ 100 characters. **The nominal amount from the client is completely ignored.**
- `OrderResource.php` `+` (explicit fields per lens §6.4) · `OrderController.php` `+` — `POST|GET /guyub/orders`, `GET /{id}`, `POST /{id}/cancel`.
- `Modules/Core` `+`: `IdempotencyKey` middleware (required in all POST mutations, save first response) + `…_create_idempotency_keys_table` with **unique constraint in DB** (finding #3).
- Test `+`: `OrderValueAuthorityTest` (§26.2 #3), `OrderIdempotencyTest` (#2), `CheckoutClosingHoursTest` (#5 — 422 + next opening hours, **cart not deleted**).

### CUS

- `lib/ui/features/merchant/{merchant_page,product_detail_page}.dart` `+` — dock screen sequence 18 §3.5: photo → name → price → badge → **valuable variant** → **select group (pills)** → **addition (check)** → note → quantity + total that **changes**.
- `lib/ui/features/cart/{cart_page,place_picker_sheet}.dart` `+` — **one basket = one stall**; how to receive; interpoint from list of places + benchmark ≤ 120 characters; payment method (only those permitted by the server); cost breakdown; Order button.
- `lib/data/local/cart_store.dart` `+` — bucket **on the client**, never a server table.
- `lib/data/repositories/order_repository.dart` `+` — send intent, receive value.
- Condition: merchant closed unexpectedly → banner, Order button is off, offer "Remind me when open".

**Done when** — three tests §26.2 (#2, #3, #5) green; **client never sent a single amount**; Out of stock product appears gray and cannot be added.

---

## F1.3 — Payment gateway: static QRIS + unique amount + merchant verification

**Week 10–12** · PRD §5h, Non-negotiable 13 & 14, findings #12 & #14 · doc 18 §3.7, §4.4 · doc 19 F1.3

> **This is the heart.** It must not be moved for any reason (§37.7).

| Platforms | Engage | Sequence |
|---|---|---|
| API | ✅ heavy | 1 |
| CUS | ✅ | 2 |
| MER | ✅ | 2 |

### API

- Scaffold `Modules/Payment/**` `+`.
- `…_create_guyub_payments_table` `+` — method, `status_bayar`, `unique_amount`, claim & verify time, verifier actor; **unique partial `(business_id, unique_amount)` for active payments**.
- `…_create_guyub_payment_claims_table` `+` — append-only: claim + optional evidence + result + reason.
- `…_add_qris_to_guyub_merchants_table` `~` — `qris_image_path`, `qris_owner_name` (**merchant owned, never platform owner account**).
- `Contracts/PaymentVerifier.php` `+` + `Verifiers/ManualMerchantVerifier.php` `+` — path up to webhook without changing domain (§5h.4).
- `UniqueAmountAllocator.php` `+` — 3 unique digits, allocated **inside transaction**, TTL 15 minutes, released after.
- `PaymentGateService.php` `+` — methods that the customer **may** choose (§5g + §23.4).
- `PaymentController.php` `+` — `GET /guyub/orders/{id}/payment`, `POST /{id}/payment/claim` (**make claims only**).
- `MerchantPaymentController.php` `+` — `confirm`, `reject`, `amount-mismatch`, `GET pending`.
- `PaymentPolicy.php` `+` — customer **never** had `guyub_payment.approve`.
- Jobs `+`: `ExpireUnpaidOrdersJob` (15 minutes without claim → system cancel), `RemindPendingVerificationJob` (merchant reminder every 10 minutes).
- `Modules/Core/PresignedUploadService.php` `+` — **server created object name (UUID)**, type & size validated, never under `public/` (finding #9). Reused for proof of payment, finished photos, and input.
- `config/guyub-errors.php` `~` — `GYB-PAY-301/302/303`.
- Test `+`: `PaymentClaimAuthorityTest` (§26.2 #4 — customer marked keel → 403), `UniqueAmountCollisionTest` (#6).

### CUS

- `lib/ui/features/payment/qris_page.dart` `+` — QR merchant + **"Pay exactly IDR 45,317"** + copy button + one line explanation why the number is unique + 15 minute countdown + **I've paid** + upload proof (optional).
- Pressing the button → status `menunggu_verifikasi`, moves to Order Status. **Not** paid off.

### MER

- `lib/ui/features/payments/{pending_list_page,confirm_sheet}.dart` `+` — `menunggu_verifikasi` list: name, unique amount, claim time, proof, claim age. Copy: *"Please check the mutation: **Rp. 45,317** from Ratna. Is it entered?"* → **Already entered** / **Not yet entered** (+ reason) / Request assistance from Ops.
- `lib/ui/features/home/pending_verification_card.dart` `+` — **cannot be closed** "Waiting to check: 2 orders" card.

**Done when** — pressing "I have paid" **does** change the status to paid; **only merchants** can; proof never changes status; expired → auto cancel and nothing is cooked.

---

## F1.4 — COD Trust & "Ask to pay first"

**Week 12–13** · PRD §5g, findings #13 & #15 · doc 18 §4.8 · doc 19 F1.4

| Platforms | Engage | Sequence |
|---|---|---|
| API | ✅ | 1 |
| MER | ✅ | 2 |
| CUS | ✅ light | 2 |

### API

- Migration `+`: `…_create_guyub_merchant_cod_settings_table` (`cod_policy` default `pelanggan_dipercaya`, default nominal limit IDR 100,000), `…_create_guyub_trusted_customers_table` (unique `(business_id, customer_id)` — **not transmitted between merchants**), `…_create_guyub_customer_reliability_table` (`selesai`, `gagal_tidak_diambil`, `batal_setelah_diterima`, `cod_blocked_until`).
- `CodPolicyService.php` `+` — who can COD, nominal limit, block 30 days after 2 incidents.
- `CustomerReliabilityService.php` `+` — **explicit & human readable** rules, not opaque scores.
- `Listeners/UpdateReliabilityOnOrderClosed.php` `+` — listen to `OrderCompleted` / `OrderNotPickedUp`.
- `MerchantCodController.php` `+` — `PUT cod-settings`, `GET customers/{id}/summary`, `POST trust|untrust`.
- Test `CodPolicyTest` `+` — COD does not appear for new customers at merchant `pelanggan_dipercaya`.

### MER

- `lib/ui/features/customers/{customer_list_page,customer_card,cod_settings_page}.dart` `+` — customer card displays **numbers as is** (5 completed · 1 not collected) + [Call first] [Accept] [Ask to pay first] [Reject]. **manual** decisions, not automatic.

### CUS

- `lib/ui/features/checkout/payment_method_picker.dart` `+` — only **server-allowed** methods. The client never decides the eligibility of COD.

**Done when** — "Request payment first" returns the order to `menunggu_pembayaran`; marking `gagal_tidak_diambil` **only valid** from status `disiapkan`/`siap` and recorded audit.

---

## F1.5 — State machine, transaction number, queue number, error code

**Week 13–15** · PRD §5d, §31, §32, findings #4 & #7 · doc 18 §4.2–4.3, §3.8 · doc 19 F1.5

| Platforms | Engage | Sequence |
|---|---|---|
| API | ✅ heavy | 1 |
| SHR | ✅ | 2 |
| MER | ✅ | 3 |
| CUS | ✅ | 3 |

### API

- `config/guyub-order-states.php` `+` — matrix **(origin state × actor × destination state)** as data.
- `OrderStateMachine.php` `+` — illegal transition → `422` + `GYB-ORD-303` + audit; **no status can be reversed**.
- `OrderRefGenerator.php` `+` — `YYMMDD-847293`, 6 random digits (0-9), no letter prefix, unique per (type, date).
- `QueueNumberService.php` `+` — **daily per merchant** sequence number, assigned at **Receive**; reset at first open session; **one sequence for all channels** (ready to use Cashier Lite F4).
- `OrderPolicy.php` `+` — three lenses §6.4 (merchant / customer / driver), fields per lens.
- `MerchantOrderController.php` `+` — `accept` (+`eta_minutes`), `reject` (reason), `ready`, `request-prepay`, `not-picked-up`, `GET summary`.
- Jobs `+`: `AutoCancelUnconfirmedOrdersJob` (merchant response 5 minutes), `AutoCloseUnresponsiveMerchantJob` (3 missed orders in 30 minutes → stall closes automatically), `ExpirePickupDeadlineJob` (pick up limit 60 minutes).
- `Core/Exceptions/GuyubException.php` `+` + `bootstrap/app.php` `~` — render → Laravel error form + `X-Request-Id`.
- `config/guyub-errors.php` `~` — `GYB-ORD-301..304`, `GYB-MRC-201`.
- Test `OrderTransitionRbacTest` `+` — §26.2 #1: driver marks complete without privileges → 403; customer marks accepted → 403.

### SHR

- `guyub_core/src/errors/guyub_error_codes.g.dart` `~` — **regeneration** of config API.
- `guyub_ui/src/widgets/error_state.dart` `~` — show 5 character trace code + link *"Tell us what happened"* (goes to F1.10).
- `guyub_ui/src/widgets/status_chip.dart` `+` — color per state, Language label.

### MER

- `lib/ui/features/orders/{order_list_page,order_detail_page}.dart` `+` — New tab · Prepared · Delivered · Completed · Cancel; **line item skimmed** by person holding frying pan: `1× Nasi Goreng (Jumbo) — Pedas banget, sambal dipisah, +Telur` (§34.6).
- `lib/ui/features/orders/incoming_order_page.dart` `~` — full-screen class up card: **large queue number** + transaction number, item + note, first name + **trust marker** (“New customer” / “5 orders completed” / “1 time not picked up”), payment method & status, receive method, order value; action Accept / Request payment first / Reject (select reason) / Call.

### CUS

- `lib/ui/features/order_status/order_status_page.dart` `~` — **big queue number** ("Order number 7") + small transaction number (`260730-847293`) + vertical status timeline + stall card + cost details + Cancel button (according to the rules) + Help.

**Done when** — each transition has a **valid actor**; each failure has code +`request_id`; **queue number does not leave a hole** when order is cancelled.

---

## F1.6 — Estimate ready & countdown

**Week 15** · PRD §5l, finding #25 · doc 18 §3.8, §4.3 · doc 19 F1.6

| Platforms | Engage | Sequence |
|---|---|---|
| API | ✅ | 1 |
| SHR | ✅ | 2 |
| MER | ✅ | 3 |
| CUS | ✅ | 3 |

### API

- `EtaService.php` `+` — `promised_ready_at = diterima + estimasi_merchant`; **send timestamp, not remaining minutes**.
- `MerchantOrderController.php` `~` — `POST .../extend-eta`, **max 2×**, logged.
- `…_create_guyub_merchant_eta_stats_table` `+` + `RecomputeEtaStatsJob` `+` — basic suggestion *"usually you need 22 minutes"* after 20 orders.

### SHR

- `guyub_ui/src/widgets/countdown_tile.dart` `+` — **local** countdown from timestamp; missed → calming sentence, **never a minus number**.

### MER

- `lib/ui/features/orders/accept_eta_sheet.dart` `+` — big button 10 · 15 · 20 · 30 · 45 minutes; **+5 minutes** button (max 2×) in order details.

### CUS

- `lib/ui/features/order_status/cancel_free_banner.dart` `+` — after second renewal → **Cancel for free**.

**Done when** — the countdown continues **without network** and **does not trigger a single additional poll**.

---

## F1.7 — Merchant fulfillment & courier mode

**Week 16–17** · PRD §23.1, §23.2, §23.5, findings #28 & #29 · doc 18 §4.7 · doc 19 F1.7

> This is what makes road delivery from Phase 1 **without having a single driver**.

| Platforms | Engage | Sequence |
|---|---|---|
| API | ✅ | 1 |
| MER | ✅ | 2 |
| DRV | — (account `guyub-merchant-courier` lights up on F2.4) | — |

### API

- `…_add_fulfillment_to_guyub_merchants_table` `~` — `fulfillment_modes[]`, priority order, `own_courier_fee_rule` (average/zone/free over X), `own_delivery_zones`.
- `DeliveryFeeRuleService.php` `+` — merchant sets **rules**, server that **calculates** (finding #29).
- `FulfillmentController.php` `+` — `PUT fulfillment`, `PUT delivery-fee-rule`.
- Scaffold `Modules/Delivery/**` `+` + `…_create_guyub_drivers_table` `+` — includes **`owner_business_id` nullable**; filled = merchant's courier.
- `MerchantCourierController.php` `+` — `GET|POST|DELETE /guyub/merchant/couriers`, `POST orders/{id}/assign-courier`.
- `CourierOrderPolicy.php` `+` — **fourth lens**: `business_id` his stall **and** assigned to him **and** active assignment.
- Test `MerchantCourierLensTest` `+` — Stall A courier opens Stall B order → 403 + `GYB-MRC-201`.

### MER

- `lib/ui/features/fulfillment/{fulfillment_page,courier_list_page,fee_rule_form}.dart` `+` — active mode + priority order + shipping rules + my courier list (add courier = create `guyub-merchant-courier` account).
- `lib/ui/features/orders/mark_delivering_sheet.dart` `+` — for couriers who **don't use the app**: merchants mark "delivered"/"completed" themselves (§23.2).

**Finish when** — the stall with its own courier can sell fully; `kurir_merchant` mode shipping **100% owned by the merchant, zero deduction**.

---

## F1.8 — Merchant welcome & thank you message

**Week 17** · PRD §5m, finding #24 · dock 18 §4.9 · dock 19 F1.8

| Platforms | Engage | Sequence |
|---|---|---|
| API | ✅ | 1 |
| MER | ✅ light | 2 |
| WEB | ✅ light (Ops moderation) | 2 |
| CUS | display in F1.2/F1.5 (stall profile & finish screen) | — |

### API

- `…_create_guyub_merchant_messages_table` `+` — text, type, active, moderation status.
- `Rules/NoLinkOrLongDigits.php` `+` — **links & long strings of numbers blocked**; plain text ≤ 120 characters, escaped.
- `MerchantMessageService.php` `+` — only `{nama}` is supported; any changes → Ops review queue + audit.
- `MerchantMessageController.php` `+` — `GET|PUT /guyub/merchant/messages`.
- Test `MerchantMessageContentTest` `+` — §26.2 #8: link & account number rejected.

### MER

- `lib/ui/features/messages/messages_page.dart` `+` — ready-to-use template + **preview of appearance on customer's cellphone**.

### WEB

- `web/app/pages/guyub/moderasi-pesan.vue` `+` — Ops review queue.

**Done if** — the account number and link cannot get through to the customer's screen, via any route.

---

## F1.9 — Public projection, discovery, and `/w/<slug>`

**Week 18–19** · PRD §6.3, §20, findings #1, #8, #26 · doc 18 §2.1–2.2, §3.2–3.3 · doc 19 F1.9

| Platforms | Engage | Sequence |
|---|---|---|
| API | ✅ heavy | 1 |
| WEB | ✅ heavy | 2 |
| CUS | ✅ heavy | 2 (parallel WEB) |
| SHR | ✅ | 2 |

### API

- `+` migration: `…_create_merchant_public_profiles_table` (only public columns + schedule + package markers), `…_create_catalog_public_items_table` (+ aggregated popularity, filled in F2.8).
- `Projections/{MerchantProjector,CatalogProjector}.php` `+` + `RefreshProjectionListener.php` `+` + `RebuildPublicProjectionJob.php` `+` — recharged by `MerchantOpened`/`MerchantUpdated`/`ProductUpdated`; full rebuild for recovery & migration.
- `DiscoveryController.php` `+` — `GET /guyub/merchants?zone=&type=`, **max pagination 50**, required radius, anonymous rate limit.
- `PublicMerchantController.php` `+` — `GET /guyub/merchants/{slug}` + product.
- Resources `+` — **whitelist explicit fields**; cell phone number only if the merchant agrees (finding #26).
- `Marketplace/routes/api.php` `~` — public group + edge cache header **60 seconds**.
- Test `PublicProjectionLeakTest` `+` — public endpoint **never** touches the tenant table.

### WEB

- `web/app/pages/publik/w/[slug].vue` `+` — **most important pages**: name & photo, opening status + today's hours + "Open again...", hamlet-level address, group menu + price + badge, "Prices subject to change", **Order in app** button (deep link, Play Store fallback). Shop closed → page remains complete, button replaced "Open again tomorrow 06.00".
- `web/app/components/publik/LocalBusinessJsonLd.vue` `+` — `schema.org/LocalBusiness`; The title contains the name of the shop + village + sub-district.
- `web/server/routes/sitemap.xml.ts` `+` — automatic sitemap of public projections; **`noindex` if not verified**.
- `web/app/pages/publik/index.vue` `~` — list of currently open stalls (live data).

### CUS

- `lib/ui/features/home/home_page.dart` `+` — hourly greeting, search box, category, **top active orders card** with countdown, “Today's Picks” (max 3, labeled *Sponsored*), “Open now near you”, “Most liked this week”. Empty: *"The stalls are closed again. Try again at 6 am."* + list of what will be open.
- `lib/ui/features/discovery/{merchant_list_page,search_page}.dart` `+` — category/open only/zone filter; closest order · best selling · most liked; **stall closed below with label**.

### SHR

- `guyub_ui/src/widgets/{merchant_card,sponsored_label}.dart` `+` — "Closing in 40 minutes — book now"; `SponsoredLabel` is mandatory on every paid slot.

**Done when** — green cross-tenant leak test; **stand-alone shop page without application**; closed stalls never appear on the home page or top of the list; max 20% sponsored proceeds.

---

## F1.10 — Feedback & suggestions channels

**Week 19–20** · PRD §28 · doc 18 §3.14 · doc 19 F1.10

> **Must be on before pilot starts, not after** (§37.4.10). May not be shifted (§37.7).

| Platforms | Engage | Sequence |
|---|---|---|
| API | ✅ | 1 |
| SHR | ✅ | 2 |
| CUS | ✅ | 3 |
| MER | ✅ | 3 |
| WEB | ✅ (Ops side) | 3 |

### API

- `…_create_guyub_feedback_table` `+` — `user_id`, `role`, `quick_choice`, `text`, `audio_path`, `image_path`, `context` (JSON), `no_contact`, `status`, `tags[]`, `handled_by`, `resolved_at`; `…_create_guyub_feedback_replies_table` `+`.
- `GuyubFeedbackController.php` `+` — `POST /guyub/feedback`, `GET /guyub/feedback/mine`; max **5 shipments/day**.
- `FeedbackContextSanitizer.php` `+` — technical context auto-includes; **never** contains tokens or cellphone numbers.

### SHR

- `guyub_core/src/feedback/{feedback_repository,voice_recorder}.dart` `+` — record **Opus mono ~16 kbps, max 60 sec**, limited on recorder, **no server transcoding** (§25.6).
- `guyub_ui/src/widgets/feedback_sheet.dart` `+` — quick selection **in the form of a sentence** + story box (≤ 1,000 characters, warning *"Don't write PIN or account number here."*) + **voice record button the size of a text box** + attachment of 1 image + tick *"No need to contact, just want to let you know"*.

### CUS & MER

- `lib/ui/features/feedback/feedback_page.dart` `+` (both) — quick selection **different per role**.
- **Three entrances** must be active: (1) Account menu, (2) Help page, (3) **small link on each failure screen** with the option *There is an error* selected and the context filled in.
- "My feedback": list of own submissions + status (Accepted → Read → Actioned / Closed).

### WEB

- `web/app/pages/guyub/masukan.vue` `+` — Ops side: read, mark, reply.

**Done when** — three live entrances with context filled; offline submissions **queued and sent automatically**; Send is active even if the text box is empty as long as there is a quick / sound / image option.

---

## F1.11 — Minimum Ops console

**Week 20, parallel** · PRD §6.6 · doc 19 F1.11

Only that **blocks launch**; Complete operations follow in Phase 5.

| Platforms | Engage |
|---|---|
| WEB | ✅ |

- `web/app/stores/guyub.ts` `+` — **new Pinia store**; do not touch existing stores (DNA §2.4).
- `web/app/pages/guyub/merchants.vue` `+` — merchant verification + partner registration queue (from F0.7).
- `web/app/pages/guyub/pembayaran.vue` `+` — list of **aging** payment claims (§5h).
- `web/app/pages/guyub/tempat.vue` `+` — CRUD list of places & zones.
- `web/app/config/nav.ts` `~` — new nav item, **permission driven** (DNA §9f).
- `web/app/utils/permissions.ts` `~` — `PermissionSeeder` reflection for `guyub_*`.

**Done when** — Ops can verify merchants, view aging claims, and correct listings **without going into the database**.

---

## F1.12 ⊕ — History, Notifications, and Account (Customer)

**Week 20, parallel** · doc 18 §3.13, §3.9 · PRD §19.5, §28.3
⊕ **Addition from dock 18**: dock 19 has no rows for these three screens, but dock 18 §9 demands "history" in Phase 1 and bottom nav 4 items already show Orders · Notifications · Accounts since F0.4.

| Platforms | Engage |
|---|---|
| CUS | ✅ |
| API | existing endpoint from F1.2/F1.5 + existing `Modules/Core` notification |

- `lib/ui/features/orders/history_page.dart` `+` — order list + status + button **"Order again"**.
- `lib/ui/features/notifications/notifications_page.dart` `+` — list + unread marks; FCM & in-app sources; contains **"News from the GUYUB"** (§28.3).
- `lib/ui/features/account/account_page.dart` `+` — name, phone number, favorite places, **Feedback & suggestions** (F1.10), help, privacy policy, **delete account** (§19.5), log out.
- `lib/ui/features/order_status/order_done_page.dart` `+` — summary + **merchant thank you message** (F1.8) + "Rate" (active in F2.8) + "Order again".

**Done when** — all four bottom nav tabs have real content; **delete account** actually calls the §19.5 path, not a dead link.

---

## 8 — Phase 1 weekly calendar

| Sunday | API | WEB | CUS | MER | SHR |
|---|---|---|---|---|---|
| 7 | F1.1 catalog | — | — | **F1.0 ⊕** homepage & opening hours | F1.1 `ProductCard` |
| 8 | F1.1 → F1.2 | — | F1.2 product profile & details | F1.1 menu & variants | — |
| 9–10 | F1.2 checkout | — | F1.2 cart & checkout | — | — |
| 10–11 | **F1.3 payment** | — | F1.3 QRIS | F1.3 pay verification | — |
| 12 | F1.3 → F1.4 | — | F1.4 method selector | F1.3/F1.4 | — |
| 13 | F1.4 → F1.5 | — | — | F1.4 customer & COD | — |
| 14–15 | F1.5 state machine | — | F1.5 order status | F1.5 order entry & register | F1.5 `StatusChip`, error codes |
| 15 | F1.6 ETA | — | F1.6 void free | F1.6 sheet estimate | F1.6 `CountdownTile` |
| 16–17 | F1.7 fulfillment | — | — | F1.7 my courier | — |
| 17 | F1.8 merchant messages | F1.8 moderation | — | F1.8 customer messages | — |
| 18–19 | F1.9 projection & discovery | F1.9 `/w/<slug>` + sitemap | F1.9 home & discovery | — | F1.9 `MerchantCard` |
| 19–20 | F1.10 input | F1.10 Input ops | F1.10 + **F1.12 ⊕** | F1.10 input | F1.10 `feedback_sheet` |
| 20 | — | **F1.11 Console Ops** | F1.12 ⊕ | — | — |

---

##9 — Public launch (weeks 21–22)

Not the development phase — **gate**. There are no new features in these two weeks.

**Mandatory test §26.2** (#1 rejection path RBAC · #2 idempotency · #3 value authority · #4 payment status · #5 operating hours · #6 unique nominal · #8 merchant messages; #7 postage following Phase 2), plus:

| Item | Responsible platform |
|---|---|
| Restore exercises in RTO | INF |
| Closed pilot 2 weeks **no cash incidents** | All |
| ≥ 15 verified stalls + `/w/<slug>` live | WEB + Ops |
| New copy **read aloud** to §17 | CUS, MER, WEB |
| Real rollback to previous tag in staging | INF |
| Field test §26.3 on a real cheap Android phone | CUS, MER |

Complete Go/No-Go criteria: **PRD §26.5 (8 points)**.

---

## 10 — Notes & assumptions of this phase

1. **Two markers ⊕**: `F1.0` (Merchant's homepage & opening hours) and `F1.12` (history/notifications/Customer account). Both are implied in dock 18 §9 but have no lines in dock 19. If the phase scope must be truncated, this is the safest to reduce — **but the bottom nav cannot have empty tabs**.
2. **Rating (§5i) is missing in Phase 1.** The “Rate” button in F1.12 leads to a screen that just comes to life in F2.8 — hide the button until then, don't show the off button.
3. **Merchant couriers are marked via the Merchant application**, not the Driver application (which doesn't exist yet). PRD §23.2 allows both — not a reduction in scope, but **required to be mentioned to the merchant during onboarding**.
4. **`guyub_places` & `guyub_zones` enter Phase 1** (checkout required); `guyub_fare_matrix` awaits Phase 2 (GUYUB courier required) — as per §37.2.
5. **F1.10 must not be shifted** even if the phase is lagging (§37.4.10, §26.4). If you have to cut, cut F1.9 (discovery) — in closed pilot merchant shares direct link.
