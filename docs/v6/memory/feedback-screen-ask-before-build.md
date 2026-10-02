---
name: feedback-screen-ask-before-build
description: "Claude Code /screen AND the Figma Agent chat ask (plan + Approve) BEFORE building; only the SAP Bridge plugin builds at once"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 6427442e-010d-425d-9659-4c227dce8ebb
  modified: 2026-10-02T10:31:50.142Z
---

User rule 2026-10-02 (extended same day): Claude Code `/screen` AND the Figma Agent chat (skill `sap-figma-agent`: MODE 'plan' → show plan + layers → Approve → MODE 'build') ask before they build. ONLY the SAP Bridge plugin text box builds at once. (First statement was Claude Code only; the user then said the Figma Agent must ask too.) Claude Code details: Every `run.js` call of the command carries `--ask` (exit 5 = plan printed, no Figma call); on "Approve" resume without `--ask` to build. Text jobs: NEED (exit 2) → ops.json → `--resume --spec-json ops.json --ask` → approve → `--resume`.

**Why:** the user saw a frame appear in Figma before any approval and asked why (job 680:52140). The SAP Bridge plugin (`bridge/prompts/job.md`) stays build-first, review after, because speed is the goal there (33-39 s). The Figma Agent built before approval in the user's test, so the skill now asks.

**How to apply:** never remove `--ask` from `docs/v6/screen.md` / `.claude/commands/screen.md`; never add it to `bridge/prompts/job.md`; keep the Figma Agent skill's PLAN→ASK→BUILD order (`docs/v6/figma-agent-skill.md`, copy to `.claude/skills/sap-figma-agent/SKILL.md`, user re-uploads it). After edits to `docs/v6/screen.md` re-run `cp docs/v6/screen.md .claude/commands/screen.md`. Related: [[workflow-v6-build-first]], [[feedback-show-plan-fully]].
