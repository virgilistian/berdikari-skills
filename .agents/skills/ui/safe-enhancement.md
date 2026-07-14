# Skill: Safe Enhancement (overlay)

Load when: a task **adds to or extends existing behavior** and signals functionality must be preserved (e.g. "without changing", "keep behavior", "don't break", "additive"). Assumes core/* loaded; pairs with `minimal-change` and defers stack specifics to `nuxt-vue`/`laravel`.

## Purpose
Ensure enhancements are **additive, not destructive**: existing functionality, contracts, and behavior remain intact, and unrelated code is never touched.

## Responsibilities
- Establish the current behavior first (the invariant to preserve) before editing.
- Add new logic **alongside** existing code paths; avoid rewriting working branches.
- Preserve public contracts: props/emits, store actions/getters, route params, request/response shapes, event names.
- Keep changes within the named seam; never modify unrelated code to "tidy up".
- Confirm the enhancement is reversible and does not regress existing states (empty/loading/error/success).

## Inputs
- The requested enhancement and the explicit "must not change" invariant.
- The existing behavior/contract at the target seam (from core/investigation).

## Dependencies
- core: `investigation`, `search`, `context`.
- `minimal-change` (companion — keeps the diff bounded).
- `nuxt-vue` / `laravel` — for the stack-specific contract details.

## Stopping conditions
Stop once the enhancement is in place and every preserved contract/behavior is verified unchanged. Do not proceed to refactor working code or "improve" adjacent behavior — that requires an explicit `refactor`/`design` request.

## Outputs
- The additive change, plus an explicit list of behaviors/contracts confirmed unchanged and how they were verified.

## Success criteria
- Existing functionality passes exactly as before (test/path re-run or reasoned invariant).
- No unrelated file or code path modified.
- Change can be reverted without affecting pre-existing behavior.
