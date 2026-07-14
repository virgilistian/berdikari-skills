# Skill: API (domain)

Load when: keywords endpoint/route/request/response/DTO/status/auth token/CORS. Assumes core/* loaded. Pairs with `laravel` (server) or `nuxt-vue` (client).

## Contract-first
Truth = `docs/06-api-specification.md`. Compare spec ↔ implementation before assuming a bug.

## Trace
Route (`Modules/*/routes/api.php`) → controller → FormRequest validation → response (Resource/DTO) → status code. Auth via middleware (IAM module) before controller.

## Common causes
Validation rejecting valid input, wrong status code, response shape drift from spec, missing/incorrect auth middleware, CORS config, pagination envelope mismatch.

## Do not
Investigate business logic depth when the defect is at the contract boundary. Load `database` unless the cause is proven below the service.
