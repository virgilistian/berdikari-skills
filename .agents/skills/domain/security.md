# Skill: Security (domain)

Load when: always loaded for modes `feature`, `bugfix`, `refactor`, `review` — or when keywords security/auth/authorization/permission/validation/xss/csrf/ssrf/injection/upload/secret/token/password/rate-limit/sanitize appear. Assumes core/* loaded.

## Contract

**Run this checklist BEFORE implementing anything.** Identify vulnerabilities first; then implement with only the minimum security changes required. Do not change architecture, business logic, or code unless a security issue demands it.

## Pre-implementation security scan (ordered by risk)

Work through only the areas touched by the current task. Stop when no further relevant surface remains.

### 1 — Authentication & Authorization
- Confirm every route/controller has the correct auth middleware (IAM module). Check for missing `auth` or `sanctum` middleware on protected routes.
- Verify authorization (policy / Gate / role check) is enforced at the service layer, not only the controller.
- Flag privilege escalation: can a lower-privileged user reach a higher-privilege action?
- Principle of least privilege: scope tokens/abilities to the minimum required.

### 2 — Input Validation & Output Encoding
- Laravel: all inputs flow through a `FormRequest` (or explicit `$request->validated()`). Never trust `$request->all()` without validation.
- Validate type, length, format, and allowed values at the system boundary.
- Output encoding: blade auto-escapes `{{ }}` — ensure raw `{!! !!}` is used only for trusted/sanitized content.
- Reject unexpected fields (use `$request->safe()` or explicit picks).

### 3 — SQL Injection
- Eloquent / Query Builder parameterize by default. Flag any `DB::statement()`/`whereRaw()`/`selectRaw()` that interpolates user input.
- Never concatenate user input into a raw query.

### 4 — XSS
- Vue: `:html`/`v-html` is dangerous — flag any use with user-supplied data.
- Blade: `{!! !!}` — same rule.
- CSP headers: verify they are set in middleware or infra config.

### 5 — CSRF
- Laravel CSRF middleware (`VerifyCsrfToken`) must be active for state-changing web routes.
- API routes using Sanctum SPA authentication: confirm `EnsureFrontendRequestsAreStateful` is applied.
- Stateless API tokens do not need CSRF, but do need token-scope checks (see §1).

### 6 — SSRF
- Any code that makes outbound HTTP calls (Guzzle, `Http::`) using user-supplied URLs must validate the URL against an allowlist or block private/internal IP ranges.
- File includes triggered by user input are SSRF-equivalent — block them.

### 7 — File Upload Validation
- Validate MIME type server-side (not only client-side extension): use `$request->file()->getMimeType()` against an allowlist.
- Store uploads outside the webroot (MinIO / private disk). Never serve directly from `public/`.
- Sanitize filenames; never use the original filename as the stored key.
- Set max file size via `php.ini` + FormRequest `max` rule.

### 8 — Secrets Management
- No secrets, tokens, passwords, or API keys in source code, `.env.example` (real values), logs, or error messages.
- All secrets via environment variables; confirm `.env` is in `.gitignore`.
- Rotate any secret inadvertently committed; treat it as compromised.

### 9 — Session Security
- Session cookies: `httponly`, `secure` (HTTPS only), `samesite=lax` or `strict`. Confirm `config/session.php`.
- Regenerate session ID on privilege change (`$request->session()->regenerate()`).
- Short session lifetime for sensitive operations.

### 10 — Rate Limiting
- Unauthenticated endpoints (login, register, password reset, OTP, public search) must have a `throttle` middleware.
- Verify limits are tight enough to prevent brute-force; use `RateLimiter::for()` with per-IP + per-user keying.

### 11 — Dependency Vulnerabilities
- If `composer.json` or `package.json` changed, flag: run `composer audit` / `npm audit` before merging.
- Do not introduce new dependencies without checking their vulnerability history.

### 12 — Secure Configuration
- Debug mode (`APP_DEBUG`) must be `false` in production.
- Error details must not leak stack traces or SQL to the client in production.
- Confirm CORS origins (`config/cors.php`) are restrictive — no `*` on credentialed requests.
- HTTP security headers (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy) — verify middleware or infra handles them.

### 13 — Logging & Error Handling
- Log security events (failed auth, permission denial, suspicious input) at `warning` or above.
- Never log sensitive data: passwords, tokens, PII, full request bodies with credentials.
- Return generic error messages to clients; keep specifics in server logs only.
- Structured logging (use Laravel's log channels; correlate with request ID).

## Minimum-change rule

For each finding, ask: *"Is this exploitable in the current codebase?"* If yes → fix it, smallest diff possible. If theoretical or low-risk → document it as a finding, do not change code.

## Output (append to task output)

> **Security findings (pre-implementation scan)**
> | # | Severity | Area | Finding | Action |
> |---|---|---|---|---|
> | 1 | Critical/High/Medium/Low/Info | §N name | one-line description | Fixed / Noted / N/A |
>
> No new findings = write "No exploitable vulnerabilities found in the touched surface."

## Do not
- Load this skill to perform a standalone full-codebase audit — that is `mode: review` with explicit scope.
- Re-check areas not touched by the current task.
- Change architectural patterns, business logic, or existing code unless fixing a confirmed vulnerability.
