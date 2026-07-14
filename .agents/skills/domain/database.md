# Skill: Database (domain)

Load when: keywords SQL/ETL/report/sync/worker/cron/aggregation/persistence/N+1/transaction. Assumes core/* loaded. Escalate to `postgres` for plan/index-level work.

## Scope (Principle 10)
Data lifecycle: persistence, batch/ETL, scheduled jobs, aggregation, cross-store sync. Not UI, not request routing.

## Trace
Writer/reader (model or query builder) → transaction boundary → migration schema → scheduled command / queued job (`app/Console`, module jobs) → data volume assumptions.

## Common causes
N+1 from lazy relations, missing transaction/atomicity, non-idempotent job re-run, batch memory blowups (no chunking), aggregation off-by-timezone, drift between source and synced store.

## Do not
Load for a simple CRUD endpoint bug (that's `api`+`laravel`). Read whole datasets — sample and reason.
