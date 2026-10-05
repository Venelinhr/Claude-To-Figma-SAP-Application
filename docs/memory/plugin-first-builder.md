---
name: plugin-first-builder
description: SAP screen builds must run through the SAP Bridge v2 plugin + scripts (free); Claude/MCP only for emergencies
metadata:
  node_type: memory
  type: feedback
  originSessionId: 1cfa94a4-607c-45a6-84aa-aeb87d59228b
  modified: 2026-10-04T08:40:23.245Z
---

Build SAP screens with `node build/run.js` (in ~/Downloads/Claude-To-Figma-SAP-Application) → plugin SAP Bridge v2 builds. Claude hand-design (DESIGN/NEW lanes) and Figma MCP only when asked or as emergency.

**Why:** 2026-10-04 a model-designed run cost 74k tokens / 13 min / $9.5 with no result; scripted path builds in ~20 s.
**How to apply:** after any runtime change run `node build/plugin-bundle.js` (it updates v1 AND `plugin-v2/code.js`), then the user reopens SAP Bridge v2. The plugin must show progress as a chat timeline (run.js → bridge `/note` → plugin).
