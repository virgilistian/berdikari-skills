# Mode: deploy

Core: context only. Skills: `deployment` (always here); add `docker`/`kubernetes`/`redis`/`minio`/`postgres` only if the task names them.

## Steps
1. **Target** — restate environment, artifact, and desired end state (release / rollback / migrate).
2. **Reference** — read only the relevant part of `docs/14-deployment-guide.md` and `docs/09-infrastructure.md`. Do not read code.
3. **Preconditions** — confirm required env/secrets/migrations from the guide. List gaps.
4. **Plan** — ordered, reversible steps; identify the rollback path before acting.
5. **Confirm before irreversible action** — pushes, prod migrations, scaling, secret changes need explicit user go-ahead.

## Early stop
Stop when the plan is produced (plan tasks) or the deploy is verified healthy (execution tasks).

## Output
- Ordered steps, rollback path, preconditions/gaps, and (if executed) health verification.
