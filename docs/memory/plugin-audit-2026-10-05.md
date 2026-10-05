---
name: plugin-audit-2026-10-05
description: "What the 2026-10-05 plugin audit changed in SAP Bridge v2, and what is left (blocked bridge edits)"
metadata:
  type: project
---

Done in plugin-v2 (tests: `node --test plugin-v2/test/plugin.test.js`, drift guard `node plugin-v2/sync-make-engine.js --check`):
no user path in code (health `paths` from the bridge when present, else generic text) · ERRLOG/E() instead of empty catches + `log-get` · fetchT timeouts for both api() · adaptive health/mailbox timers · Make bridge port scan 41779, 41789–41795 · Health section in the info popover (health-get/health-report/health-fix) · "What next?" card after a Make build (make-options: Fix N differences = makeAudit/makeFix, Read the link again = make-resync replace/beside) · copy-whole-log icon (clipboard only) · history search · a11y (aria-labels, tablist keys, focus ring, live regions) · observers instead of 400/500 ms polling · esc() escapes > and ' · plugin always opens on the Claude tab.
build-make.js is DEPRECATED (needs --force; it would erase the glue) — use sync-make-engine.js.

NOT done (permission check blocked edits of bridge/server.js in the Application repo): `paths` in the bridge /health; chat "Connection refused" — probable cause: the bridge starts Claude with a short env list (ENV_KEEP), so proxy / cert / gateway variables of the user's terminal are missing; unverified. Also not reproduced: the empty-Make-tab bug.
Not run in real Figma: makeAudit / makeFix / make-resync (only a vm smoke test and a browser preview of the UI).

**Why:** audit asked by the user on 2026-10-05 ("Do all").
**How to apply:** after plugin edits run the plugin tests; never run build-make.js without a reason. Related: [[make-engine-sync]], [[plugin-default-claude-tab]].

Later the same day (user feedback): the header "copy whole log" icon was REMOVED (the per-history-row log icon stays); the Health section was REMOVED from the info popover (code.js still answers health-get, the UI no longer asks); history got a right-side "Clear history" text button (two clicks: "Sure? Clear all", then code.js `history-clear`) and 10 px space between cards and scroll bar; all tab hero texts fit in 2 lines at 300 px (user wants max 3).
