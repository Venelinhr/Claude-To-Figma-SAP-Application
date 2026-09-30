---
name: feedback-show-plan-fully
description: Every /screen plan reply must PASTE the ASCII wireframe, the L1-L5 layer tree and the SAP components table (terminal folds tool output)
metadata:
  type: feedback
---
The user sees only what Claude writes; tool output is folded. A summary instead of the full ASCII / layer tree / components table = failed reply (user had to ask "where is ASCII / tree?" twice, 2026-09-29). **Why:** it is the approval artefact, same as `main`. **How to apply:** paste WIREFRAME, L1-L5, SAP COMPONENTS verbatim in ``` fences + zones table + confidence table, then "Approve / Reject / Modify?". Rule is at the top of step 3 in .claude/commands/screen.md. Also: never switch git branches / stash in this repo while sessions run (a `checkout main` stashed all work twice; recover with `git stash pop` on v5); commit early on v5.
