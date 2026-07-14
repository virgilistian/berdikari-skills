# Core: Context Loading & Early Stop (shared, loaded once)

Referenced by every mode. Controls token budget.

## Context minimization (Principle 5)

Load only: the selected mode, matched skills, named-evidence files, and directly-relevant history.
Never load: unmatched skills, whole modules, docs not cited by the task, prior unrelated turns.

## Budget model

Each investigation has a soft budget. Track loaded weight using `manifest.yaml` `cost` values plus file reads.

| Mode | Soft budget (target) | Hard ceiling |
|---|---|---|
| ask | 8k | 20k |
| bugfix | 25k | 60k |
| rca | 30k | 70k |
| feature | 35k | 80k |
| refactor | 25k | 60k |
| review | 30k | 70k |
| deploy | 20k | 50k |

At 70% of soft budget: stop expanding, commit to the best-supported hypothesis, verify it directly.
At hard ceiling: stop, report findings + confidence + the single next action needed. Do not silently continue.

## Early stop (Principle 7) — stop at the FIRST that is true

- Root cause proven (exact file+line).
- Fix identified and its blast radius known.
- Feature acceptance criteria met.
- Requested output produced.
- Confidence high and further reads cannot change the conclusion.

Stopping early is success, not incompleteness. Report confidence honestly instead of over-reading.

## Loading order (cheapest first, stop when answered)

1. Project map (targeted section only).
2. The one ranked file.
3. One matched stack skill (if code work).
4. One domain skill (only if triggered).
Add more only when the current level fails to answer.
