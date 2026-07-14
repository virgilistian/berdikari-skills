# Skill: Deployment (domain)

Load when: mode deploy, or keywords deploy/release/rollback/pipeline/ci/cd/env/secret/provision. Assumes core/context loaded.
## Source of truth
`docker-compose.yml` (repo root) is the **single source of truth** for service versions, ports, credentials, and environment configuration. When generating or verifying env vars or service config, always read from `docker-compose.yml` first — never infer from `.env.example` or memory.

## Standard local workflow
```bash
# Start full stack
docker compose up -d

# Run migrations after schema changes
docker compose exec api php artisan migrate

# Install/update PHP dependencies
docker compose exec api composer install

# Check service health
docker compose ps
```
## Reference-first (no code reads)
`docs/14-deployment-guide.md` (procedure), `docs/09-infrastructure.md` (topology), `docs/10-security.md` (secrets). Read only the relevant section.

## Procedure
1. Confirm target env + artifact version.
2. Preconditions: migrations, env/secrets, image built & tagged.
3. Ordered, reversible plan; define rollback before acting.
4. Escalate to `docker`/`kubernetes` only for the specific step.

## Safety
Irreversible actions (prod migrate, push, scale, secret rotate, force) require explicit user confirmation. Never `--no-verify` or skip checks.

## Do not
Investigate application logic. Load stack skills you won't act on.
