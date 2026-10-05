---
name: plugin-default-claude-tab
description: "SAP Bridge v2 must always open on the Claude tab; the last used tab is not restored"
metadata:
  type: feedback
---

User rule (2026-10-05): "make sure when run the plugin — show default Claude tab selected."
Done in plugin-v2/ui.html: the saved `buildMode` is no longer restored at start (store-get removed, handler ignores it). Tab sessions inside one run are still kept.

**Why:** the user wants a predictable start; the Claude tab is the main one.
**How to apply:** never re-add restoring the last tab at start. Related: [[plugin-first-builder]].
