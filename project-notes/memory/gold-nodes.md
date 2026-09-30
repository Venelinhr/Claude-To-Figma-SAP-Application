---
name: gold-nodes
description: User-approved gold builds in Figma file L9bomZ4CKDmBGQfGM9C61z and their gold plans — start new screens of the same type from these
metadata:
  node_type: memory
  type: reference
  originSessionId: d8906426-7ce6-48c2-a407-597e4c9b7e42
  modified: 2026-09-27T11:05:22.233Z
---

Figma file `L9bomZ4CKDmBGQfGM9C61z` (Untitled):
- **174:4211** — German Kayak-style ticket selection (gold; real logos, 42 instances, plain layer names).
  Plan: `knowledge/gold/plans/flight-ticket-selection.plan.json`. Near-clone 200:5284 scored 8.
- **270:6722** — Bulgarian Wizz/Ryanair flight results, "99% match" (user, 2026-09-27; human-polished).
  Plan: `knowledge/gold/plans/flight-search-results.plan.json` (logo crops fixed in frame px).
- Do not reuse "◆SAP-UNBOUND" frames (237:5749, 239:4685, 244:4771) — unaudited, empty icon frames.

`node build/route.js --closest-gold ref.json "<words>"` picks the matching gold plan. See [[workflow-v4-split]].
