---
name: sap-design-lane-default
description: "Every plugin route must produce a real SAP screen; image builds use the DESIGN lane by default (Claude picks kit parts), never the 1:1 pixel copy"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 9b1b3791-d32d-4b47-bf47-3da1d4897359
  modified: 2026-10-05T18:24:27.437Z
---

The plugin is for the SAP world: every route (Claude tab image/text → Figma, Agent tab → Figma Agent, Make tab → Make) must produce a real SAP Fiori screen built from SAP Web UI Kit components, not frames + cut-out pictures.

**Why:** 2026-10-05 the free scripted image path built a pixel copy (frames, crops, 3 components); user: "I see frames, not SAP components" and "make sure to build every time".

**How to apply:**
- `build/run.js`: design lane is default for images (`!flag('--copy')`); `--copy` = old 1:1 copy only on request.
- `bridge/server.js` exit-2 handover prompt tells Claude to map every region to a kit part (Button, Link, Check Box, Object Status, Icon Button, SAP icons; images only for logos/photos).
- Agent tab: `plugin-v2/code.js` SAP_AGENT_RULES prefix on a new Agent chat. Make tab: SAP prompt in `ui.html` makeHandoff.
- After changing build/ templates run `node build/plugin-bundle.js`, then the user must reopen the plugin (else "PLUGIN OUT OF DATE" and nothing builds). See [[plugin-first-builder]].
- 2026-10-06 lesson: a Sonnet design step cloned the screenshot box by box, used "#id" prop keys and hand-edited tree.json (skipping sap-spacing) → user score 20/100. Must work with ANY model (default Sonnet, user 2026-10-06): no model override; quality comes from the guardrails — the design step reads the gold example knowledge/gold/design/flight-results.design-spec.json, run.js design norm strips "#id", sets Label:true, fixes invented/ink tokens, unwraps invisible boxes. Never let the model edit tree.json.
