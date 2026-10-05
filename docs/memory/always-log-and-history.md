---
name: always-log-and-history
description: "Every task/change (build, direct Figma edit, fix) must be logged in the plugin (history row + log); run build/changelog.js after each direct change"
metadata:
  node_type: memory
  type: feedback
  originSessionId: b421efbc-fb98-4219-88d9-45d25321762e
  modified: 2026-10-05T05:09:58.206Z
---

User rule (2026-10-05): "always log for task and keep history" — when I change something, inform the plugin too, to keep history and log.

**Why:** the user wants to see and reopen every piece of work from the plugin (clock icon → frame link, copy icon → full log), not only full builds.
**How to apply:** builds already log through run.js (trace.md + plugin note). After ANY direct change in Figma (use_figma, hand fix) run `node build/changelog.js --job bridge-out/<job> --url <figma node link> "<what changed>"` in ~/Downloads/Claude-To-Figma-SAP-Application. It writes changes.md + trace.md and sends a note → plugin history row ("Change · …", older rows stay). Same rule is in bridge/prompts/chat.md and job.md. Related: [[plan-first-time-only]], [[plugin-first-builder]].
