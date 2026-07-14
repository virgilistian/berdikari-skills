# Skill: Minimal Change (overlay)

Load when: a task should be delivered with the **smallest possible diff** (default for enhancements/bugfixes; explicit when the task says "minimal", "small change", "don't refactor", "without touching X"). Assumes core/* loaded; companion to `safe-enhancement`.

## Purpose
Keep the change surface minimal: the Git diff as small as the task allows, with no incidental refactoring, renaming, file moves, reformatting, or architectural change.

## Responsibilities
- Edit the fewest lines/files that satisfy the requirement.
- No opportunistic renames, reorders, import reshuffles, or reformatting of untouched code.
- No file creation/move unless the task cannot be met otherwise (then justify it).
- Preserve surrounding formatting and style exactly; touch only the target seam.
- If a broader refactor seems warranted, **note it as a follow-up** — do not perform it.

## Inputs
- The precise requirement and its target seam (files/lines from core/investigation).
- The set of files strictly necessary to change.

## Dependencies
- core: `investigation`, `context`.
- `safe-enhancement` (companion — keeps changes additive within the small diff).

## Stopping conditions
Stop the moment the requirement is met with the minimal edit. Do not expand scope to adjacent improvements, style fixes, or structural changes — those need an explicit `refactor` request.

## Outputs
- The minimal diff, plus any deferred-improvement notes listed separately (not applied).

## Success criteria
- Diff limited to lines strictly required by the task.
- No renames, moves, reformatting, or refactors of unrelated code.
- Any larger cleanup is recorded as a follow-up, not executed.
