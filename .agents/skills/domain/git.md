# Skill: Git (domain)

Load when: keywords git/branch/commit/blame/bisect/revert/regression/"since when". Assumes core/* loaded.

## Purpose
Timeline evidence for RCA — not routine VCS chores.

## High-value, low-token moves
- `git log -L` / `git blame` on the **one** suspect symbol (not the file history dump).
- `git bisect` when a known-good and known-bad point exist.
- `git log --oneline <range> -- <path>` scoped to the suspect file.

## Discipline
Correlation (a commit near the breakage) is a lead, not proof — confirm in code (core/investigation).

## Safety
Never force-push, hard-reset published history, or amend pushed commits without explicit user confirmation.
