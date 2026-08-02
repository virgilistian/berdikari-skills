# Mode: review

Core: investigation, context. Skills: project map + matched stack/domain skills for the area under review.

## Steps
1. **Criteria** — restate what "good" means for this review (correctness, security, convention, design). Bound scope to named files/area.
2. **Read the target** — one wide read of the subject. Do not expand beyond the stated scope.
3. **Assess against criteria** — cite exact lines. Separate proven issues from opinions.
4. **Architecture security pass** — run `security-architecture` §4 against the reviewed surface (trust boundaries, invariants, red-flag catalog), then `security` for bug classes in the code itself.
5. **Prioritize** — rank findings by severity (blocker/major/minor). Reference OWASP for security items.
6. **Recommend** — concrete, minimal changes per finding. Do not implement unless asked.

## Early stop
Stop when the scoped target is assessed against all criteria.

## Output
- Findings table (severity, file+line, issue, fix), plus a one-line verdict and the architecture verdict (`AMAN` / `PERLU PENGUATAN` / `RENTAN — BLOKIR`).
