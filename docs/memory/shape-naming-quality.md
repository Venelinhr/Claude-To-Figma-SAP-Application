---
name: shape-naming-quality
description: "Shape/icon naming in run.js is the biggest quality lever for from-zero SAP builds; never \"skip\" visible shapes"
metadata:
  node_type: memory
  type: feedback
  originSessionId: cc0f9f51-a51a-4fe9-ba4e-5d11b27fbd93
  modified: 2026-10-04T09:03:04.797Z
---

When run.js asks to name shapes (`--icons "WxH=…"`): UI icon → kit icon · logo/flag/badge → `image` · OCR-missed text → `text:<s>:<style>` · control → `comp:<kit part>` (e.g. `comp:Check Box`) · `skip` only for noise < 8 px.

**Why:** 2026-10-04 flight screen: careless `skip` names dropped 41 elements, EYE 38 %; correct names alone gave EYE 52 % (same code).
**How to apply:** look at icons-sheet.png once, name every number by these rules. Related: [[plugin-first-builder]].
