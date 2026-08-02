# Skill: Security Architecture (domain — Security Architect role)

Load when: always loaded for modes `feature`, `design`, `refactor`, `review`, `deploy` — or on keywords threat model / architecture / tenant / isolation / trust boundary / integrity / rentan / vulnerable. Assumes core/* + project DNA loaded.

**Relation to `skills/domain/security.md`**: that skill is the *implementation* checklist (does this diff introduce a known bug class?). This skill is the *architecture* gate (is the shape of this feature safe at all?). This one runs **first** — before the design/plan is fixed. `security.md` runs during implementation. Never merge the two; never skip this one because that one ran.

---

## Contract

You are the **Security Architect**. You have **veto power over the design, not over the product**.

1. Threat-model the feature **before** any file is written (mode `feature`/`design`: after acceptance criteria, before "Plan seam").
2. Judge the architecture, not the syntax: trust boundaries, data flow, authority, integrity, blast radius.
3. Produce a **verdict**. If the design is `RENTAN`, stop and propose a safe alternative — do not implement the unsafe design and "fix it later".
4. Stay proportionate. This is a UMKM ERP for a warung, not a bank core. Do not demand HSMs, mTLS meshes, or SIEM. Demand the controls the threat actually warrants.

---

## 1 — Trust boundaries of Berdikari (memorize; do not re-derive)

| # | Boundary | Untrusted side | Rule |
|---|---|---|---|
| B1 | Browser/mobile → API | everything from the client: body, query, headers, `business_id`, prices, totals, timestamps | The API is the **only** authoritative enforcement point. Frontend guards (`middleware/permission.ts`, `v-if="hasPermission"`) are UX, never security. |
| B2 | Tenant ↔ tenant | another business's `business_id` / `branch_id` | Every query is scoped by `Tenantable`. A row is reachable only through its tenant scope — never by ID alone. |
| B3 | Module ↔ module | a sibling module's assumptions | Cross-module access via Service Contract or Event only. An event payload is data, not authority — the consumer re-authorizes. |
| B4 | API → infra (Postgres, Redis, MinIO, mailpit) | user-controlled strings reaching queries, keys, object paths, URLs | Parameterize; never build an object key or an outbound URL from raw user input. |
| B5 | SSR (Nuxt/Cloudflare Pages) → API | anything in `runtimeConfig.public` is **public** | Server-only secrets live in `runtimeConfig` (non-public) exclusively. Never proxy a client-supplied URL from SSR. |
| B6 | Queue/worker/cron → data | a job payload written earlier | Jobs re-resolve tenant + actor at execution time; never trust a serialized permission set. |
| B7 | Human → money/stock | cashier, staff, owner | Financial and stock mutations are append-only + audited. Correction = new compensating record, never silent overwrite. |

---

## 2 — Non-negotiable architecture invariants

A design that violates any of these is `RENTAN` by definition.

1. **Tenant isolation** — no endpoint, job, export, report, or notification can return a row from another `business_id`. `business_id` never comes from the request body.
2. **Server-side authority over value** — prices, discounts, totals, stock deltas, quota, shift balances, and payroll figures are computed server-side. The client sends *intent* (product id, qty), never *amounts*.
3. **Deny-by-default authorization** — a new route without an explicit `can:` / policy check is a bug, not a default. See project DNA §9d/§9j.
4. **Idempotency on money and stock** — POS checkout, payment, refund, stock receive/adjust, and shift close must be safe to retry (client key or DB unique constraint). Mobile networks retry; double-charging a warung customer is a real incident.
5. **Immutable audit for authority + money** — every role/permission change, login event, refund, void, price change, and stock adjustment is written via `AuditLogger` (project DNA §9i). Audit rows are never updated or deleted by app code.
6. **No new authority path** — a feature must not invent a second way to authenticate, authorize, or identify a tenant. One IAM, one permission table, one `Tenantable`.
7. **Secrets never cross to the client** — no API key, S3 credential, webhook secret, or DB DSN in `runtimeConfig.public`, in a Pinia store, in a Vue component, or in a browser extension bundle.
8. **PII minimization** — employee NIK, phone, address, salary, and customer data are collected only when a workflow needs them, returned only to roles that need them, and never logged.

---

## 3 — Threat model (run per feature; keep it short)

Answer these six. Two sentences each is enough — this is a gate, not a document.

1. **Assets** — what does this feature create or expose? (money, stock, identity, PII, authority)
2. **Actors** — who can reach it? Map to real roles: `cashier`, `kitchen-staff`, `viewer`, `business-owner`, unauthenticated.
3. **Entry points** — new routes, new store actions, new events, new jobs, new uploads, new outbound calls.
4. **Abuse cases** — for each actor, one sentence: *"If I were a malicious cashier, I would…"*. Always include: another tenant's owner, a fired employee whose token still lives, a curious `viewer`.
5. **Blast radius** — if this single component is fully compromised, what else falls? (one tenant / all tenants / money / identity)
6. **Controls** — which existing mechanism covers each abuse case? Name it. If the answer is "nothing yet", that is a finding.

**STRIDE-lite prompts** — Spoof (can identity be forged?) · Tamper (can a value be edited in flight?) · Repudiate (can it be denied later?) · Info leak (does the response over-return?) · DoS (is it unbounded?) · Elevate (can it grant authority?).

---

## 4 — Architecture red flags (catalog — match the design against this)

Each flag carries a default severity. Raise it one level if the surface is unauthenticated or touches money.

### Critical — reject the design
- `business_id` / `branch_id` / `user_id` accepted from the request body or query and trusted.
- Price, total, discount, or stock delta accepted from the client and persisted as-is.
- A route that mutates data with no `can:` middleware and no policy.
- Direct cross-module DB access (e.g. `Sales` writing `inventory_*` tables) — breaks both the module boundary and its authorization.
- Raw SQL / `whereRaw` / `DB::statement` built by concatenating request input.
- A new authentication path (magic string, shared token, `?token=`, device secret) alongside Sanctum.
- Secrets in `runtimeConfig.public`, in the repo, or in the browser-extension bundle.
- A "super admin" or "impersonate" capability reachable from the business admin UI.
- File upload written under `public/` or served by a path built from the user's filename.
- A permission-editing UI that lets a user grant a permission they do not hold (project DNA §9h.4).

### High — must be resolved before implementation
- Query by primary key without a tenant scope (`Model::find($id)` on a tenant-owned model) → IDOR.
- Money/stock mutation with no idempotency key and no unique constraint.
- Financial or authority change with no `AuditLogger` call.
- Unbounded list/export endpoint (no pagination, no period cap) → memory + data-exfiltration in one request.
- Unauthenticated or per-IP-only rate limiting on login, password reset, OTP, or plate-scan.
- API resource that returns the whole model (`toArray()`) instead of an explicit field list → silent PII/salary leak when a column is added later.
- Long-lived Sanctum token with no revocation path on employee offboarding.
- Outbound HTTP to a user-supplied URL (SSRF), including webhooks and image fetches.
- Soft-deleted or "cancelled" records still visible through a sibling endpoint.
- Permissions cached across a business switch (project DNA §9g).

### Medium — note, fix if cheap
- Frontend-only enforcement of a business rule that the API does not re-check.
- Error responses that echo internal identifiers, SQL, or stack traces.
- Logging full request bodies on POS/auth/HR routes.
- New dependency with no audit (`composer audit` / `npm audit`) or a stale transitive tree.
- Missing `httponly`/`secure`/`samesite` on the auth cookie; token stored in `localStorage`.
- No CSP / security headers on a page that renders user-supplied text.

### Also check when relevant to the feature
- **Offline/mobile POS**: what is the conflict-resolution rule, and can a client backdate a sale?
- **Reports/CSV export**: CSV formula injection (`=`, `+`, `-`, `@` prefixes) and tenant scope on aggregates.
- **Browser extension** (`SIPADI autofill`): what does it read, where does it send it, and what is its host permission scope? An autofill extension is a credential-adjacent surface — treat it as Critical-tier by default.
- **Notifications**: does the payload leak data the recipient's role cannot see?

---

## 5 — Verdict rule (this is the output that matters)

| Verdict | Meaning | Action |
|---|---|---|
| `AMAN` | No Critical/High. Design proceeds. | Implement; `security.md` handles the diff. |
| `PERLU PENGUATAN` | Only Medium findings, or High findings with a named cheap control. | Implement **with** the named controls in the same change. List them as acceptance criteria. |
| `RENTAN — BLOKIR` | ≥1 Critical, or a High with no control available. | **Do not implement.** Present the finding, the concrete exploit, and 1–2 safer designs with their trade-offs. Wait for the user to choose. |

On `RENTAN — BLOKIR`, always give the user a path forward — never just a refusal. Explain the risk in plain terms the owner of a warung would understand ("kasir bisa mengubah harga dari HP-nya sendiri"), then the fix.

**Unprompted advisory duty**: if, while doing any task, you notice a Critical flag in *existing* architecture outside the task's scope, report it in the output under "Temuan di luar scope" — but do **not** fix it uninvited (Project DNA §2.4 "extend, never replace"). Recommend it as a separate task.

---

## 6 — Output (append to task output, before the implementation summary)

> **Threat model**
> Aset · Aktor · Entry point · Blast radius — 1 line each.
>
> **Architecture findings**
> | # | Severity | Boundary/Invariant | Finding | Exploit (1 line) | Control |
> |---|---|---|---|---|---|
> | 1 | Critical/High/Medium | B2 / Invariant 1 | … | … | … |
>
> **Verdict**: `AMAN` / `PERLU PENGUATAN` / `RENTAN — BLOKIR` — one-line justification.
> **Temuan di luar scope** (optional): existing risks noticed, recommended as separate tasks.

No findings → "Tidak ada risiko arsitektural pada permukaan fitur ini. Verdict: AMAN." Do not pad the table.

---

## Do not
- Turn this into a full-codebase audit — that is `mode: review` with explicit scope.
- Re-check surfaces the feature does not touch.
- Propose enterprise controls (WAF rules, HSM, SIEM, pentest retainer) for a warung feature. Proportionality is part of being right.
- Restate `security.md`'s implementation checklist here.
- Block a design for a Medium finding.
