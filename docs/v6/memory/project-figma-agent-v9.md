---
name: project-figma-agent-v9
description: Figma Agent skill v9 = the v6 workflow inside Figma — heavy parts stored in the file by the SAP Bridge plugin, the Agent types ~400-char fixed calls (2026-10-02)
metadata:
  type: project
---
The user wants the Figma Agent to run v6 "directly in Figma, really fast, exceptional results — NO 15-20 min" (the plugin text box took 20 min on the old v4 headless prompt). Built 2026-10-02, commit 3e75736. LIVE-TESTED 2026-10-02: plugin text box 33-39 s (was 3:53), Figma Agent chat ≈ 1:30 incl. the user's Approve (it now PLANS first, shows plan + layers, builds only after Approve — user rule), Claude Code /screen ≈ 50 s to the frame. Snapshot `docs/v6/SNAPSHOT-2026-10-02.md`, tag `v6-snapshot-2026-10-02`. In-file tools gained: compact ops (filters/cards+sem/table/steps/title), reflow, audits LENGTH/COVERAGE/FILTER/NOISE.
- `build/v6pack.js` → `/v6/pack` (bridge) → plugin `installV6()` writes keys `v6rt` (BUILD_TREE runtime), `v6build` (full kit + prelude helpers I/T/fill/stroke/AL/put/setP), `v6tools` (ops.js + sketch.js + `build/templates/v6-tools.js`), `gold_<name>` (door-checked trees from `knowledge/gold/trees` + `knowledge/gold/v6`), `v6_ver`.
- `v6-tools.js` modes: list · names · plan · build · check (in-Figma gate: layers / kit / texts / raw fills / text styles / size).
- `build/ops.js` = one ops language (set/remove/clone, no geometry) shared by `reskin.js` and the file.
- Lean skill `docs/v6/figma-agent-skill.md` (~7.5k chars vs 63k); old one `docs/v6/SKILL.v8.md`. The user copies it into `.claude/skills/sap-figma-agent/SKILL.md` (the user re-uploads it after every change: `open .claude/skills/sap-figma-agent`) and re-uploads it in the Figma Agent panel.
- The plugin "Claude builds" / "Figma Agent edits after" text box runs `bridge/prompts/job.md` (v6, run.js). Old v4 prompt kept as `job.v4.md`.
**Why:** speed + repeatability: no model ever types a screen layer by layer.
**How to apply:** new approved screens → copy their tree to `knowledge/gold/v6/` (door ALL IN) so the Agent can use them; after plugin code changes run `node build/plugin-bundle.js` and the user reopens SAP Bridge. See [[project-approval-timeline-gates]], [[feedback-show-plan-fully]].
