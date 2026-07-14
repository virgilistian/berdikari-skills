# Skill: Docker — Berdikari Environment

Load when: mode deploy with container work, or keywords dockerfile/compose/image/container/exec. Assumes core/* loaded.

## Source of truth
`docker-compose.yml` (repo root) is the **single source of truth** for all service versions, ports, environment variables, and configuration. Never reference host-installed versions or `.env` values that contradict `docker-compose.yml`.

## Service catalogue (from `docker-compose.yml`)

| Service | Image | Host port(s) | Notes |
|---|---|---|---|
| `nginx` | `nginx:alpine` | `80` | Reverse proxy for `berdikari.test`; config at `berdikari-api/docker/nginx/default.conf` |
| `api` | `php:8.3-fpm-alpine` + `composer:2` | `8000` | Also reachable directly at `localhost:8000` |
| `postgres` | `postgres:16-alpine` | `5432` | — |
| `redis` | `redis:7-alpine` | `6379` | — |
| `minio` | `minio/minio:latest` | `9000` (S3), `9001` (console) | — |
| `mailpit` | `axllent/mailpit:latest` | `8025` (UI), `1025` (SMTP) | — |

**Custom domain**: `http://berdikari.test` routes through the `nginx` container to `api:8000`.
One-time host setup: `echo '127.0.0.1 berdikari.test' | sudo tee -a /etc/hosts`

All inter-service communication uses the service name as the hostname (e.g. `DB_HOST=postgres`, `REDIS_HOST=redis`).

## Standard commands (always use these — never run on host)

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# --- API (Laravel / PHP) ---
docker compose exec api php artisan <command>
docker compose exec api composer <command>
docker compose exec api sh   # interactive shell

# --- PostgreSQL ---
docker compose exec postgres psql -U berdikari -d berdikari

# --- Redis ---
docker compose exec redis redis-cli

# --- MinIO (mc CLI) ---
docker compose exec minio mc <command>

# View logs for a service
docker compose logs -f <service>

# Rebuild after Dockerfile changes
docker compose build api && docker compose up -d api
```

## Evidence
- `Dockerfile`(s) + `docker-compose.yml` + `docs/14-deployment-guide.md`.
- Build failure: the failing layer/step only. Runtime: entrypoint, env, mounted volumes, exposed ports.

## Common causes
Missing build arg/env, wrong base image/PHP ext, cache-busted layer order, volume overshadowing built files, entrypoint permissions.

## Do not
Read application code. Rebuild speculatively — read the failing step first.
