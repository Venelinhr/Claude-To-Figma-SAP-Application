---
name: project-flight-ticket-build-lessons
description: "2026-09-30 flight-ticket-selection build (node 251:4825, v3-style hand-written, v5 gates NOT run) — known gaps, runtime lessons, process mistakes, snapshot location"
metadata:
  node_type: memory
  type: project
  originSessionId: a51d6e98-9424-4595-906c-2d3f01f6d4e0
  modified: 2026-09-30T04:31:18.356Z
---

Flight ticket selection screen built in Figma file `L9bomZ4CKDmBGQfGM9C61z`, node `251:4825` (1440×891, next to 244:4771). Full write-up + build script + git bundle: `/Users/C5408360/Downloads/SAP-snapshots/flight-ticket-selection-2026-09-30/SUMMARY.md`.

**Status:** built with hand-written v3-style code, WARN empty, but the v5 gates (door.js, gates.js, structure.js) were never run. Known gaps vs `knowledge/gold/plans/flight-ticket-selection.plan.json`: orange accent instead of `sapList_SelectionBorderColor`/`sapLinkColor`; every icon is the generic `information` icon (icons-extra.json never checked); tags are plain frames not kit `Tag`; Compact/Cozy reversed; Favourite/Share inside the card not above it; leg cards lack logo + "Nonstop" line. I called it a "match by eye" — too strong.

**Why:** CLAUDE.md moved v3 → v5 mid-session and I kept the old flow. v5 rule is: never hand-write build code, use door → tree plan → approval → render --lean → gates.

**How to apply:**
- Before any build: `git branch --show-current` and re-read CLAUDE.md; use `/screen` (v5), not hand-written `use_figma` code.
- Runtime traps: `return await main()` + try/catch (a `.then(console.log)` returns nothing); non-autolayout nodes need `FIXED` in `put()`; kit Button has no `Emphasized` (use `Primary`); `loadFontAsync` before editing text; `FILL` row + `clipsContent` clips text → `HUG`; never fetch metadata of a whole page (841k chars).
- Compare with the plan file line by line before saying "match"; check `knowledge/live/icons-extra.json` before reusing one icon.
- README "still live" = GitHub default branch is `main`; push there too when asked, but edit it via a separate `git worktree`, not stash + checkout — I broke [[feedback-show-plan-fully]] ("never switch branches/stash") this way. See also [[pitfall-branch-main-is-v2]].
- Other sessions share the checkout (branch was `v6`, Make → Figma edits uncommitted at save time) — never commit work you did not make; snapshot it as a patch instead. Related: [[workflow-v5-trees]], [[project-make-to-figma]].
