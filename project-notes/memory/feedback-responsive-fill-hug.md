---
name: feedback-responsive-fill-hug
description: Auto-layout FILL/HUG must always be right so every built screen resizes; door.js enforces it
metadata:
  type: feedback
---
Every screen must resize (FILL/HUG correct, no free placement, one FILL child per row). **Why:** user asked "fill, hug is always perfect – resize with responsiveness". **How to apply:** `door.js` rule `responsive` + `spec2tree.js` bands/rows; see [[workflow-v5-trees]].
