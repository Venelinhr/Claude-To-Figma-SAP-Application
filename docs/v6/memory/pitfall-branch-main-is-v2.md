---
name: pitfall-branch-main-is-v2
description: "In this repo `main` = old v2 system (28 hooks, wireframe gates) — builds there cost 18 min/59k and produce placeholders; build only on `v6` (since 2026-09-29, user: \"work only in branch 6\"; `v5` = proven fallback, `v4` before it). ANOTHER SESSION shares the folder and once moved HEAD back to v5 — check the branch before every write"
metadata:
  node_type: memory
  type: feedback
  originSessionId: d8906426-7ce6-48c2-a407-597e4c9b7e42
  modified: 2026-09-30T05:04:14.342Z
---

Check `git branch --show-current` before any build. `main` = v2 (no route.js / element plan; heavy
gates), `v3` = history, `v4` = previous proven system (fallback), `v5` = current system (since 2026-09-28, user: "work here only v5"). A failed `git checkout` (dirty tree) silently leaves the
session on the old branch — the user ran two "v3" sessions that were really on `main`.

**Why:** 2026-09-27: session on `main` (thought to be v3) → 291:6032, 18 min / 59k tokens, "Tab Text",
"[swap slot]", emoji icons. Global skills `sap-bind` / `sap-vdi` also inject v2 rules into any branch.

**How to apply:** first command in a build session = branch check; if a checkout fails, `git stash -u`
then checkout. See [[workflow-v4-split]].
