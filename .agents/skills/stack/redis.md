# Skill: Redis

Load when: keywords cache/queue/lock/ttl/throttle/session. Assumes core/* loaded.

## Docker service (source of truth: `docker-compose.yml`)
- **Image**: `redis:7-alpine` · **Service**: `redis` · **Port**: `6379`
- Connect: `docker compose exec redis redis-cli`
- Never connect from the host with a local `redis-cli` install — use the container.
- Laravel config: `REDIS_CLIENT=phpredis`, `REDIS_HOST=redis`, `REDIS_PORT=6379`.

## Roles here
Cache, queue backend, locks, rate-limit, session store (see `config/*` + `docs/09-infrastructure.md`).

## Evidence
- Cache: key builder + TTL; stale value → confirm invalidation on write.
- Queue: is the worker running? failed_jobs? connection = redis in config.
- Lock: `Cache::lock()` name + owner; deadlock/never-released.

## Common causes
Stale cache (no invalidation), unbounded TTL, queue not processed, lock never released, key collision across tenants.

## Do not
Load for generic performance questions unless a Redis role is implicated.
