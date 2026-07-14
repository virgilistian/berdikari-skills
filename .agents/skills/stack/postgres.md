# Skill: PostgreSQL

Load when: keywords index/query plan/explain/deadlock/constraint, or a DB-level cause is suspected. Assumes core/* loaded.

## Docker service (source of truth: `docker-compose.yml`)
- **Image**: `postgres:16-alpine` · **Service**: `postgres` · **Port**: `5432`
- **Credentials**: user `berdikari`, password `secret`, database `berdikari`
- Connect: `docker compose exec postgres psql -U berdikari -d berdikari`
- Never connect from the host with a local `psql` install — use the container.

## Evidence first
- Schema truth: `docs/04-database-design.md`, then module `database/migrations/`.
- Slow/wrong query: get the actual SQL (Laravel query log / `DB::enableQueryLog`), then `EXPLAIN (ANALYZE, BUFFERS)`.
- Locking: `pg_stat_activity`, `pg_locks` for the blocked pid.

## Common causes
Missing/unused index, seq scan on large table, N+1 surfaced from Eloquent, wrong join cardinality, non-SARGable predicate (function on column), lock contention, transaction held open.

## Do not
Load unless a query/schema/index is the actual evidence. Optimize queries speculatively — prove the hot query first.
